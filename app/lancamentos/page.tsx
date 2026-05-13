import { prisma } from "@/lib/prisma"
import { QuickAdd } from "@/components/quick-add"
import { TransactionsTable } from "@/components/transactions-table"
import { Topbar } from "@/components/topbar"

export default async function LancamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; tipo?: string }>
}) {
  const { mes, tipo } = await searchParams

  const now = new Date()
  const [year, month] = mes
    ? mes.split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1]

  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59)

  const [transactions, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        date: { gte: start, lte: end },
        ...(tipo === "EXPENSE" || tipo === "INCOME" ? { type: tipo } : {}),
      },
      include: { category: true, user: true },
      orderBy: { date: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ])

  const totalIncome  = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0)

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  const currentMonthValue = `${year}-${month}`

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return {
      value: `${d.getFullYear()}-${d.getMonth() + 1}`,
      label: d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
    }
  })

  const serialized = transactions.map((t) => ({
    id: t.id,
    type: t.type as "EXPENSE" | "INCOME",
    description: t.description,
    amount: Number(t.amount),
    date: t.date.toISOString(),
    categoryName: t.category.name,
    categoryEmoji: t.category.emoji,
    userName: t.user.name,
  }))

  return (
    <>
      <Topbar title="Lançamentos">
        <QuickAdd categories={categories} triggerLabel="Novo Lançamento" triggerClass="btn btn-primary" />
      </Topbar>

      <div className="content">
        <div className="page-head">
          <div>
            <h2>Lançamentos</h2>
            <p>
              <span style={{ color: "var(--emerald)", fontWeight: 700 }}>+{fmt(totalIncome)}</span>
              <span style={{ color: "var(--text3)" }}> · </span>
              <span style={{ color: "var(--rose)", fontWeight: 700 }}>−{fmt(totalExpense)}</span>
            </p>
          </div>
        </div>

        <div className="table-wrap">
          <div className="table-bar">
            {/* Type filter pills */}
            {[
              { value: "", label: "Todos" },
              { value: "INCOME", label: "Receitas" },
              { value: "EXPENSE", label: "Despesas" },
            ].map((f) => (
              <a
                key={f.value}
                href={`/lancamentos?mes=${currentMonthValue}${f.value ? `&tipo=${f.value}` : ""}`}
                className={`filter-pill ${(tipo ?? "") === f.value ? "active" : ""}`}
              >
                {f.label}
              </a>
            ))}

            <span style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--text3)", fontWeight: 500, flexShrink: 0 }}>
              {serialized.length} itens
            </span>

            {/* Month selector */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {months.map((m) => (
                <a
                  key={m.value}
                  href={`/lancamentos?mes=${m.value}${tipo ? `&tipo=${tipo}` : ""}`}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    textTransform: "capitalize",
                    background: currentMonthValue === m.value ? "var(--indigo)" : "var(--surface3)",
                    color: currentMonthValue === m.value ? "#fff" : "var(--text2)",
                    transition: ".15s",
                    textDecoration: "none",
                    display: "inline-flex",
                  }}
                >
                  {m.label}
                </a>
              ))}
            </div>
          </div>

          <TransactionsTable transactions={serialized} />
        </div>
      </div>
    </>
  )
}
