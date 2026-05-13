import { prisma } from "@/lib/prisma"
import { Topbar } from "@/components/topbar"
import { ReportsCharts } from "@/components/reports-charts"

async function getReportsData(year: number) {
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31, 23, 59, 59)

  const months = await Promise.all(
    Array.from({ length: 12 }, (_, i) => {
      const s = new Date(year, i, 1)
      const e = new Date(year, i + 1, 0, 23, 59, 59)
      return prisma.transaction
        .groupBy({
          by: ["type"],
          where: { date: { gte: s, lte: e } },
          _sum: { amount: true },
        })
        .then(rows => ({
          label: new Date(year, i, 1).toLocaleDateString("pt-BR", { month: "short" }),
          income: Number(rows.find(r => r.type === "INCOME")?._sum.amount ?? 0),
          expense: Number(rows.find(r => r.type === "EXPENSE")?._sum.amount ?? 0),
        }))
    })
  )

  const expensesByCategory = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { date: { gte: start, lte: end }, type: "EXPENSE" },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
  })

  const categoryIds = expensesByCategory.map(e => e.categoryId)
  const dbCategories = categoryIds.length > 0
    ? await prisma.category.findMany({ where: { id: { in: categoryIds } } })
    : []

  const categories = expensesByCategory.map(e => {
    const cat = dbCategories.find(c => c.id === e.categoryId)
    return {
      name: cat?.name ?? "Outros",
      emoji: cat?.emoji ?? "•",
      total: Number(e._sum.amount ?? 0),
    }
  })

  const firstTx = await prisma.transaction.findFirst({
    orderBy: { date: "asc" },
    select: { date: true },
  })
  const firstYear = firstTx ? new Date(firstTx.date).getFullYear() : year
  const currentYear = new Date().getFullYear()
  const availableYears = Array.from(
    { length: currentYear - firstYear + 1 },
    (_, i) => firstYear + i
  ).reverse()

  const totalIncome = months.reduce((s, m) => s + m.income, 0)
  const totalExpenses = months.reduce((s, m) => s + m.expense, 0)
  const totalBalance = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? Math.round((totalBalance / totalIncome) * 100) : 0

  return {
    year,
    availableYears,
    months: months.map(m => ({ ...m, balance: m.income - m.expense })),
    categories,
    totalIncome,
    totalExpenses,
    totalBalance,
    savingsRate,
  }
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const params = await searchParams
  const currentYear = new Date().getFullYear()
  const year = parseInt(params.year ?? String(currentYear), 10) || currentYear

  const data = await getReportsData(year)

  return (
    <>
      <Topbar title="Relatórios" />
      <div className="content">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {data.availableYears.map(y => (
            <a
              key={y}
              href={`/relatorios?year=${y}`}
              style={{
                padding: "7px 16px",
                borderRadius: 20,
                fontSize: 12.5,
                fontWeight: 700,
                background: y === year ? "var(--indigo)" : "var(--surface3)",
                color: y === year ? "#fff" : "var(--text2)",
                transition: ".15s",
                textDecoration: "none",
                display: "inline-flex",
              }}
            >
              {y}
            </a>
          ))}
        </div>

        {/* Stat cards */}
        <div className="stats-grid">
          <div className="stat-card fade-up" style={{ animationDelay: "0ms" }}>
            <div className="stat-icon si-income">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
            <div className="stat-lbl">Receita Total</div>
            <div className="stat-val">{fmt(data.totalIncome)}</div>
            <div className="stat-row">
              <span className="stat-sublbl">em {year}</span>
            </div>
          </div>

          <div className="stat-card fade-up" style={{ animationDelay: "80ms" }}>
            <div className="stat-icon si-expense">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <polyline points="19 12 12 19 5 12"/>
              </svg>
            </div>
            <div className="stat-lbl">Despesa Total</div>
            <div className="stat-val">{fmt(data.totalExpenses)}</div>
            <div className="stat-row">
              <span className="stat-sublbl">em {year}</span>
            </div>
          </div>

          <div className="stat-card fade-up" style={{ animationDelay: "160ms" }}>
            <div className="stat-icon si-balance">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2"/>
                <path d="M1 10h22"/>
                <circle cx="18" cy="15" r="1" fill="currentColor" stroke="none"/>
              </svg>
            </div>
            <div className="stat-lbl">Saldo do Ano</div>
            <div className="stat-val">{fmt(data.totalBalance)}</div>
            <div className="stat-row">
              <span className={`stat-chip ${data.totalBalance >= 0 ? "chip-up" : "chip-down"}`}>
                {data.totalBalance >= 0 ? "positivo" : "negativo"}
              </span>
            </div>
          </div>

          <div className="stat-card fade-up" style={{ animationDelay: "240ms" }}>
            <div className="stat-icon si-savings">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 21l1.09-4.37A7 7 0 1117.32 9H19a2 2 0 012 2v1a2 2 0 01-2 2h-.09A7 7 0 019.07 20.25L9 21H4z"/>
              </svg>
            </div>
            <div className="stat-lbl">Taxa de Poupança</div>
            <div className="stat-val">{data.savingsRate}%</div>
            <div className="stat-row">
              <span className={`stat-chip ${data.savingsRate >= 0 ? "chip-up" : "chip-down"}`}>
                {data.savingsRate >= 20 ? "ótimo" : data.savingsRate >= 10 ? "ok" : "baixo"}
              </span>
              <span className="stat-sublbl">da receita</span>
            </div>
          </div>
        </div>

        {/* Charts (client component) */}
        <ReportsCharts months={data.months} categories={data.categories} />

        {/* Monthly summary table */}
        <div className="table-wrap">
          <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Resumo Mensal — {year}</div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
              Receitas, despesas e saldo por mês
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th style={{ textAlign: "right" }}>Receitas</th>
                  <th style={{ textAlign: "right" }}>Despesas</th>
                  <th style={{ textAlign: "right" }}>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {data.months.map((m, i) => {
                  const hasData = m.income > 0 || m.expense > 0
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 500, textTransform: "capitalize" }}>{m.label}</td>
                      <td style={{ textAlign: "right" }}>
                        {m.income > 0 ? (
                          <span className="amount pos">+{fmt(m.income)}</span>
                        ) : (
                          <span style={{ color: "var(--text3)", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {m.expense > 0 ? (
                          <span className="amount neg">−{fmt(m.expense)}</span>
                        ) : (
                          <span style={{ color: "var(--text3)", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {hasData ? (
                          <span className={`amount ${m.balance >= 0 ? "pos" : "neg"}`}>
                            {m.balance >= 0 ? "+" : "−"}{fmt(Math.abs(m.balance))}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text3)", fontSize: 12 }}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
