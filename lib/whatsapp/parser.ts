export type ParsedTransaction = {
  amount: number
  description: string
  rawMessage: string
}

export type ParsedCommand =
  | { type: 'expense'; data: ParsedTransaction }
  | { type: 'income'; data: ParsedTransaction }
  | { type: 'summary' }
  | { type: 'summary_category' }
  | { type: 'last_transactions' }
  | { type: 'list_recurring' }
  | { type: 'cancel_recurring'; ref: number }
  | { type: 'alter_recurring'; ref: number; amount: number }
  | { type: 'delete_last' }
  | { type: 'edit_last' }
  | { type: 'help' }
  | { type: 'unknown' }

const EXPENSE_PATTERNS = [
  /^gastei\s+R?\$?\s*(\d+(?:[.,]\d{1,2})?)\s+(?:no|na|em|com|de|pelo|pela|num|numa)?\s*(.+)$/i,
  /^R?\$?\s*(\d+(?:[.,]\d{1,2})?)\s+(?:reais?\s+)?(?:no|na|em|com|de|pelo|pela|num|numa)\s+(.+)$/i,
  /^(.+?)\s+R?\$?\s*(\d+(?:[.,]\d{1,2})?)$/i,
]

const INCOME_PATTERNS = [
  /^(?:recebi|ganhei)\s+R?\$?\s*(\d+(?:[.,]\d{1,2})?)\s+(?:de|do|da|pelo|pela|com|em)?\s*(.+)$/i,
  /^entrada\s+R?\$?\s*(\d+(?:[.,]\d{1,2})?)\s+(.+)$/i,
]

const DELETE_LAST_KEYWORDS    = ['cancelar', 'desfazer', 'apagar último', 'apagar ultima', 'excluir último', 'excluir ultima']
const EDIT_LAST_KEYWORDS      = ['editar', 'editar último', 'editar ultima', 'editar lançamento']
const SUMMARY_KEYWORDS        = ['resumo', 'total', 'quanto gastei', 'extrato', 'saldo']
const SUMMARY_CATEGORY_KEYWORDS = ['por categoria', 'categorias', 'por tipo']
const LAST_TRANSACTIONS_KEYWORDS = ['últimos', 'ultimos', 'últimas', 'ultimas', 'recentes', 'histórico', 'historico']
const RECURRING_LIST_KEYWORDS = ['recorrências', 'recorrencias', 'mensais', 'fixas', 'assinaturas']
const HELP_KEYWORDS           = ['ajuda', 'help', 'comandos', 'como usar']

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(',', '.'))
}

export function parseMessage(message: string): ParsedCommand {
  const text = message.trim().toLowerCase()

  // Cancelar recorrência específica: "cancelar R2" (antes do delete_last genérico)
  const cancelRecMatch = text.match(/cancelar\s+r(\d+)/i)
  if (cancelRecMatch) {
    return { type: 'cancel_recurring', ref: parseInt(cancelRecMatch[1]) }
  }

  // Alterar valor de recorrência: "alterar R1 80"
  const alterRecMatch = text.match(/alterar\s+r(\d+)\s+(\d+(?:[.,]\d{1,2})?)/)
  if (alterRecMatch) {
    return { type: 'alter_recurring', ref: parseInt(alterRecMatch[1]), amount: parseAmount(alterRecMatch[2]) }
  }

  if (DELETE_LAST_KEYWORDS.some((k) => text.includes(k))) {
    return { type: 'delete_last' }
  }

  if (EDIT_LAST_KEYWORDS.some((k) => text.includes(k))) {
    return { type: 'edit_last' }
  }

  if (HELP_KEYWORDS.some((k) => text.includes(k))) {
    return { type: 'help' }
  }

  if (RECURRING_LIST_KEYWORDS.some((k) => text.includes(k))) {
    return { type: 'list_recurring' }
  }

  if (SUMMARY_CATEGORY_KEYWORDS.some((k) => text.includes(k))) {
    return { type: 'summary_category' }
  }

  if (SUMMARY_KEYWORDS.some((k) => text.includes(k))) {
    return { type: 'summary' }
  }

  if (LAST_TRANSACTIONS_KEYWORDS.some((k) => text.includes(k))) {
    return { type: 'last_transactions' }
  }

  for (const pattern of INCOME_PATTERNS) {
    const match = message.trim().match(pattern)
    if (match) {
      return {
        type: 'income',
        data: { amount: parseAmount(match[1]), description: match[2].trim(), rawMessage: message.trim() },
      }
    }
  }

  for (let i = 0; i < 2; i++) {
    const match = message.trim().match(EXPENSE_PATTERNS[i])
    if (match) {
      return {
        type: 'expense',
        data: { amount: parseAmount(match[1]), description: match[2].trim(), rawMessage: message.trim() },
      }
    }
  }

  const match = message.trim().match(EXPENSE_PATTERNS[2])
  if (match) {
    return {
      type: 'expense',
      data: { amount: parseAmount(match[2]), description: match[1].trim(), rawMessage: message.trim() },
    }
  }

  return { type: 'unknown' }
}

export function guessCategory(description: string, categories: { name: string; keywords: string[] }[]): string {
  const lower = description.toLowerCase()

  for (const category of categories) {
    if (category.name === 'Outros') continue
    if (category.keywords.some((keyword) => lower.includes(keyword))) {
      return category.name
    }
  }

  return 'Outros'
}
