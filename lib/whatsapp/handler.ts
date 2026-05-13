import type { Message } from 'whatsapp-web.js'
import { prisma } from '@/lib/prisma'
import { parseMessage, guessCategory } from './parser'
import { transcribeAudio } from './transcribe'
import { botLog } from './logger'
import {
  transactionPreview,
  transactionCancelled,
  transactionConfirmation,
  editPrompt,
  editAborted,
  installmentConfirmation,
  recurringCreated,
  listRecurrences,
  recurringCancelled,
  recurringAltered,
  monthlySummary,
  categoryBreakdown,
  lastTransactions,
  deleteConfirmPrompt,
  deleteSuccess,
  deleteAborted,
  helpMessage,
  unknownMessage,
} from './responses'

type PendingTx = {
  type: 'expense' | 'income'
  description: string
  amount: number
  categoryId: string
  categoryEmoji: string
  categoryName: string
  date?: Date
}

const pendingTransaction = new Map<string, PendingTx>()  // userId → dados da transação pendente
const pendingEdit        = new Map<string, string>()     // userId → transactionId aguardando edição
const pendingDeletion    = new Map<string, string>()     // userId → transactionId aguardando exclusão

const PT_MONTHS: Record<string, number> = {
  janeiro: 0, fevereiro: 1, 'março': 2, marco: 2, abril: 3, maio: 4,
  junho: 5, julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
}

function parseDateChange(text: string): Date | null {
  const lower = text.toLowerCase().trim()
  const now = new Date()

  if (/pr[oó]ximo\s+m[eê]s/.test(lower))
    return new Date(now.getFullYear(), now.getMonth() + 1, 1)

  if (/m[eê]s\s+passado/.test(lower))
    return new Date(now.getFullYear(), now.getMonth() - 1, 1)

  if (lower === 'hoje') return new Date()

  const textMatch = lower.match(/(\d{1,2})\s+de\s+(\w+?)(?:\s+de\s+(\d{4}))?$/)
  if (textMatch) {
    const day = parseInt(textMatch[1])
    const month = PT_MONTHS[textMatch[2]]
    if (month !== undefined) {
      const year = textMatch[3] ? parseInt(textMatch[3]) : now.getFullYear()
      return new Date(year, month, day)
    }
  }

  const slashMatch = lower.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/)
  if (slashMatch) {
    const day = parseInt(slashMatch[1])
    const month = parseInt(slashMatch[2]) - 1
    const year = slashMatch[3] ? parseInt(slashMatch[3]) : now.getFullYear()
    return new Date(year, month, day)
  }

  return null
}

function parseInstallments(text: string): number | null {
  const match = text.match(/parcelado\s+(\d+)\s*x(?:ezes?)?/i)
    ?? text.match(/(\d+)\s*x(?:\s+vezes?)?/i)
    ?? text.match(/(\d+)\s*vezes?/i)
  if (!match) return null
  const n = parseInt(match[1], 10)
  return n >= 2 && n <= 60 ? n : null
}

const RECURRING_KEYWORDS = ['recorrente', 'recorrência', 'recorrencia', 'todo mês', 'todo mes', 'mensalmente', 'mensal']

async function getBotConfig() {
  return prisma.botConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  })
}

async function findOrCreateUser(phone: string, name: string) {
  return prisma.user.upsert({
    where: { phone },
    update: {},
    create: { phone, name, allowed: false },
  })
}

