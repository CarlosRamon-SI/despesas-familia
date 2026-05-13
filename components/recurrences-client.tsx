"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { createRecurrence, deleteRecurrence, toggleRecurrence, generateThisMonth } from "@/app/actions"
import { getCategoryStyle } from "@/lib/category-colors"
import type { Category } from "@prisma/client"

export type RecurrenceRow = {
  id: string
  type: "EXPENSE" | "INCOME"
  description: string
  amount: number
  dayOfMonth: number
  active: boolean
  categoryName: string
  categoryEmoji: string
  userName: string
}

type Props = {
  recurrences: RecurrenceRow[]
  categories: Category[]
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

/* ── Generate button ───────────────────────────────────── */
function GenerateButton() {
  const [pending, start] = useTransition()
  const [result, setResult] = useState<number | null>(null)

  function handleClick() {
    start(async () => {
      const n = await generateThisMonth()
      setResult(n)
      setTimeout(() => setResult(null), 4000)
    })
  }

  const label = pending
    ? "Gerando…"
    : result !== null
    ? result === 0
      ? "Tudo em dia ✓"
      : `${result} gerado${result > 1 ? "s" : ""} ✓`
    : "Gerar este mês"

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="btn btn-ghost btn-sm"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M17 1l4 4-4 4"/>
        <path d="M3 11V9a4 4 0 014-4h14"/>
        <path d="M7 23l-4-4 4-4"/>
        <path d="M21 13v2a4 4 0 01-4 4H3"/>
      </svg>
      {label}
    </button>
  )
}

/* ── Toggle ────────────────────────────────────────────── */
function ToggleSwitch({ id, active }: { id: string; active: boolean }) {
  const [pending, start] = useTransition()
  const [local, setLocal] = useState(active)

  function handleClick() {
    const next = !local
    setLocal(next)
    start(() => toggleRecurrence(id, next))
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      title={local ? "Desativar" : "Ativar"}
      style={{
        width: 38, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
        background: local ? "var(--indigo)" : "var(--surface3)",
        position: "relative", transition: "background .2s", flexShrink: 0,
        opacity: pending ? 0.6 : 1,
      }}
    >
      <span style={{
        position: "absolute", top: 3,
        left: local ? 18 : 3,
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
        display: "block",
      }} />
    </button>
  )
}

/* ── Delete button ─────────────────────────────────────── */
function DeleteButton({ id }: { id: string }) {
  const [pending, start] = useTransition()
  return (
    <button
      disabled={pending}
      onClick={() => start(() => deleteRecurrence(id))}
      style={{ color: "var(--text3)", fontSize: 18, lineHeight: 1, padding: "2px 6px", borderRadius: 4, transition: ".15s" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--rose)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text3)")}
      title="Excluir"
    >
      ×
    </button>
  )
}

