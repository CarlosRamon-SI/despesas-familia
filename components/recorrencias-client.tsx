"use client"

import { useState, useTransition } from "react"

type TxRow = {
  id:            string
  type:          "EXPENSE" | "INCOME"
  description:   string
  amount:        number
  date:          string
  categoryName:  string
  categoryEmoji: string
  userName:      string
}

type Props = { transactions: TxRow[] }

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

export function RecorrenciasClient({ transactions }: Props) {
  const [result, setResult] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()

  function rollMonth() {
    startTransition(async () => {
      const res = await fetch("/api/cron/roll-recurrences")
      if (res.ok) {
        const { created } = await res.json()
        setResult(created)
        setTimeout(() => window.location.reload(), 800)
      }
    })
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "var(--text3)" }}>
          {transactions.length === 0
            ? "Nenhuma transação recorrente agendada para os próximos meses."
            : `${transactions.length} transaç${transactions.length === 1 ? "ão" : "ões"} agendada${transactions.length === 1 ? "" : "s"}`}
        </div>
        <button
          onClick={rollMonth}
          disabled={pending}
          style={{
            padding: "8px 16px", borderRadius: "var(--r-sm)", border: "none", cursor: pending ? "not-allowed" : "pointer",
            background: result !== null ? "#22c55e" : "var(--amber, #C8973C)",
            color: "#1a1000", fontWeight: 700, fontSize: 12.5, transition: "background .2s",
          }}
        >
          {pending ? "Propagando…" : result !== null ? `✓ ${result} criadas` : "Propagar Mês Seguinte"}
        </button>
      </div>

      {transactions.length > 0 && (
        <div className="table-wrap">
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Data prevista</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Quem</th>
                  <th style={{ textAlign: "right" }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id}>
                    <td style={{ fontSize: 12.5, color: "var(--text2)", whiteSpace: "nowrap" }}>
                      {fmtDate(tx.date)}
                    </td>
                    <td style={{ fontWeight: 500 }}>{tx.description}</td>
                    <td style={{ fontSize: 12.5, color: "var(--text2)" }}>
                      {tx.categoryEmoji} {tx.categoryName}
                    </td>
                    <td style={{ fontSize: 12.5, color: "var(--text2)" }}>{tx.userName}</td>
                    <td style={{ textAlign: "right" }}>
                      <span className={`amount ${tx.type === "INCOME" ? "pos" : "neg"}`}>
                        {tx.type === "INCOME" ? "+" : "−"}{fmt(tx.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
