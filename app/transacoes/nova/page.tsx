import { prisma } from "@/lib/prisma"
import { createTransaction } from "@/app/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default async function NovaTransacaoPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } })
  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nova transação</h1>
        <p className="text-muted-foreground text-sm mt-1">Registre uma receita ou despesa</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTransaction} className="space-y-5">
            {/* Tipo */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center justify-center gap-2 border rounded-lg px-3 py-2.5 text-sm cursor-pointer has-[:checked]:bg-rose-50 has-[:checked]:border-rose-400 has-[:checked]:text-rose-700 transition-colors">
                  <input type="radio" name="type" value="EXPENSE" defaultChecked className="sr-only" />
                  💸 Despesa
                </label>
                <label className="flex items-center justify-center gap-2 border rounded-lg px-3 py-2.5 text-sm cursor-pointer has-[:checked]:bg-emerald-50 has-[:checked]:border-emerald-400 has-[:checked]:text-emerald-700 transition-colors">
                  <input type="radio" name="type" value="INCOME" className="sr-only" />
                  💰 Receita
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                name="description"
                required
                placeholder="Ex: Salário, Almoço no restaurante..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                name="amount"
                required
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Categoria</Label>
              <select
                id="categoryId"
                name="categoryId"
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="userName">Quem</Label>
              <select
                id="userName"
                name="userName"
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="Carlos">Carlos</option>
                <option value="Esposa">Esposa</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={today}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Registrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
