"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { GaugeStrip } from "@/components/gauge-strip"
import { NewTxDrawer } from "@/components/new-tx-drawer"
import type { Category } from "@prisma/client"

type DockSummary = {
  balance: number
  totalIncome: number
  totalExpenses: number
  savingsRate: number
  recentTransactions: { id: string; desc: string; type: string; amount: number; cat: string }[]
  topCategories: { name: string; spent: number }[]
  gauges: {
    balanceChange: string; balanceUp: boolean
    incomeChange: string; incomeUp: boolean
    expenseChange: string; expenseUp: boolean
    savingsChange: string; savingsUp: boolean
  }
}

type Props = {
  categories: Category[]
  dockSummary: DockSummary
  children: React.ReactNode
}

export function WorkbenchClientShell({ categories, dockSummary, children }: Props) {
  const [addOpen, setAddOpen] = useState(false)
  const [user, setUser] = useState("Carlos")

  return (
    <div className="shell">
      <Sidebar
        summary={dockSummary}
        onNewTx={() => setAddOpen(true)}
        user={user}
        onUserSwitch={() => setUser(u => u === "Carlos" ? "Esposa" : "Carlos")}
      />

      <main className="main">
        <GaugeStrip data={dockSummary} />
        <div className="wb-scroll">
          {children}
        </div>
      </main>

      <NewTxDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        categories={categories}
      />
    </div>
  )
}