/* ── Create modal ──────────────────────────────────────── */
function CreateModal({ categories, onClose }: { categories: Category[]; onClose: () => void }) {
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE")
  const [pending, start] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", esc)
    return () => window.removeEventListener("keydown", esc)
  }, [onClose])

  function handleSubmit(formData: FormData) {
    formData.set("type", type)
    start(async () => {
      await createRecurrence(formData)
      onClose()
    })
  }

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-hd">
          <span className="modal-title">Nova Recorrência</span>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <form ref={formRef} action={handleSubmit}>
            {/* Type toggle */}
            <div className="quick-type" style={{ marginBottom: 20 }}>
              <button
                type="button"
                className={`qtype-btn exp ${type === "EXPENSE" ? "active" : ""}`}
                onClick={() => setType("EXPENSE")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                Despesa
              </button>
              <button
                type="button"
                className={`qtype-btn inc ${type === "INCOME" ? "active" : ""}`}
                onClick={() => setType("INCOME")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                Receita
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Descrição</label>
              <input className="form-input" name="description" required placeholder="Ex: Aluguel, Netflix…" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Valor (R$)</label>
                <input className="form-input" name="amount" type="number" min="0" step="0.01" required placeholder="0,00" />
              </div>
              <div className="form-group">
                <label className="form-label">Dia do mês</label>
                <input className="form-input" name="dayOfMonth" type="number" min="1" max="31" required placeholder="Ex: 5" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Categoria</label>
                <select className="form-input" name="categoryId" required>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Quem</label>
                <select className="form-input" name="userName" required>
                  <option value="Carlos">Carlos</option>
                  <option value="Esposa">Esposa</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={pending}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              {pending ? "Salvando…" : "Criar Recorrência"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

/* ── Main component ────────────────────────────────────── */
export function RecurrencesClient({ recurrences, categories }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  const active = recurrences.filter((r) => r.active)
  const monthlyExpense = active
    .filter((r) => r.type === "EXPENSE")
    .reduce((s, r) => s + r.amount, 0)
  const monthlyIncome = active
    .filter((r) => r.type === "INCOME")
    .reduce((s, r) => s + r.amount, 0)

  return (
    <>
      {/* Header actions — exported so the page can place them */}
      <div style={{ display: "flex", gap: 8 }}>
        <GenerateButton />
        <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nova
        </button>
      </div>

      {/* Summary cards */}
      <div className="budget-summary" style={{ marginTop: 0, marginBottom: 22 }}>
        <div className="budget-summary-card">
          <div className="budget-summary-lbl">Total</div>
          <div className="budget-summary-val">{recurrences.length}</div>
          <div className="budget-summary-sub">
            {active.length} ativa{active.length !== 1 ? "s" : ""} · {recurrences.length - active.length} pausada{recurrences.length - active.length !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="budget-summary-card">
          <div className="budget-summary-lbl">Saídas mensais</div>
          <div className="budget-summary-val" style={{ color: "var(--rose)" }}>{fmt(monthlyExpense)}</div>
          <div className="budget-summary-sub">despesas ativas</div>
        </div>
        <div className="budget-summary-card">
          <div className="budget-summary-lbl">Entradas mensais</div>
          <div className="budget-summary-val" style={{ color: "var(--emerald)" }}>{fmt(monthlyIncome)}</div>
          <div className="budget-summary-sub">receitas ativas</div>
        </div>
      </div>

      {/* List */}
      {recurrences.length === 0 ? (
        <div className="card">
          <div className="empty" style={{ padding: "48px 20px" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/>
              <path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
            </svg>
            <p style={{ marginBottom: 4 }}>Nenhuma recorrência cadastrada</p>
            <p style={{ fontSize: 12 }}>Crie recorrências para lançamentos que se repetem todo mês</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Quem</th>
                  <th>Todo dia</th>
                  <th>Valor</th>
                  <th>Ativa</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {recurrences.map((r) => {
                  const { color, bg } = getCategoryStyle(r.categoryName, r.type)
                  return (
                    <tr key={r.id} style={{ opacity: r.active ? 1 : 0.5 }}>
                      <td className="tbl-desc">{r.description}</td>
                      <td>
                        <span className="tag" style={{ background: bg, color }}>
                          {r.categoryEmoji} {r.categoryName}
                        </span>
                      </td>
                      <td style={{ color: "var(--text2)", fontSize: 12 }}>{r.userName}</td>
                      <td>
                        <span style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                          background: "var(--indigo-l)", color: "var(--indigo)",
                        }}>
                          dia {r.dayOfMonth}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span
                          className="amount"
                          style={{ color: r.type === "INCOME" ? "var(--emerald)" : "var(--text)" }}
                        >
                          {r.type === "INCOME" ? "+" : "−"}{fmt(r.amount)}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <ToggleSwitch id={r.id} active={r.active} />
                      </td>
                      <td style={{ textAlign: "right", padding: "13px 18px 13px 0" }}>
                        <DeleteButton id={r.id} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <CreateModal categories={categories} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
}
