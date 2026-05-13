import { Topbar } from "@/components/topbar"

export default function OrcamentoPage() {
  const budgets = [
    { name: "Alimentação", emoji: "🍽️", color: "#F59E0B", spent: 1240, limit: 1500 },
    { name: "Transporte",  emoji: "🚗", color: "#3B82F6", spent: 480,  limit: 600  },
    { name: "Moradia",     emoji: "🏠", color: "#6366F1", spent: 1200, limit: 1800 },
    { name: "Saúde",       emoji: "❤️", color: "#EF4444", spent: 320,  limit: 400  },
    { name: "Educação",    emoji: "📚", color: "#10B981", spent: 150,  limit: 300  },
    { name: "Lazer",       emoji: "🎉", color: "#8B5CF6", spent: 290,  limit: 200  },
  ]
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  const total = budgets.reduce((s, b) => s + b.spent, 0)
  const lim   = budgets.reduce((s, b) => s + b.limit, 0)
  const execPct = Math.round((total / lim) * 100)

  return (
    <>
      <Topbar title="Orçamento" />
      <div className="content">
        {/* Summary cards */}
        <div className="budget-summary">
          <div className="budget-summary-card">
            <div className="budget-summary-lbl">Total Gasto</div>
            <div className="budget-summary-val">{fmt(total)}</div>
            <div className="budget-summary-sub">de {fmt(lim)} limite</div>
          </div>
          <div className="budget-summary-card">
            <div className="budget-summary-lbl">Execução Geral</div>
            <div className="budget-summary-val" style={{ color: execPct >= 90 ? "var(--rose)" : "var(--emerald)" }}>
              {execPct}%
            </div>
            <div className="budget-summary-sub">do orçamento utilizado</div>
          </div>
          <div className="budget-summary-card">
            <div className="budget-summary-lbl">Disponível</div>
            <div className="budget-summary-val" style={{ color: "var(--sky)" }}>{fmt(lim - total)}</div>
            <div className="budget-summary-sub">restante no mês</div>
          </div>
        </div>

        {/* Budget bars */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Execução por Categoria</div>
          </div>
          <div className="budget-list">
            {budgets.map((b) => {
              const pct = Math.min(Math.round((b.spent / b.limit) * 100), 100)
              const over = b.spent > b.limit
              const barColor = over ? "var(--rose)" : pct >= 80 ? "var(--amber)" : b.color
              return (
                <div key={b.name}>
                  <div className="budget-item-hd">
                    <div className="budget-item-left">
                      <div
                        className="budget-item-icon"
                        style={{ background: b.color + "18" }}
                      >
                        {b.emoji}
                      </div>
                      <span className="budget-item-name">{b.name}</span>
                      {over && <span className="budget-exceeded">EXCEDIDO</span>}
                    </div>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: 13.5, color: over ? "var(--rose)" : "var(--text)" }}>
                        {fmt(b.spent)}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--text3)" }}> / {fmt(b.limit)}</span>
                    </div>
                  </div>
                  <div className="prog-bar">
                    <div
                      className="prog-fill"
                      style={{ width: `${pct}%`, background: barColor }}
                    />
                  </div>
                  <div className="prog-pct">{pct}%</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