export async function handleIncomingMessage(message: Message) {
  if (message.from === 'status@broadcast') return

  botLog(`[msg] from=${message.from} type=${message.type}`)

  const contact = await message.getContact()
  const phone = message.from.replace('@c.us', '').replace('@g.us', '')
  const name = contact.pushname || contact.name || phone

  const config = await getBotConfig()

  if (config.mode === 'SHARED') {
    if (!config.sharedSource || message.from !== config.sharedSource) return
  }

  const user = await findOrCreateUser(phone, name)

  if (config.mode === 'DEDICATED' && !user.allowed) return

  let messageText = message.body

  if (message.hasMedia && (message.type === 'ptt' || message.type === 'audio')) {
    const transcribed = await transcribeAudio(message)
    if (!transcribed) {
      await message.reply('🎙️ Não consegui entender o áudio. Tente enviar como texto.')
      return
    }
    messageText = transcribed
    botLog(`[audio] transcrito: "${messageText}"`)
  }

  const normalized = messageText.trim().toLowerCase()

  // ── Estado: confirmação de exclusão pendente ──────────────────────────────
  if (pendingDeletion.has(user.id)) {
    const isYes = ['sim', 's', 'confirmar', 'confirmado', 'ok'].includes(normalized)
    const isNo  = ['não', 'nao', 'n', 'cancelar'].includes(normalized)

    if (isYes || isNo) {
      const transactionId = pendingDeletion.get(user.id)!
      pendingDeletion.delete(user.id)

      if (isYes) {
        const deleted = await prisma.transaction.delete({
          where: { id: transactionId },
          include: { category: true },
        })
        await message.reply(deleteSuccess(deleted))
      } else {
        await message.reply(deleteAborted())
      }
      return
    }

    pendingDeletion.delete(user.id)
  }

  // ── Estado: edição pendente ───────────────────────────────────────────────
  if (pendingEdit.has(user.id)) {
    const isNo  = ['não', 'nao', 'n', 'cancelar'].includes(normalized)

    if (isNo) {
      pendingEdit.delete(user.id)
      await message.reply(editAborted())
      return
    }

    const times   = parseInstallments(normalized)
    const newDate = parseDateChange(normalized)

    if (times || newDate) {
      const transactionId = pendingEdit.get(user.id)!
      pendingEdit.delete(user.id)

      const original = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { category: true },
      })

      if (!original) {
        await message.reply('❌ Lançamento não encontrado.')
        return
      }

      if (times) {
        const installmentAmount = Number(original.amount) / times
        const baseDate = newDate ?? new Date(original.date)

        await prisma.transaction.delete({ where: { id: transactionId } })

        for (let i = 0; i < times; i++) {
          const date = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, baseDate.getDate())
          await prisma.transaction.create({
            data: {
              type: original.type,
              description: `${original.description} (${i + 1}/${times})`,
              amount: installmentAmount,
              date,
              userId: user.id,
              categoryId: original.categoryId,
            },
          })
        }

        await message.reply(
          installmentConfirmation(original.description, times, installmentAmount, Number(original.amount)),
        )
      } else if (newDate) {
        const updated = await prisma.transaction.update({
          where: { id: transactionId },
          data: { date: newDate },
          include: { category: true },
        })
        const dateStr = newDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        await message.reply(`📅 Data alterada para *${dateStr}*.\n\n${updated.category.emoji} ${updated.description} — ${updated.category.name}`)
      }
      return
    }

    await message.reply('Não entendi. Diga *parcelado Nx*, uma data como *19/04* ou *próximo mês*, ou *não* para cancelar.')
    return
  }

  // ── Estado: nova transação aguardando confirmação ─────────────────────────
  if (pendingTransaction.has(user.id)) {
    const pending = pendingTransaction.get(user.id)!
    const isYes      = ['sim', 's', 'ok', 'confirmar', 'confirmado'].includes(normalized)
    const isNo       = ['não', 'nao', 'n', 'cancelar'].includes(normalized)
    const times      = parseInstallments(normalized)
    const newDate    = parseDateChange(normalized)
    const isRecurring = RECURRING_KEYWORDS.some((k) => normalized.includes(k))

    if (isNo) {
      pendingTransaction.delete(user.id)
      await message.reply(transactionCancelled())
      return
    }

    if (isRecurring) {
      pendingTransaction.delete(user.id)
      const recurrence = await prisma.recurrence.create({
        data: {
          type: pending.type === 'income' ? 'INCOME' : 'EXPENSE',
          description: pending.description,
          amount: pending.amount,
          dayOfMonth: (pending.date ?? new Date()).getDate(),
          userId: user.id,
          categoryId: pending.categoryId,
        },
        include: { category: true },
      })
      await message.reply(recurringCreated(recurrence))
      return
    }

    if (newDate && !times) {
      pendingTransaction.set(user.id, { ...pending, date: newDate })
      const dateStr = newDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      await message.reply(`📅 Data alterada para *${dateStr}*. Confirma? Responda *sim* ou *não*.`)
      return
    }

    if (isYes || times) {
      pendingTransaction.delete(user.id)
      const txDate = pending.date ?? new Date()

      if (times) {
        const installmentAmount = pending.amount / times

        for (let i = 0; i < times; i++) {
          const date = new Date(txDate.getFullYear(), txDate.getMonth() + i, txDate.getDate())
          await prisma.transaction.create({
            data: {
              type: pending.type === 'income' ? 'INCOME' : 'EXPENSE',
              description: `${pending.description} (${i + 1}/${times})`,
              amount: installmentAmount,
              date,
              userId: user.id,
              categoryId: pending.categoryId,
            },
          })
        }

        await message.reply(
          installmentConfirmation(pending.description, times, installmentAmount, pending.amount),
        )
      } else {
        const transaction = await prisma.transaction.create({
          data: {
            type: pending.type === 'income' ? 'INCOME' : 'EXPENSE',
            description: pending.description,
            amount: pending.amount,
            date: txDate,
            userId: user.id,
            categoryId: pending.categoryId,
          },
          include: { category: true },
        })
        await message.reply(transactionConfirmation(transaction, user))
      }
      return
    }

    await message.reply('Por favor, responda *sim*, *não*, *parcelado Nx*, *recorrente* ou uma data como *próximo mês* / *19/04*.')
    return
  }

  // ── Processar nova mensagem ───────────────────────────────────────────────
  const command = parseMessage(messageText)
  const categories = await prisma.category.findMany()

  switch (command.type) {
    case 'expense':
    case 'income': {
      await message.reply('⏳ Processando...')

      const categoryName = guessCategory(command.data.description, categories)
      const category = categories.find((c) => c.name === categoryName) ?? categories.find((c) => c.name === 'Outros')!

      pendingTransaction.set(user.id, {
        type: command.type,
        description: command.data.description,
        amount: command.data.amount,
        categoryId: category.id,
        categoryEmoji: category.emoji,
        categoryName: category.name,
      })

      await message.reply(
        transactionPreview(command.type, command.data.description, command.data.amount, category.emoji, category.name),
      )
      break
    }

    case 'list_recurring': {
      const recurrences = await prisma.recurrence.findMany({
        where: { userId: user.id, active: true },
        include: { category: true },
        orderBy: { createdAt: 'asc' },
      })
      await message.reply(listRecurrences(recurrences))
      break
    }

    case 'cancel_recurring': {
      const activeOnes = await prisma.recurrence.findMany({
        where: { userId: user.id, active: true },
        include: { category: true },
        orderBy: { createdAt: 'asc' },
      })
      const target = activeOnes[command.ref - 1]
      if (!target) {
        await message.reply(`❌ Recorrência R${command.ref} não encontrada. Use *recorrências* para ver a lista.`)
        break
      }
      await prisma.recurrence.update({ where: { id: target.id }, data: { active: false } })
      await message.reply(recurringCancelled(target))
      break
    }

    case 'alter_recurring': {
      const activeOnes = await prisma.recurrence.findMany({
        where: { userId: user.id, active: true },
        include: { category: true },
        orderBy: { createdAt: 'asc' },
      })
      const target = activeOnes[command.ref - 1]
      if (!target) {
        await message.reply(`❌ Recorrência R${command.ref} não encontrada. Use *recorrências* para ver a lista.`)
        break
      }
      const oldAmount = Number(target.amount)
      const updated = await prisma.recurrence.update({
        where: { id: target.id },
        data: { amount: command.amount },
        include: { category: true },
      })
      await message.reply(recurringAltered(updated, oldAmount))
      break
    }

    case 'edit_last': {
      const last = await prisma.transaction.findFirst({
        where: { userId: user.id },
        orderBy: { date: 'desc' },
        include: { category: true },
      })
      if (!last) {
        await message.reply('Nenhum lançamento encontrado para editar.')
        break
      }
      pendingEdit.set(user.id, last.id)
      await message.reply(editPrompt(last))
      break
    }

    case 'summary': {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

      const [transactions, recurrences] = await Promise.all([
        prisma.transaction.findMany({
          where: { date: { gte: start, lte: end } },
          include: { category: true },
          orderBy: { date: 'desc' },
        }),
        prisma.recurrence.findMany({
          where: { active: true },
          include: { category: true },
        }),
      ])

      const month = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      await message.reply(monthlySummary(transactions, month, recurrences))
      break
    }

    case 'summary_category': {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

      const [transactions, recurrences] = await Promise.all([
        prisma.transaction.findMany({
          where: { date: { gte: start, lte: end }, type: 'EXPENSE' },
          include: { category: true },
        }),
        prisma.recurrence.findMany({
          where: { active: true },
          include: { category: true },
        }),
      ])

      const month = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      await message.reply(categoryBreakdown(transactions, month, recurrences))
      break
    }

    case 'last_transactions': {
      const transactions = await prisma.transaction.findMany({
        take: 10,
        include: { category: true },
        orderBy: { date: 'desc' },
      })
      await message.reply(lastTransactions(transactions))
      break
    }

    case 'delete_last': {
      const last = await prisma.transaction.findFirst({
        where: { userId: user.id },
        orderBy: { date: 'desc' },
        include: { category: true },
      })
      if (!last) {
        await message.reply('Nenhum lançamento encontrado para cancelar.')
        break
      }
      pendingDeletion.set(user.id, last.id)
      await message.reply(deleteConfirmPrompt(last))
      break
    }

    case 'help': {
      await message.reply(helpMessage())
      break
    }

    default: {
      await message.reply(unknownMessage())
    }
  }
}
