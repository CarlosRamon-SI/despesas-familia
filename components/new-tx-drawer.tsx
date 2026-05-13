"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { createTransaction, createCategory } from "@/app/actions"
import type { Category } from "@prisma/client"

type Props = {
  open: boolean
  onClose: () => void
  categories: Category[]
}

type LocalCat = { id: string; name: string; emoji: string }

function formatBRL(digits: string): string {
  if (!digits) return ""
  const cents = parseInt(digits, 10)
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function digitsToDecimal(digits: string): string {
  if (!digits) return ""
  return (parseInt(digits, 10) / 100).toFixed(2)
}

export function NewTxDrawer({ open, onClose, categories }: Props) {
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE")
  const [recorrente, setRecorrente] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const [today, setToday] = useState("")

  // Amount mask
  const [amountDigits, setAmountDigits] = useState("")

  // Category creation
  const [localCats, setLocalCats] = useState<LocalCat[]>([])
  const [selectedCatId, setSelectedCatId] = useState("")
  const [newCatMode, setNewCatMode] = useState(false)
  const [catEmoji, setCatEmoji] = useState("")
  const [catName, setCatName] = useState("")
  const [catPending, startCatTransition] = useTransition()

  const allCats: LocalCat[] = [
    ...categories,
    ...localCats.filter(lc => !categories.some(c => c.id === lc.id)),
  ]

  useEffect(() => {
    const d = new Date()
    setToday(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`)
  }, [])

  // Pre-select first category on open
  useEffect(() => {
    if (open && allCats.length > 0 && !selectedCatId) {
      setSelectedCatId(allCats[0].id)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose])

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").replace(/^0+/, "") || ""
    setAmountDigits(digits)
  }

  function handleSubmit(formData: FormData) {
    formData.set("type", type)
    formData.set("amount", digitsToDecimal(amountDigits))
    formData.set("categoryId", selectedCatId)
    if (recorrente) formData.set("recorrente", "on")
    startTransition(async () => {
      await createTransaction(formData)
      setSaved(true)
      formRef.current?.reset()
      setType("EXPENSE")
      setRecorrente(false)
      setAmountDigits("")
      setTimeout(() => {
        setSaved(false)
        onClose()
      }, 900)
    })
  }

  function handleCreateCategory() {
    const fd = new FormData()
    fd.set("catName", catName)
    fd.set("catEmoji", catEmoji || "•")
    startCatTransition(async () => {
      const result = await createCategory(fd)
      if (result) {
        const newCat: LocalCat = result
        setLocalCats(prev => [...prev, newCat])
        setSelectedCatId(newCat.id)
      }
      setNewCatMode(false)
      setCatName("")
      setCatEmoji("")
    })
  }

  const month = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,.45)", backdropFilter: "blur(3px)",
          zIndex: 300, opacity: open ? 1 : 0, transition: "opacity .28s",
          pointerEvents: open ? "auto" : "none",
        }}
      />

      {/* Drawer */}
      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0, width: 380,
        background: "var(--surface)", borderLeft: "1px solid var(--border2)",
        zIndex: 400, display: "flex", flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform .28s cubic-bezier(.4,0,.2,1)",
        boxShadow: "-20px 0 60px rgba(0,0,0,0.4)",
      }}>
        {/* Header */}
        <div className="wb-drawer-hd">
          <div>
            <div className="wb-drawer-title">Novo Lançamento</div>
            <div className="wb-drawer-sub" style={{ textTransform: "capitalize" }}>{month}</div>
          </div>
          <button className="wb-drawer-close" onClick={onClose} aria-label="Fechar">
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} action={handleSubmit} className="wb-drawer-body">
          {/* Type selector */}
          <div className="wb-type-grid">
            {([["EXPENSE", "Despesa", "exp"], ["INCOME", "Receita", "inc"]] as const).map(([v, l, cls]) => (
              <button key={v} type="button"
                className={`wb-type-btn ${cls} ${type === v ? "active" : ""}`}
                onClick={() => setType(v)}
              >{l}</button>
            ))}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="wb-field-lbl">Descrição</label>
            <input className="wb-field-input" name="description" required placeholder="Ex: Mercado, Combustível…" />
          </div>

          {/* Amount + Category */}
          <div className="form-row">
            <div className="form-group">
              <label className="wb-field-lbl">Valor (R$)</label>
              <input
                className="wb-field-input wb-mono"
                inputMode="numeric"
                value={amountDigits ? formatBRL(amountDigits) : ""}
                onChange={handleAmountChange}
                placeholder="0,00"
                required
                style={{ letterSpacing: "0.02em" }}
              />
            </div>
            <div className="form-group">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                <label className="wb-field-lbl" style={{ marginBottom: 0 }}>Categoria</label>
                <button
                  type="button"
                  onClick={() => setNewCatMode(m => !m)}
                  style={{
                    fontSize: 10, fontWeight: 700, color: "var(--indigo)",
                    background: "none", border: "none", cursor: "pointer", padding: 0,
                    textDecoration: newCatMode ? "underline" : "none",
                  }}
                >
                  {newCatMode ? "cancelar" : "+ nova"}
                </button>
              </div>

              {newCatMode ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    className="wb-field-input"
                    value={catEmoji}
                    onChange={e => setCatEmoji(e.target.value)}
                    placeholder="🏷️"
                    maxLength={2}
                    style={{ width: 46, flexShrink: 0, textAlign: "center", fontSize: 16, padding: "9px 6px" }}
                  />
                  <input
                    className="wb-field-input"
                    value={catName}
                    onChange={e => setCatName(e.target.value)}
                    placeholder="Nome"
                    style={{ flex: 1 }}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleCreateCategory() } }}
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={catPending || !catName.trim()}
                    style={{
                      padding: "0 10px", borderRadius: 7, border: "none",
                      background: "var(--indigo)", color: "var(--bg)",
                      fontWeight: 700, fontSize: 12, cursor: catName.trim() ? "pointer" : "not-allowed",
                      flexShrink: 0, opacity: catName.trim() ? 1 : 0.5,
                    }}
                  >
                    {catPending ? "…" : "✓"}
                  </button>
                </div>
              ) : (
                <select
                  className="wb-field-input"
                  value={selectedCatId}
                  onChange={e => setSelectedCatId(e.target.value)}
                  required
                >
                  {allCats.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Who + Date */}
          <div className="form-row">
            <div className="form-group">
              <label className="wb-field-lbl">Quem</label>
              <select className="wb-field-input" name="userName" required>
                <option value="Carlos">Carlos</option>
                <option value="Esposa">Esposa</option>
              </select>
            </div>
            <div className="form-group">
              <label className="wb-field-lbl">Data</label>
              <input className="wb-field-input" name="date" type="date" defaultValue={today} required />
            </div>
          </div>

          {/* Recorrente toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Repetir todo mês</div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>Gera cópia automática no mês seguinte</div>
            </div>
            <button
              type="button"
              onClick={() => setRecorrente(r => !r)}
              style={{
                position: "relative", width: 40, height: 22, borderRadius: 11, border: "none",
                cursor: "pointer", flexShrink: 0,
                background: recorrente ? "var(--amber, #C8973C)" : "var(--border)",
                transition: "background .2s",
              }}
              aria-pressed={recorrente}
            >
              <span style={{
                position: "absolute", top: 3, left: recorrente ? 21 : 3,
                width: 16, height: 16, borderRadius: "50%",
                background: "#fff", transition: "left .2s", display: "block",
              }} />
            </button>
          </div>

          {/* Submit */}
          <button type="submit" className={`wb-submit ${saved ? "saved" : ""}`} disabled={pending || !amountDigits}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {saved
                ? <polyline points="20 6 9 17 4 12"/>
                : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>
              }
            </svg>
            {saved ? "Salvo!" : pending ? "Salvando…" : "Adicionar Lançamento"}
          </button>
        </form>

        {/* Footer */}
        <div className="wb-drawer-ft">
          Pressione <kbd>Esc</kbd> para fechar
        </div>
      </div>
    </>
  )
}
