import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
  {
    name: 'Alimentação',
    emoji: '🍽️',
    keywords: ['mercado', 'supermercado', 'restaurante', 'lanche', 'almoço', 'jantar', 'café', 'padaria', 'ifood', 'delivery', 'pizza', 'comida', 'alimentação'],
  },
  {
    name: 'Transporte',
    emoji: '🚗',
    keywords: ['gasolina', 'combustível', 'uber', '99', 'ônibus', 'metrô', 'estacionamento', 'pedágio', 'táxi', 'transporte', 'moto'],
  },
  {
    name: 'Moradia',
    emoji: '🏠',
    keywords: ['aluguel', 'condomínio', 'água', 'luz', 'energia', 'gás', 'internet', 'telefone', 'iptu', 'reforma', 'manutenção'],
  },
  {
    name: 'Saúde',
    emoji: '🏥',
    keywords: ['farmácia', 'remédio', 'médico', 'consulta', 'exame', 'plano de saúde', 'dentista', 'hospital', 'saúde', 'academia'],
  },
  {
    name: 'Educação',
    emoji: '📚',
    keywords: ['escola', 'faculdade', 'curso', 'livro', 'material', 'mensalidade', 'educação', 'creche'],
  },
  {
    name: 'Lazer',
    emoji: '🎉',
    keywords: ['cinema', 'teatro', 'show', 'viagem', 'passeio', 'netflix', 'spotify', 'streaming', 'jogo', 'lazer', 'hobby', 'bar'],
  },
  {
    name: 'Vestuário',
    emoji: '👕',
    keywords: ['roupa', 'sapato', 'tênis', 'calçado', 'vestuário', 'loja', 'shopping'],
  },
  {
    name: 'Higiene e Beleza',
    emoji: '🧴',
    keywords: ['salão', 'cabelo', 'barbearia', 'perfume', 'cosmético', 'higiene', 'beleza', 'shampoo'],
  },
  {
    name: 'Pets',
    emoji: '🐾',
    keywords: ['veterinário', 'ração', 'pet shop', 'animal', 'cachorro', 'gato', 'pet'],
  },
  {
    name: 'Outros',
    emoji: '📦',
    keywords: [],
  },
]

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    })
  }
  console.log('✅ Categorias criadas com sucesso')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
