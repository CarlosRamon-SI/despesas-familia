"use client"

import { Bar, Doughnut, Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  type TooltipItem,
} from "chart.js"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Legend, Filler
)

const CATEGORY_CHART_COLORS: Record<string, string> = {
  "Alimentação": "#F59E0B",
  "Transporte":  "#3B82F6",
  "Moradia":     "#6366F1",
  "Saúde":       "#EF4444",
  "Lazer":       "#8B5CF6",
  "Educação":    "#10B981",
}
const FALLBACK = ["#6366F1", "#10B981", "#EF4444", "#F59E0B", "#3B82F6", "#8B5CF6", "#9CA3AF"]

type Props = {
  months: { label: string; income: number; expense: number; balance: number }[]
  categories: { name: string; emoji: string; total: number }[]
}

export function ReportsCharts({ months, categories }: Props) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"
  const tickColor = isDark ? "#5C5B54" : "#9CA3AF"
  const borderC  = isDark ? "#1A1916" : "#fff"

  const cumulative = months.reduce<number[]>((acc, m) => [
    ...acc,
    (acc[acc.length - 1] ?? 0) + m.balance,
  ], [])

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  const catColors = categories.map((c, i) => CATEGORY_CHART_COLORS[c.name] ?? FALLBACK[i % FALLBACK.length])

  const axisX = {
    grid: { display: false },
    ticks: { font: { family: "Manrope", size: 11 as const }, color: tickColor },
    border: { display: false },
  }
  const axisY = {
    grid: { color: gridColor },
    border: { display: false, dash: [4, 4] as number[] },
    ticks: {
      font: { family: "Manrope", size: 11 as const },
      color: tickColor,
      callback: (v: number | string) => "R$" + (Number(v) / 1000).toFixed(0) + "k",
    },
  }

  return (
    <>
      <div className="charts-row" style={{ marginBottom: 22 }}>
        {/* Cashflow anual */}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Cashflow Anual</div>
              <div className="card-sub">Receitas vs Despesas — 12 meses</div>
            </div>
          </div>
          <div className="chart-wrap" style={{ height: 220 }}>
            <Bar
              data={{
                labels: months.map(m => m.label),
                datasets: [
                  {
                    label: "Receitas",
                    data: months.map(m => m.income),
                    backgroundColor: "rgba(99,102,241,.82)",
                    borderRadius: 5,
                    barPercentage: 0.55,
                    categoryPercentage: 0.8,
                  },
                  {
                    label: "Despesas",
                    data: months.map(m => m.expense),
                    backgroundColor: "rgba(239,68,68,.72)",
                    borderRadius: 5,
                    barPercentage: 0.55,
                    categoryPercentage: 0.8,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top",
                    align: "end",
                    labels: {
                      boxWidth: 8,
                      boxHeight: 8,
                      usePointStyle: true,
                      pointStyle: "circle",
                      font: { family: "Manrope", size: 11, weight: 600 as const },
                      color: tickColor,
                      padding: 16,
                    },
                  },
                  tooltip: {
                    callbacks: {
                      label: (ctx: TooltipItem<"bar">) => ` ${fmt(Number(ctx.raw))}`,
                    },
                  },
                },
                scales: { x: axisX, y: axisY },
              }}
            />
          </div>
        </div>

        {/* Categorias */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 4 }}>Por Categoria</div>
          <div className="card-sub" style={{ marginBottom: 14 }}>Despesas do ano</div>
          {categories.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 140, color: "var(--text3)", fontSize: 13 }}>
              Nenhuma despesa
            </div>
          ) : (
            <>
              <div className="donut-wrap">
                <Doughnut
                  data={{
                    labels: categories.map(c => `${c.emoji} ${c.name}`),
                    datasets: [{
                      data: categories.map(c => c.total),
                      backgroundColor: catColors,
                      borderWidth: 3,
                      borderColor: borderC,
                      hoverBorderColor: borderC,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "72%",
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (ctx: TooltipItem<"doughnut">) =>
                            ` ${ctx.label}: ${fmt(Number(ctx.raw))}`,
                        },
                      },
                    },
                  }}
                />
              </div>
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 7 }}>
                {categories.slice(0, 5).map((c, i) => (
                  <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: catColors[i], flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "var(--text2)", flex: 1 }}>{c.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{fmt(c.total)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Evolução do saldo */}
      <div className="card" style={{ marginBottom: 22 }}>
        <div className="card-head">
          <div>
            <div className="card-title">Evolução do Saldo</div>
            <div className="card-sub">Saldo acumulado mês a mês</div>
          </div>
        </div>
        <div className="chart-wrap" style={{ height: 180 }}>
          <Line
            data={{
              labels: months.map(m => m.label),
              datasets: [{
                label: "Saldo Acumulado",
                data: cumulative,
                borderColor: "#6366F1",
                backgroundColor: "rgba(99,102,241,0.08)",
                fill: true,
                tension: 0.35,
                pointRadius: 4,
                pointBackgroundColor: "#6366F1",
                pointBorderColor: borderC,
                pointBorderWidth: 2,
                borderWidth: 2,
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (ctx: TooltipItem<"line">) => ` ${fmt(Number(ctx.raw))}`,
                  },
                },
              },
              scales: { x: axisX, y: axisY },
            }}
          />
        </div>
      </div>
    </>
  )
}
