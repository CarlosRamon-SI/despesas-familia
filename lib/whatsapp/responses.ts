import type { Transaction, Category, User } from '@prisma/client'
import type { Decimal } from '@prisma/client/runtime/library'

type TransactionWithCategory = Transaction & { category: Category }

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

export function recurringCreated(
  tx: { type: 'INCOME' | 'EXPENSE'; description: string; amount: Decimal | number; category: { emoji: string; name: string } },
): string {
  const isIncome = tx.type === 'INCOME'
  const icon  = isIncome ? '💰' : '📅'
  const label = isIncome ? 'Receita recorrente criada!' : 'Despesa recorrente criada!'
  return `${icon} *${label}*\n\n${tx.category.emoji} *${tx.category.name}*\n📝 ${tx.description}\n${isIncome ? '📈' : '📉'} ${formatCurrency(tx.amount)}/mês\n\nLançamento gerado para este mês e o próximo.\nUse *recorrências* para ver todas.`
}

export function listRecurrences(transactions: TransactionWithCategory[]): string {
  if (transactions.length === 0) {
    return `📅 *Recorrências ativas*\n\nNenhuma transação recorrente este mês.\n\nDiga *recorrente* ao confirmar um lançamento para criar uma.`
  }

  const lines = transactions
    .map((t, i) => {
      const signal = t.type === 'INCOME' ? '+' : '-'
      return `*R${i + 1}* ${t.category.emoji} ${t.description}: *${signal}${formatCurrency(t.amount)}/mês*`
    })
    .join('\n')

  return `📅 *Recorrências ativas (este mês)*\n\n${lines}`
}

export function monthlySummary(
  transactions: TransactionWithCategory[],
  month: string,
): string {
  const income  = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0)
  const expense = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0)
  const balance = income - expense
  const recurring = transactions.filter((t) => t.recorrente).length

  if (transactions.length === 0) {
    return `📊 *Resumo de ${month}*\n\nNenhuma transação registrada.`
  }

  let text = `📊 *Resumo de ${month}*\n\n💰 Receitas: *${formatCurrency(income)}*\n💸 Despesas: *${formatCurrency(expense)}*\n${balance >= 0 ? '✅' : '⚠️'} Saldo: *${formatCurrency(balance)}*\n📝 ${transactions.length} lançamento(s)`
  if (recurring > 0) {
    text += `\n📅 ${recurring} recorrente(s)`
  }
  return text
}

export function categoryBreakdown(
  expenses: TransactionWithCategory[],
  month: string,
): string {
  if (expenses.length === 0) {
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
• recorrências — lançamentos fixos deste mês

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
