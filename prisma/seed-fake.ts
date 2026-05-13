/**
 * Seed de dados fictícios — últimos 6 meses
 * Uso: npx tsx prisma/seed-fake.ts
 *
 * Requer categorias já criadas (npm run db:seed).
 * Cria usuários Carlos e Esposa se não existirem.
 * Idempotente: pode rodar várias vezes (adiciona mais dados).
 */

import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker/locale/pt_BR'

const prisma = new PrismaClient()

// ── Descições realistas por categoria ──────────────────────
const EXPENSE_TEMPLATES: Record<string, string[]> = {
  'Alimentação':      ['Supermercado', 'Mercado Municipal', 'iFood', 'Restaurante', 'Padaria', 'Açougue', 'Hortifruti', 'Lanchonete', 'Pizza', 'Delivery'],
  'Transporte':       ['Combustível', 'Gasolina', 'Uber', '99Pop', 'Estacionamento', 'Pedágio', 'Ônibus', 'Metrô'],
  'Moradia':          ['Aluguel', 'Condomínio', 'Energia Elétrica', 'Conta de Água', 'Gás', 'Internet', 'IPTU'],
  'Saúde':            ['Farmácia', 'Consulta Médica', 'Exame de Sangue', 'Dentista', 'Plano de Saúde', 'Academia', 'Remédios'],
  'Educação':         ['Escola Infantil', 'Mensalidade Faculdade', 'Curso Online', 'Material Escolar', 'Livros'],
  'Lazer':            ['Netflix', 'Spotify', 'Cinema', 'Show', 'Bar', 'Viagem', 'Parque', 'Streaming'],
  'Vestuário':        ['Renner', 'Zara', 'C&A', 'Calçados', 'Shopping', 'Roupa'],
  'Higiene e Beleza': ['Salão de Beleza', 'Barbearia', 'Farmácia Higiene', 'Shampoo e Condicionador', 'Perfumaria'],
  'Pets':             ['Ração', 'Veterinário', 'Pet Shop', 'Banho e Tosa'],
  'Outros':           ['Presente', 'Doação', 'Assinatura', 'Serviço avulso'],
}

const INCOME_TEMPLATES = ['Salário', 'Freelance', 'Renda Extra', 'Consultoria', 'Venda', 'Bônus', 'Dividendos']

// ── Pesos de frequência por categoria (despesa) ────────────
const CAT_WEIGHTS: Record<string, number> = {
  'Alimentação':      30,
  'Transporte':       18,
  'Moradia':           8,
  'Saúde':            10,
  'Educação':          6,
  'Lazer':            10,
  'Vestuário':         6,
  'Higiene e Beleza':  6,
  'Pets':              3,
  'Outros':            3,
}

// ── Faixas de valor por categoria (R$) ────────────────────
const CAT_AMOUNT: Record<string, [number, number]> = {
  'Alimentação':      [20,   600],
  'Transporte':       [15,   350],
  'Moradia':          [200, 2500],
  'Saúde':            [30,   500],
  'Educação':         [80,   900],
  'Lazer':            [10,   400],
  'Vestuário':        [50,   800],
  'Higiene e Beleza': [20,   250],
  'Pets':             [30,   300],
  'Outros':           [10,   500],
}

function pickWeighted(weights: Record<string, number>): string {
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (const [key, w] of Object.entries(weights)) {
    r -= w
    if (r <= 0) return key
  }
  return Object.keys(weights)[0]
}

function randomAmount(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2))
}

function randomDate(monthsAgo: number): Date {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1)
  const end   = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0)
  return faker.date.between({ from: start, to: end })
}

async function main() {
  // Garantir usuários
  const [carlos, esposa] = await Promise.all([
    prisma.user.upsert({
      where:  { phone: 'Carlos' },
      update: {},
      create: { name: 'Carlos', phone: 'Carlos' },
    }),
    prisma.user.upsert({
      where:  { phone: 'Esposa' },
      update: {},
      create: { name: 'Esposa', phone: 'Esposa' },
    }),
  ])
  const users = [carlos, esposa]

  // Buscar categorias
  const categories = await prisma.category.findMany()
  if (categories.length === 0) {
    console.error('❌ Nenhuma categoria encontrada. Rode npm run db:seed primeiro.')
    process.exit(1)
  }

  const catMap = Object.fromEntries(categories.map(c => [c.name, c]))

  let totalCreated = 0

  // ── 6 meses de despesas ────────────────────────────────
  for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo--) {
    const txPerMonth = faker.number.int({ min: 18, max: 28 })

    for (let i = 0; i < txPerMonth; i++) {
      const catName = pickWeighted(CAT_WEIGHTS)
      const cat     = catMap[catName]
      if (!cat) continue

      const [min, max] = CAT_AMOUNT[catName]
      const templates  = EXPENSE_TEMPLATES[catName] ?? ['Despesa']
      const desc       = faker.helpers.arrayElement(templates)
      const user       = faker.helpers.arrayElement(users)

      await prisma.transaction.create({
        data: {
          type:        'EXPENSE',
          description: desc,
          amount:      randomAmount(min, max),
          date:        randomDate(monthsAgo),
          categoryId:  cat.id,
          userId:      user.id,
        },
      })
      totalCreated++
    }

    // ── 1-2 receitas por mês ──────────────────────────────
    const incomeCount = faker.number.int({ min: 1, max: 2 })
    for (let i = 0; i < incomeCount; i++) {
      // Receita vai para categoria "Outros" (ou primeira disponível)
      const cat  = catMap['Outros'] ?? categories[0]
      const user = faker.helpers.arrayElement(users)

      await prisma.transaction.create({
        data: {
          type:        'INCOME',
          description: faker.helpers.arrayElement(INCOME_TEMPLATES),
          amount:      randomAmount(2500, 7000),
          date:        randomDate(monthsAgo),
          categoryId:  cat.id,
          userId:      user.id,
        },
      })
      totalCreated++
    }

    const label = new Date(
      new Date().getFullYear(),
      new Date().getMonth() - monthsAgo,
      1
    ).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    console.log(`  ✓ ${label}`)
  }

  console.log(`\n✅ ${totalCreated} transações fictícias criadas.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
