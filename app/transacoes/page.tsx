import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { deleteTransaction } from "@/app/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default async function TransacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; tipo?: string }>
}) {
  const { mes, tipo } = await searchParams

  const now = new Date()
  const [year, month] = mes
    ? mes.split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1]

  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59)

  const transactions = await prisma.transaction.findMany({
    where: {
      date: { gte: start, lte: end },
      ...(tipo === "EXPENSE" || tipo === "INCOME" ? { type: tipo } : {}),
    },
    include: { category: true, user: true },
    orderBy: { date: "desc" },
  })

  const totalIncome = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0)

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return {
      value: `${d.getFullYear()}-${d.getMonth() + 1}`,
      label: d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
    }
  })

  const currentMonthValue = `${year}-${month}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="text-emerald-600 font-medium">+{formatCurrency(totalIncome)}</span>
            {" · "}
            <span className="text-rose-500 font-medium">-{formatCurrency(totalExpense)}</span>
          </p>
        </div>
        <Link href="/transacoes/nova" className={buttonVariants()}>
          + Nova
        </Link>
      </div>

      {/* Filtro de mês */}
      <div className="flex flex-wrap gap-2">
        {months.map((m) => (
          <Link
            key={m.value}
            href={`/transacoes?mes=${m.value}${tipo ? `&tipo=${tipo}` : ""}`}
            className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
              currentMonthValue === m.value
                ? "bg-primary text-primary-foreground"
                : "bg-background border hover:border-primary text-muted-foreground"
            }`}
          >
            {m.label}
          </Link>
        ))}
      </div>

      {/* Filtro tipo */}
      <div className="flex gap-2">
        {[
          { value: "", label: "Todas" },
          { value: "INCOME", label: "💰 Receitas" },
          { value: "EXPENSE", label: "💸 Despesas" },
        ].map((f) => (
          <Link
            key={f.value}
            href={`/transacoes?mes=${currentMonthValue}${f.value ? `&tipo=${f.value}` : ""}`}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              (tipo ?? "") === f.value
                ? "bg-foreground text-background"
                : "bg-background border hover:border-foreground text-muted-foreground"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-muted-foreground text-sm">Nenhuma transação neste período.</p>
              <Link href="/transacoes/nova" className="text-primary text-sm hover:underline mt-2 inline-block">
                Registrar transação
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Quem</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.description}</TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {t.category.emoji} {t.category.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{t.user.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(t.date).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={t.type === "INCOME" ? "outline" : "destructive"}
                        className={t.type === "INCOME" ? "text-emerald-600 border-emerald-300 bg-emerald-50" : ""}
                      >
                        {t.type === "INCOME" ? "+" : "-"}{formatCurrency(Number(t.amount))}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <form
                        action={async () => {
                          "use server"
                          await deleteTransaction(t.id)
                        }}
                      >
                        <button
                          type="submit"
                          className="text-muted-foreground/40 hover:text-destructive transition-colors text-lg leading-none"
                          title="Excluir"
                        >
                          ×
                        </button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
