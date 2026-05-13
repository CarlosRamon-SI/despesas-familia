import type { Transaction, Category, User, Recurrence } from '@prisma/client'
import type { Decimal } from '@prisma/client/runtime/library'

type TransactionWithCategory = Transaction & { category: Category }
type RecurrenceWithCategory  = Recurrence & { category: Category }

export function formatCurrency(value: Decimal | number): string {
  const num = typeof value === 'number' ? value : Number(value)
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function transactionPreview(
  txType: 'expense' | 'income',
  description: string,
  amount: number,
  categoryEmoji: string,
  categoryName: string,
): string {
  const isIncome = txType === 'income'
  const icon     = isIncome ? '💰' : '🧾'
  const label    = isIncome ? 'Nova receita' : 'Nova despesa'
  return `${icon} *${label}*\n\n${categoryEmoji} *${categoryName}*\n📝 ${description}\n${isIncome ? '📈' : '📉'} ${formatCurrency(amount)}\n\nConfirma? Responda:\n• *sim* — confirmar\n• *não* — cancelar\n• *parcelado Nx* — parcelar (ex: parcelado 3x)\n• *recorrente* — lançar todo mês automaticamente\n• *próximo mês* ou *19/04* — registrar em outra data`
}

export function transactionCancelled(): string {
  return `↩️ Lançamento cancelado.`
}

export function transactionConfirmation(transaction: TransactionWithCategory, user: User): string {
  const isIncome = transaction.type === 'INCOME'
  const icon = isIncome ? '💰' : '✅'
  const label = isIncome ? '*Receita registrada!*' : '*Despesa registrada!*'

  return `${icon} ${label}\n\n${transaction.category.emoji} *${transaction.category.name}*\n📝 ${transaction.description}\n${isIncome ? '📈' : '📉'} ${formatCurrency(transaction.amount)}\n👤 ${user.name}\n\n_Envie *editar* para alterar._`
}

export function editPrompt(transaction: TransactionWithCategory): string {
  const type = transaction.type === 'INCOME' ? 'Receita' : 'Despesa'
  return `🖊️ *Editar lançamento*\n\n${transaction.category.emoji} ${type} — ${transaction.description} — ${formatCurrency(transaction.amount)}\n\nO que deseja alterar?\n• *parcelado 3x* — divide em parcelas mensais\n• *próximo mês* — registra no mês seguinte\n• *19 de abril* ou *19/04* — registra em data específica\n\nResponda *não* para cancelar.`
}

export function editAborted(): string {
  return `↩️ Edição cancelada.`
}

export function installmentConfirmation(
  description: string,
  times: number,
  installmentAmount: number,
  totalAmount: number,
): string {
  return `📅 *${times} parcelas registradas!*\n\n📝 ${description}\n💰 ${times}x de ${formatCurrency(installmentAmount)} = ${formatCurrency(totalAmount)}\n\nCada parcela foi lançada no mês correspondente.`
}

export function recurringCreated(recurrence: RecurrenceWithCategory): string {
  const isIncome = recurrence.type === 'INCOME'
  const icon  = isIncome ? '💰' : '📅'
  const label = isIncome ? 'Receita recorrente criada!' : 'Despesa recorrente criada!'
  return `${icon} *${label}*\n\n${recurrence.category.emoji} *${recurrence.category.name}*\n📝 ${recurrence.description}\n${isIncome ? '📈' : '📉'} ${formatCurrency(recurrence.amount)}/mês\n\nIncluída automaticamente no resumo mensal.\nUse *recorrências* para ver todas.`
}

export function listRecurrences(recurrences: RecurrenceWithCategory[]): string {
  if (recurrences.length === 0) {
    return `📅 *Recorrências ativas*\n\nNenhuma recorrência cadastrada.\n\nDiga *recorrente* ao confirmar um lançamento para criar uma.`
  }

  const lines = recurrences
    .map((r, i) => {
      const signal = r.type === 'INCOME' ? '+' : '-'
      return `*R${i + 1}* ${r.category.emoji} ${r.description}: *${signal}${formatCurrency(r.amount)}/mês*`
    })
    .join('\n')

  return `📅 *Recorrências ativas*\n\n${lines}\n\n• *cancelar R1* — desativa\n• *alterar R1 60* — muda o valor`
}

export function recurringCancelled(recurrence: RecurrenceWithCategory): string {
  return `✅ *Recorrência cancelada.*\n\n${recurrence.category.emoji} ${recurrence.description} — ${formatCurrency(recurrence.amount)}/mês\n\nNão será mais incluída no resumo.`
}

export function recurringAltered(recurrence: RecurrenceWithCategory, oldAmount: number): string {
  return `✅ *Valor atualizado.*\n\n${recurrence.category.emoji} ${recurrence.description}\n${formatCurrency(oldAmount)}/mês → *${formatCurrency(recurrence.amount)}/mês*`
}

export function monthlySummary(
  transactions: TransactionWithCategory[],
  month: string,
  recurrences: RecurrenceWithCategory[] = [],
): string {
  const txIncome  = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0)
  const txExpense = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0)
  const recIncome  = recurrences.filter((r) => r.type === 'INCOME').reduce((s, r) => s + Number(r.amount), 0)
  const recExpense = recurrences.filter((r) => r.type === 'EXPENSE').reduce((s, r) => s + Number(r.amount), 0)

  const income  = txIncome + recIncome
  const expense = txExpense + recExpense
  const balance = income - expense

  if (transactions.length === 0 && recurrences.length === 0) {
    return `📊 *Resumo de ${month}*\n\nNenhuma transação registrada.`
  }

  let text = `📊 *Resumo de ${month}*\n\n💰 Receitas: *${formatCurrency(income)}*\n💸 Despesas: *${formatCurrency(expense)}*\n${balance >= 0 ? '✅' : '⚠️'} Saldo: *${formatCurrency(balance)}*\n📝 ${transactions.length} lançamento(s)`
  if (recurrences.length > 0) {
    text += `\n📅 ${recurrences.length} recorrência(s) ativa(s)`
  }
  return text
}

