"use client"

import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

type Props = {
  data: { label: string; income: number; expense: number }[]
}

export function CashflowChart({ data }: Props) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"
  const tickColor = isDark ? "#5C5B54" : "#9CA3AF"

  return (
    <Bar
      data={{
        labels: data.map((d) => d.label),
        datasets: [
          {
            label: "Receitas",
            data: data.map((d) => d.income),
            backgroundColor: "rgba(99,102,241,.82)",
            borderRadius: 6,
            barPercentage: 0.55,
            categoryPercentage: 0.8,
          },
          {
            label: "Despesas",
            data: data.map((d) => d.expense),
            backgroundColor: "rgba(239,68,68,.72)",
            borderRadius: 6,
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
              label: (ctx) =>
                ` ${Number(ctx.raw).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: "Manrope", size: 11 }, color: tickColor },
            border: { display: false },
          },
          y: {
            grid: { color: gridColor },
            border: { display: false, dash: [4, 4] },
            ticks: {
              font: { family: "Manrope", size: 11 },
              color: tickColor,
              callback: (v) => "R$" + (Number(v) / 1000).toFixed(0) + "k",
            },
          },
        },
      }}
    />
  )
}
