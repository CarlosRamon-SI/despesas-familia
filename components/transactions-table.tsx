"use client"

import { useState, useTransition } from "react"
import { deleteTransaction } from "@/app/actions"
import { getCategoryStyle } from "@/lib/category-colors"

type Transaction = {
  id: string
  type: "EXPENSE" | "INCOME"
  description: string
  amount: number
  date: string
  categoryName: string
  categoryEmoji: string
  userName: string
}

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  const [search, setSearch] = useState("")
  const [pending, startTransition] = useTransition()

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  const filtered = transactions.filter(
    (t) =>
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.categoryName.toLowerCase().includes(search.toLowerCase()) ||
      t.userName.toLowerCase().includes(search.toLowerCase())
  )

  function handleDelete(id: string) {
    startTransition(() => deleteTransaction(id))
  }

  if (transactions.length === 0) {
    return (
      <div className="empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
          <rect x="9" y="3" width="6" height="4" rx="1"/>
        </svg>
        <p>Nenhum lançamento neste período</p>
      </div>
    )
  }

  return (
    <>
      <div style={{ padding: "10px 22px", borderBottom: "1px solid var(--border)" }}>
        <div className="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="search-input"
            placeholder="Buscar lançamento…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Quem</th>
              <th>Data</th>
              <th>Valor</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const { color, bg } = getCategoryStyle(t.categoryName, t.type)
              return (
                <tr key={t.id}>
                  <td className="tbl-desc">{t.description}</td>
                  <td>
                    <span className="tag" style={{ background: bg, color }}>
                      {t.categoryEmoji} {t.categoryName}
                    </span>
                  </td>
                  <td style={{ color: "var(--text2)", fontSize: 12 }}>{t.userName}</td>
                  <td className="tbl-date">{new Date(t.date).toLocaleDateString("pt-BR")}</td>
                  <td style={{ textAlign: "right" }}>
                    <span className={`amount ${t.type === "INCOME" ? "pos" : "neg"}`}>
                      {t.type === "INCOME" ? "+" : "−"}{fmt(t.amount)}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", padding: "13px 18px 13px 0" }}>
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={pending}
                      style={{
                        color: "var(--text3)",
                        fontSize: 18,
                        lineHeight: 1,
                        padding: "2px 6px",
                        borderRadius: 4,
                        transition: ".15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--rose)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text3)")}
                      title="Excluir"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
