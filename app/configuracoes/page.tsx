import { Topbar } from "@/components/topbar"

export default function ConfiguracoesPage() {
  const members = [
    { name: "Carlos", role: "Administrador", initials: "CA", color: "#4F46E5" },
    { name: "Esposa", role: "Membro", initials: "ES", color: "#7C3AED" },
  ]

  return (
    <>
      <Topbar title="Configurações" />
      <div className="content">
        <div className="split-50">
          <div className="card">
            <div className="card-head"><div className="card-title">Membros da Família</div></div>
            {members.map((m, i) => (
              <div key={m.name} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: i < members.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: m.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "12px", fontWeight: 700 }}>{m.initials}</div>
                <div>
                  <div style={{ fontSize: "13.5px", fontWeight: 500 }}>{m.name}</div>
                  <div style={{ fontSize: "12px", color: "var(--text3)" }}>{m.role}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-head"><div className="card-title">Sistema</div></div>
            {[
              { label: "Banco de dados", val: "PostgreSQL 17", color: "var(--emerald)" },
              { label: "Framework", val: "Next.js 16", color: "var(--text3)" },
              { label: "Deploy alvo", val: "Oracle Cloud ARM", color: "var(--text3)" },
            ].map((row, i) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
                <span style={{ fontSize: "13px", color: "var(--text2)" }}>{row.label}</span>
                <span style={{ fontSize: "12.5px", fontWeight: 500, color: row.color }}>{row.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
