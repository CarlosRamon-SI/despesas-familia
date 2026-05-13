import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { CashflowChart } from "@/components/cashflow-chart"
import { DoughnutChart } from "@/components/doughnut-chart"
import { QuickAdd } from "@/components/quick-add"
import { Topbar } from "@/components/topbar"
import { getCategoryStyle } from "@/lib/category-colors"

async function getDashboardData() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [transactions, lastMonthExpenses, lastMonthIncome, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: { date: { gte: start, lte: end } },
      include: { category: true, user: true },
      orderBy: { date: "desc" },
    }),
    prisma.transaction.aggregate({
      where: {
        date: {
          gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          lte: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
        },
        type: "EXPENSE",
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        date: {
          gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          lte: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
        },
        type: "INCOME",
      },
      _sum: { amount: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ])

  const cashflow = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const s = new Date(d.getFullYear(), d.getMonth(), 1)
      const e = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
      return prisma.transaction.groupBy({
        by: ["type"],
        where: { date: { gte: s, lte: e } },
        _sum: { amount: true },
      }).then((rows) => ({
        label: d.toLocaleDateString("pt-BR", { month: "short" }),
        income: Number(rows.find((r) => r.type === "INCOME")?._sum.amount ?? 0),
        expense: Number(rows.find((r) => r.type === "EXPENSE")?._sum.amount ?? 0),
      }))
    })
  )

  const expenses = transactions.filter((t) => t.type === "EXPENSE")
  const incomes = transactions.filter((t) => t.type === "INCOME")
  const totalExpenses = expenses.reduce((s, t) => s + Number(t.amount), 0)
  const totalIncome = incomes.reduce((s, t) => s + Number(t.amount), 0)
  const balance = totalIncome - totalExpenses
  const totalLastExpense = Number(lastMonthExpenses._sum.amount ?? 0)
  const totalLastIncome = Number(lastMonthIncome._sum.amount ?? 0)
  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0

  const byCategory = expenses.reduce<Record<string, { emoji: string; total: number }>>(
    (acc, t) => {
      const key = t.category.name
      if (!acc[key]) acc[key] = { emoji: t.category.emoji, total: 0 }
      acc[key].total += Number(t.amount)
      return acc
    },
    {}
  )

  const categoriesSorted = Object.entries(byCategory)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([name, { emoji, total }]) => ({ name, emoji, total }))

  return {
    transactions, totalExpenses, totalIncome, balance,
    totalLastExpense, totalLastIncome, savingsRate,
    byCategory: categoriesSorted, cashflow, categories,
  }
}

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function pctChange(current: number, prev: number): { label: string; up: boolean } | null {
  if (prev === 0) return null
  const pct = Math.round(((current - prev) / prev) * 100)
  return { label: `${pct > 0 ? "+" : ""}${pct}%`, up: pct >= 0 }
}

export default async function DashboardPage() {
  const {
    transactions, totalExpenses, totalIncome, balance,
    totalLastExpense, totalLastIncome, savingsRate,
    byCategory, cashflow, categories,
  } = await getDashboardData()

  const now = new Date()
  const monthName = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

  const incomeChange = pctChange(totalIncome, totalLastIncome)
  const expenseChange = pctChange(totalExpenses, totalLastExpense)

  return (
    <>
      <Topbar title="Painel">
        <QuickAdd categories={categories} triggerLabel="Novo Lançamento" triggerClass="btn btn-primary" />
      </Topbar>

      <div className="content">
        <div className="page-head">
          <div>
            <h2>Painel</h2>
            <p style={{ textTransform: "capitalize" }}>Visão geral de {monthName}</p>
          </div>
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
            <div className="stat-lbl">Receitas</div>
            <div className="stat-val">{fmt(totalIncome)}</div>
            <div className="stat-row">
              {incomeChange && (
                <span className={`stat-chip ${incomeChange.up ? "chip-up" : "chip-down"}`}>
                  {incomeChange.label}
                </span>
              )}
              <span className="stat-sublbl">vs mês anterior</span>
            </div>
          </div>

          <div className="stat-card fade-up" style={{ animationDelay: "80ms" }}>
            <div className="stat-icon si-expense">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
              </svg>
            </div>
            <div className="stat-lbl">Despesas</div>
            <div className="stat-val">{fmt(totalExpenses)}</div>
            <div className="stat-row">
              {expenseChange && (
                <span className={`stat-chip ${!expenseChange.up ? "chip-up" : "chip-down"}`}>
                  {expenseChange.label}
                </span>
              )}
              <span className="stat-sublbl">vs mês anterior</span>
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
            <div className="stat-lbl">Saldo</div>
            <div className="stat-val">{fmt(balance)}</div>
            <div className="stat-row">
              <span className={`stat-chip ${balance >= 0 ? "chip-up" : "chip-down"}`}>
                {balance >= 0 ? "positivo" : "negativo"}
              </span>
              <span className="stat-sublbl">este mês</span>
            </div>
          </div>

          <div className="stat-card fade-up" style={{ animationDelay: "240ms" }}>
            <div className="stat-icon si-savings">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 21l1.09-4.37A7 7 0 1117.32 9H19a2 2 0 012 2v1a2 2 0 01-2 2h-.09A7 7 0 019.07 20.25L9 21H4z"/>
              </svg>
            </div>
            <div className="stat-lbl">Poupança</div>
            <div className="stat-val">{savingsRate}%</div>
            <div className="stat-row">
              <span className={`stat-chip ${savingsRate >= 0 ? "chip-up" : "chip-down"}`}>
                {savingsRate >= 20 ? "ótimo" : savingsRate >= 10 ? "ok" : "baixo"}
              </span>
              <span className="stat-sublbl">da receita</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="charts-row">
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Fluxo de Caixa</div>
                <div className="card-sub">Receitas vs Despesas — 6 meses</div>
              </div>
            </div>
            <div className="chart-wrap">
              <CashflowChart data={cashflow} />
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: 4 }}>Por Categoria</div>
            <div className="card-sub" style={{ marginBottom: 14, textTransform: "capitalize" }}>{monthName}</div>
            <div className="donut-wrap">
              <DoughnutChart data={byCategory} />
            </div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 7 }}>
              {byCategory.slice(0, 5).map((c) => {
                const { color } = getCategoryStyle(c.name, "EXPENSE")
                return (
                  <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "var(--text2)", flex: 1 }}>{c.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{fmt(c.total)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="table-wrap">
          <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Lançamentos Recentes</div>
            <Link href="/lancamentos" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--indigo)", cursor: "pointer" }}>
              Ver todos →
            </Link>
          </div>
          {transactions.length === 0 ? (
            <div className="empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
              </svg>
              <p>Nenhum lançamento este mês</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Quem</th>
                    <th>Data</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 8).map((t) => {
                    const { color, bg } = getCategoryStyle(t.category.name, t.type)
                    return (
                      <tr key={t.id}>
                        <td className="tbl-desc">{t.description}</td>
                        <td>
                          <span className="tag" style={{ background: bg, color }}>
                            {t.category.emoji} {t.category.name}
                          </span>
                        </td>
                        <td style={{ color: "var(--text2)", fontSize: 12 }}>{t.user.name}</td>
                        <td className="tbl-date">{new Date(t.date).toLocaleDateString("pt-BR")}</td>
                        <td style={{ textAlign: "right" }}>
                          <span className={`amount ${t.type === "INCOME" ? "pos" : "neg"}`}>
                            {t.type === "INCOME" ? "+" : "−"}{fmt(Number(t.amount))}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
