import { ReactNode } from "react"

export function Topbar({ title, children: _children }: { title: ReactNode; children?: ReactNode }) {
  const month = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

  return (
    <div className="wb-canvas-header">
      <div>
        <div className="wb-canvas-label">Finan Workbench · {month}</div>
        <h1 className="wb-canvas-title">{title}</h1>
      </div>
      <div className="wb-dot-grid" aria-hidden>
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="wb-dot" />
        ))}
      </div>
    </div>
  )
}
