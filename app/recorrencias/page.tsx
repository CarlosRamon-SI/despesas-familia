import { prisma } from "@/lib/prisma"
import { Topbar } from "@/components/topbar"
import { RecurrencesClient } from "@/components/recurrences-client"

export default async function RecorrenciasPage() {
  const [rawRecurrences, categories] = await Promise.all([
    prisma.recurrence.findMany({
      include: { category: true, user: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ])

  const recurrences = rawRecurrences.map((r) => ({
    id: r.id,
    type: r.type as "EXPENSE" | "INCOME",
    description: r.description,
    amount: Number(r.amount),
    dayOfMonth: r.dayOfMonth,
    active: r.active,
    categoryName: r.category.name,
    categoryEmoji: r.category.emoji,
    userName: r.user.name,
  }))

  return (
    <>
      <Topbar title="Recorrências" />
      <div className="content">
        <div className="page-head">
          <div>
            <h2>Recorrências</h2>
            <p>Lançamentos que se repetem mensalmente</p>
          </div>
        </div>

        <RecurrencesClient recurrences={recurrences} categories={categories} />
      </div>
    </>
  )
}
