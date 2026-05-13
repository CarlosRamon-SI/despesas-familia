import type { Metadata, Viewport } from "next"
import { Space_Grotesk, JetBrains_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { WorkbenchClientShell } from "@/components/workbench-client-shell"
import { SWRegister } from "@/app/components/sw-register"
import { prisma } from "@/lib/prisma"
import "./globals.css"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
})

export const viewport: Viewport = {
  themeColor: "#C8973C",
}

export const metadata: Metadata = {
  title: "Finan Workbench",
  description: "Gestão financeira familiar com integração WhatsApp",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Finan Workbench",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
}

async function getShellData() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  const [transactions, lastMonthTx, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: { date: { gte: start, lte: end } },
      include: { category: true },
      orderBy: { date: "desc" },
    }),
    prisma.transaction.findMany({
      where: { date: { gte: lastStart, lte: lastEnd } },
      select: { type: true, amount: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ])

  const income = transactions.filter(t => t.type === "INCOME")
  const expenses = transactions.filter(t => t.type === "EXPENSE")
  const totalIncome = income.reduce((s, t) => s + Number(t.amount), 0)
  const totalExpenses = expenses.reduce((s, t) => s + Number(t.amount), 0)
  const balance = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0

  const lastIncome = lastMonthTx.filter(t => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0)
  const lastExpenses = lastMonthTx.filter(t => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0)
  const lastBalance = lastIncome - lastExpenses
  const lastSavingsRate = lastIncome > 0 ? Math.round((lastBalance / lastIncome) * 100) : 0

  function pctChg(curr: number, prev: number): string {
    if (prev === 0) return "—"
    const p = Math.round(((curr - prev) / Math.abs(prev)) * 100)
    return `${p > 0 ? "+" : ""}${p}%`
  }

  const recentTransactions = transactions.slice(0, 5).map(t => ({
    id: t.id,
    desc: t.description,
    type: t.type as string,
    amount: Number(t.amount),
    cat: t.category.name,
  }))

  const catSpend: Record<string, number> = {}
  for (const t of expenses) {
    catSpend[t.category.name] = (catSpend[t.category.name] ?? 0) + Number(t.amount)
  }
  const topCategories = Object.entries(catSpend)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([name, spent]) => ({ name, spent }))

  return {
    categories,
    dockSummary: {
      balance, totalIncome, totalExpenses, savingsRate,
      recentTransactions, topCategories,
      gauges: {
        balanceChange: pctChg(balance, lastBalance),
        balanceUp: balance >= lastBalance,
        incomeChange: pctChg(totalIncome, lastIncome),
        incomeUp: totalIncome >= lastIncome,
        expenseChange: pctChg(totalExpenses, lastExpenses),
        expenseUp: totalExpenses <= lastExpenses,
        savingsChange: lastSavingsRate === 0 ? "—" : `${savingsRate - lastSavingsRate > 0 ? "+" : ""}${savingsRate - lastSavingsRate}pp`,
        savingsUp: savingsRate >= lastSavingsRate,
      },
    },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { categories, dockSummary } = await getShellData()

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
        <ThemeProvider>
          <WorkbenchClientShell categories={categories} dockSummary={dockSummary}>
            {children}
          </WorkbenchClientShell>
        </ThemeProvider>
        <SWRegister />
      </body>
    </html>
  )
}
