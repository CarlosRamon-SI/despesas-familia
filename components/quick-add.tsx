"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { createTransaction } from "@/app/actions"
import type { Category } from "@prisma/client"

type Props = {
  categories: Category[]
  defaultType?: "EXPENSE" | "INCOME"
  /** Render as inline form (dashboard card). Without this, renders a trigger button that opens a modal. */
  inline?: boolean
  triggerLabel?: string
  triggerClass?: string
}

export function QuickAdd({ categories, defaultType = "EXPENSE", inline, triggerLabel, triggerClass }: Props) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<"EXPENSE" | "INCOME">(defaultType)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const [today, setToday] = useState("")
  useEffect(() => {
    const d = new Date()
    setToday(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`)
  }, [])

  function handleSubmit(formData: FormData) {
    formData.set("type", type)
    startTransition(async () => {
      await createTransaction(formData)
      formRef.current?.reset()
      setType(defaultType)
      if (!inline) setOpen(false)
    })
  }

  const form = (
    <form ref={formRef} action={handleSubmit}>
      <div className="quick-type">
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
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          Receita
        </button>
      </div>

      <div className="form-group">
        <label className="form-label">Descrição</label>
        <input className="form-input" name="description" required placeholder="Ex: Mercado, Combustível…" />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Valor (R$)</label>
          <input className="form-input" name="amount" type="number" min="0" step="0.01" required placeholder="0,00" />
        </div>
        <div className="form-group">
          <label className="form-label">Categoria</label>
          <select className="form-input" name="categoryId" required>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Quem</label>
          <select className="form-input" name="userName" required>
            <option value="Carlos">Carlos</option>
            <option value="Esposa">Esposa</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Data</label>
          <input className="form-input" name="date" type="date" defaultValue={today} required />
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
        {pending ? "Salvando…" : "Adicionar"}
      </button>
    </form>
  )

  if (inline) return form

  return (
    <>
      <button className={triggerClass ?? "btn btn-primary btn-sm"} onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {triggerLabel}
      </button>

      {open && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal">
            <div className="modal-hd">
              <span className="modal-title">Novo Lançamento</span>
              <button className="modal-close" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">{form}</div>
          </div>
        </div>
      )}
    </>
  )
}
