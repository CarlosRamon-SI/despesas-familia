import { prisma } from "@/lib/prisma"
import { Topbar } from "@/components/topbar"
import { RecorrenciasClient } from "@/components/recorrencias-client"

export default async function RecorrenciasPage() {
  const now = new Date()
  const nextStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const rawTx = await prisma.transaction.findMany({
    where: { recorrente: true, date: { gte: nextStart } },
    include: { category: true, user: true },
    orderBy: { date: "asc" },
  })

  const transactions = rawTx.map(tx => ({
    id:            tx.id,
    type:          tx.type as "EXPENSE" | "INCOME",
    description:   tx.description,
    amount:        Number(tx.amount),
    date:          tx.date.toISOString(),
    categoryName:  tx.category.name,
    categoryEmoji: tx.category.emoji,
    userName:      tx.user.name,
  }))

  return (
    <>
      <Topbar title="Recorrências" />
      <div className="content">
        <RecorrenciasClient transactions={transactions} />
      </div>
    </>
  )
}
