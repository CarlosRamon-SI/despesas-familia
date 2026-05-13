"use client"

import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

ChartJS.register(ArcElement, Tooltip, Legend)

const CATEGORY_COLORS: Record<string, string> = {
  "Alimentação": "#F59E0B",
  "Transporte":  "#3B82F6",
  "Moradia":     "#6366F1",
  "Saúde":       "#EF4444",
  "Lazer":       "#8B5CF6",
  "Educação":    "#10B981",
}
const FALLBACK_COLORS = ["#6366F1", "#10B981", "#EF4444", "#F59E0B", "#3B82F6", "#8B5CF6", "#9CA3AF"]

type Props = {
  data: { name: string; emoji: string; total: number }[]
}

export function DoughnutChart({ data }: Props) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"
  const borderColor = isDark ? "#1A1916" : "#fff"
  const tickColor = isDark ? "#5C5B54" : "#9CA3AF"

  if (data.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text3)", fontSize: 13 }}>
        Nenhuma despesa este mês
      </div>
    )
  }

  const colors = data.map((d, i) => CATEGORY_COLORS[d.name] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length])

  return (
    <Doughnut
      data={{
        labels: data.map((d) => `${d.emoji} ${d.name}`),
        datasets: [
          {
            data: data.map((d) => d.total),
            backgroundColor: colors,
            borderWidth: 3,
            borderColor,
            hoverBorderColor: borderColor,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        cutout: "72%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                ` ${ctx.label}: ${Number(ctx.raw).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
            },
          },
        },
      }}
    />
  )
}
