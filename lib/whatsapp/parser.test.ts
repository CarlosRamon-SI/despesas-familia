import { describe, it, expect } from 'vitest'
import { parseMessage, guessCategory } from './parser'

describe('parseMessage', () => {
  describe('expense patterns', () => {
    it('parses "gastei X no Y" format', () => {
      const result = parseMessage('gastei 45 no almoço')
      expect(result).toEqual({
        type: 'expense',
        data: { amount: 45, description: 'almoço', rawMessage: 'gastei 45 no almoço' },
      })
    })

    it('parses "gastei R$X no Y" format', () => {
      const result = parseMessage('gastei R$87,50 no mercado')
      expect(result).toEqual({
        type: 'expense',
        data: { amount: 87.5, description: 'mercado', rawMessage: 'gastei R$87,50 no mercado' },
      })
    })

    it('parses "gastei X em Y" format', () => {
      const result = parseMessage('gastei 30 em combustível')
      expect(result.type).toBe('expense')
      if (result.type === 'expense') {
        expect(result.data.amount).toBe(30)
        expect(result.data.description).toBe('combustível')
      }
    })

    it('parses "X reais no Y" format', () => {
      const result = parseMessage('50 reais no restaurante')
      expect(result.type).toBe('expense')
      if (result.type === 'expense') {
        expect(result.data.amount).toBe(50)
        expect(result.data.description).toBe('restaurante')
      }
    })

    it('parses "Y X" format (description then amount)', () => {
      const result = parseMessage('farmácia 32,90')
      expect(result.type).toBe('expense')
      if (result.type === 'expense') {
        expect(result.data.amount).toBe(32.9)
        expect(result.data.description).toBe('farmácia')
      }
    })

    it('handles decimal with dot', () => {
      const result = parseMessage('gastei 19.99 no streaming')
      expect(result.type).toBe('expense')
      if (result.type === 'expense') {
        expect(result.data.amount).toBe(19.99)
      }
    })
  })

  describe('income patterns', () => {
    it('parses "recebi X de Y" format', () => {
      const result = parseMessage('recebi 3000 de salário')
      expect(result).toEqual({
        type: 'income',
        data: { amount: 3000, description: 'salário', rawMessage: 'recebi 3000 de salário' },
      })
    })

    it('parses "ganhei X de Y" format', () => {
      const result = parseMessage('ganhei 500 de freela')
      expect(result.type).toBe('income')
      if (result.type === 'income') {
        expect(result.data.amount).toBe(500)
        expect(result.data.description).toBe('freela')
      }
    })

    it('parses "entrada X Y" format', () => {
      const result = parseMessage('entrada 1500 aluguel')
      expect(result.type).toBe('income')
      if (result.type === 'income') {
        expect(result.data.amount).toBe(1500)
      }
    })
  })

  describe('summary commands', () => {
    it('detects "resumo" command', () => {
      expect(parseMessage('resumo')).toEqual({ type: 'summary' })
      expect(parseMessage('saldo')).toEqual({ type: 'summary' })
    })

    it('detects "por categoria" command', () => {
      expect(parseMessage('resumo por categoria')).toEqual({ type: 'summary_category' })
      expect(parseMessage('categorias')).toEqual({ type: 'summary_category' })
    })

    it('detects "últimos" command', () => {
      expect(parseMessage('últimos')).toEqual({ type: 'last_transactions' })
      expect(parseMessage('histórico')).toEqual({ type: 'last_transactions' })
    })

    it('detects "ajuda" command', () => {
      expect(parseMessage('ajuda')).toEqual({ type: 'help' })
      expect(parseMessage('comandos')).toEqual({ type: 'help' })
    })
  })

  describe('unknown messages', () => {
    it('returns unknown for unrecognized messages', () => {
      expect(parseMessage('olá tudo bem')).toEqual({ type: 'unknown' })
      expect(parseMessage('bom dia')).toEqual({ type: 'unknown' })
    })
  })
})

describe('guessCategory', () => {
  const categories = [
    { name: 'Alimentação', keywords: ['mercado', 'restaurante', 'almoço', 'padaria', 'comida'] },
    { name: 'Transporte', keywords: ['gasolina', 'uber', 'ônibus', 'combustível'] },
    { name: 'Saúde', keywords: ['farmácia', 'médico', 'remédio'] },
    { name: 'Outros', keywords: [] },
  ]

  it('matches Alimentação by keyword', () => {
    expect(guessCategory('almoço no restaurante', categories)).toBe('Alimentação')
    expect(guessCategory('mercado', categories)).toBe('Alimentação')
  })

  it('matches Transporte by keyword', () => {
    expect(guessCategory('gasolina', categories)).toBe('Transporte')
    expect(guessCategory('uber para o trabalho', categories)).toBe('Transporte')
  })

  it('matches Saúde by keyword', () => {
    expect(guessCategory('farmácia', categories)).toBe('Saúde')
  })

  it('falls back to Outros when no keyword matches', () => {
    expect(guessCategory('presente de aniversário', categories)).toBe('Outros')
  })
})
