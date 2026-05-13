type GaugeData = {
  balance: number
  totalIncome: number
  totalExpenses: number
  savingsRate: number
  gauges: {
    balanceChange: string; balanceUp: boolean
    incomeChange: string; incomeUp: boolean
    expenseChange: string; expenseUp: boolean
    savingsChange: string; savingsUp: boolean
  }
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export function GaugeStrip({ data }: { data: GaugeData }) {
  const month = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

  const gauges = [
    {
      label: "SALDO",
      value: fmt(data.balance),
      change: data.gauges.balanceChange,
      up: data.gauges.balanceUp,
      color: "var(--indigo)",
      glow: "rgba(200,151,60,0.25)",
    },
    {
      label: "RECEITAS",
      value: fmt(data.totalIncome),
      change: data.gauges.incomeChange,
      up: data.gauges.incomeUp,
      color: "var(--emerald)",
      glow: "rgba(60,184,122,0.2)",
    },
    {
      label: "DESPESAS",
      value: fmt(data.totalExpenses),
      change: data.gauges.expenseChange,
      up: data.gauges.expenseUp,
      color: "var(--rose)",
      glow: "rgba(224,82,82,0.2)",
    },
    {
      label: "POUPANÇA",
      value: `${data.savingsRate}%`,
      change: data.gauges.savingsChange,
      up: data.gauges.savingsUp,
      color: "var(--sky)",
      glow: "rgba(74,143,204,0.2)",
    },
  ]

  return (
    <div className="wb-gauge-strip">
      {gauges.map((g, i) => (
        <div key={g.label} className="wb-gauge" style={{ borderRight: i < 3 ? "1px solid var(--border)" : "none" }}>
          <div className="wb-gauge-accent" style={{ background: `linear-gradient(to right, ${g.glow}, transparent)` }} />
          <div className="wb-gauge-header">
            <span className="wb-gauge-lbl">{g.label}</span>
            <div className="wb-gauge-line" />
            <span
              className="wb-gauge-change wb-mono"
              style={{
                background: g.up ? "var(--emerald-l)" : "var(--rose-l)",
                color: g.up ? "var(--emerald)" : "var(--rose)",
              }}
            >
              {g.change}
            </span>
          </div>
          <div className="wb-gauge-val wb-mono" style={{ color: g.color }}>{g.value}</div>
          <div className="wb-gauge-sub" style={{ textTransform: "capitalize" }}>{month}</div>
        </div>
      ))}
    </div>
  )
}