export function categoryBreakdown(
  expenses: TransactionWithCategory[],
  month: string,
  recurrences: RecurrenceWithCategory[] = [],
): string {
  const recExpenses = recurrences.filter((r) => r.type === 'EXPENSE')

  if (expenses.length === 0 && recExpenses.length === 0) {
    return `📊 *Despesas por categoria - ${month}*\n\nNenhuma despesa registrada.`
  }

  const grouped = expenses.reduce<Record<string, { emoji: string; total: number }>>(
    (acc, t) => {
      const key = t.category.name
      if (!acc[key]) acc[key] = { emoji: t.category.emoji, total: 0 }
      acc[key].total += Number(t.amount)
      return acc
    },
    {},
  )

  for (const r of recExpenses) {
    const key = r.category.name
    if (!grouped[key]) grouped[key] = { emoji: r.category.emoji, total: 0 }
    grouped[key].total += Number(r.amount)
  }

  const total = Object.values(grouped).reduce((s, v) => s + v.total, 0)

  const lines = Object.entries(grouped)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([name, { emoji, total: catTotal }]) => `${emoji} ${name}: *${formatCurrency(catTotal)}*`)
    .join('\n')

  return `📊 *Despesas por categoria - ${month}*\n\n${lines}\n\n💸 Total: *${formatCurrency(total)}*`
}

export function lastTransactions(transactions: TransactionWithCategory[]): string {
  if (transactions.length === 0) {
    return `🕐 *Últimas transações*\n\nNenhuma transação registrada.`
  }

  const lines = transactions
    .map((t) => {
      const date = new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      const signal = t.type === 'INCOME' ? '+' : '-'
      return `${t.category.emoji} ${date} - ${t.description}: *${signal}${formatCurrency(t.amount)}*`
    })
    .join('\n')

  return `🕐 *Últimas transações*\n\n${lines}`
}

export function helpMessage(): string {
  return `🤖 *Gestor Financeiro Familiar*

*Registrar despesa:*
• gastei 45 no almoço
• gastei R$87,50 no mercado
• farmácia 32,90

*Registrar receita:*
• recebi 3000 de salário
• ganhei 500 de freela
• entrada 1500 aluguel

*Ao confirmar, você pode:*
• *sim* — confirmar
• *parcelado 3x* — parcelar em meses
• *recorrente* — repetir todo mês
• *próximo mês* / *19/04* — outra data

*Consultas:*
• resumo — saldo do mês
• categorias — despesas por categoria
• últimos — últimas transações
• recorrências — despesas/receitas fixas

*Recorrências:*
• cancelar R1 — desativa a recorrência
• alterar R1 60 — muda o valor

*Correção:*
• editar — altera o último lançamento
• cancelar — remove o último lançamento

😊 Identifico a categoria automaticamente!`
}

export function deleteConfirmPrompt(transaction: TransactionWithCategory): string {
  const type = transaction.type === 'INCOME' ? 'Receita' : 'Despesa'
  const date = new Date(transaction.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  return `🗑️ *Cancelar lançamento?*\n\n${transaction.category.emoji} *${type}* — ${transaction.description}\n💰 ${formatCurrency(transaction.amount)} (${date})\n\nResponda *sim* para confirmar ou *não* para manter.`
}

export function deleteSuccess(transaction: TransactionWithCategory): string {
  const type = transaction.type === 'INCOME' ? 'Receita' : 'Despesa'
  return `✅ *Lançamento removido!*\n\n${transaction.category.emoji} ${type} — ${transaction.description} — ${formatCurrency(transaction.amount)}`
}

export function deleteAborted(): string {
  return `↩️ Cancelamento abandonado. Nenhuma alteração feita.`
}

export function unknownMessage(): string {
  return `❓ Não entendi. Digite *ajuda* para ver os comandos disponíveis.`
}
