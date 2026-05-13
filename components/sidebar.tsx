"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useState, useEffect, useRef } from "react"

type DockSummary = {
  balance: number
  totalIncome: number
  totalExpenses: number
  savingsRate: number
  recentTransactions: { id: string; desc: string; type: string; amount: number; cat: string }[]
  topCategories: { name: string; spent: number }[]
}

type DockProps = {
  summary: DockSummary
  onNewTx: () => void
  user: string
  onUserSwitch: () => void
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

function TrayContent({ id, summary }: { id: string; summary: DockSummary }) {
  const month = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

  if (id === "dashboard") return (
    <div>
      <div className="wb-tray-label" style={{ textTransform: "capitalize" }}>{month}</div>
      <div className="wb-tray-row">
        <span>Saldo</span>
        <span className="wb-mono" style={{ color: "var(--indigo)", fontWeight: 600 }}>{fmt(summary.balance)}</span>
      </div>
      <div className="wb-tray-row">
        <span>Receitas</span>
        <span className="wb-mono" style={{ color: "var(--emerald)", fontWeight: 600 }}>{fmt(summary.totalIncome)}</span>
      </div>
      <div className="wb-tray-row">
        <span>Despesas</span>
        <span className="wb-mono" style={{ color: "var(--rose)", fontWeight: 600 }}>{fmt(summary.totalExpenses)}</span>
      </div>
      <div className="wb-tray-sep" />
      <div style={{ fontSize: 10, color: "var(--text3)" }}>
        Taxa de poupança:{" "}
        <span className="wb-mono" style={{ color: "var(--sky)", fontWeight: 600 }}>{summary.savingsRate}%</span>
      </div>
    </div>
  )

  if (id === "lancamentos") return (
    <div>
      <div className="wb-tray-label">Recentes</div>
      {summary.recentTransactions.slice(0, 4).map(t => (
        <div key={t.id} className="wb-tray-row">
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 110 }}>{t.desc}</span>
          <span className="wb-mono" style={{ color: t.type === "INCOME" ? "var(--emerald)" : "var(--text2)", fontWeight: 600, fontSize: 10.5 }}>
            {t.type === "INCOME" ? "+" : "−"}{fmt(t.amount)}
          </span>
        </div>
      ))}
    </div>
  )

  if (id === "orcamento") return (
    <div>
      <div className="wb-tray-label">Por categoria</div>
      {summary.topCategories.slice(0, 4).map(c => (
        <div key={c.name} style={{ marginBottom: 9 }}>
          <div className="wb-tray-row" style={{ marginBottom: 3 }}>
            <span>{c.name}</span>
            <span className="wb-mono" style={{ fontSize: 10, fontWeight: 600 }}>{fmt(c.spent)}</span>
          </div>
        </div>
      ))}
      {summary.topCategories.length === 0 && (
        <div style={{ fontSize: 11, color: "var(--text3)", textAlign: "center" }}>Sem dados</div>
      )}
    </div>
  )

  if (id === "relatorios") return (
    <div>
      <div className="wb-tray-label">Visão geral anual</div>
      <div style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.6, marginBottom: 10 }}>
        Receitas, despesas e poupança agrupadas por mês e categoria.
      </div>
      <div className="wb-tray-row">
        <span>Receita acum.</span>
        <span className="wb-mono" style={{ color: "var(--emerald)", fontWeight: 600 }}>{fmt(summary.totalIncome)}</span>
      </div>
      <div className="wb-tray-row">
        <span>Despesa acum.</span>
        <span className="wb-mono" style={{ color: "var(--rose)", fontWeight: 600 }}>{fmt(summary.totalExpenses)}</span>
      </div>
    </div>
  )

  if (id === "recorrencias") return (
    <div>
      <div className="wb-tray-label">Lançamentos fixos</div>
      <div style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.6, marginBottom: 10 }}>
        Despesas e receitas recorrentes geradas automaticamente a cada virada de mês.
      </div>
      <div style={{ fontSize: 10, color: "var(--text3)" }}>
        Marque <span style={{ fontWeight: 700, color: "var(--indigo)" }}>Repetir todo mês</span> ao criar um lançamento.
      </div>
    </div>
  )

  if (id === "whatsapp") return (
    <div>
      <div className="wb-tray-label">Bot integrado</div>
      <div style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.6, marginBottom: 10 }}>
        Registre transações diretamente pelo WhatsApp com linguagem natural.
      </div>
      <div style={{ fontSize: 10, color: "var(--text3)", lineHeight: 1.7 }}>
        <div><span style={{ color: "var(--indigo)", fontFamily: "var(--mono)" }}>gastei 45 no mercado</span></div>
        <div><span style={{ color: "var(--indigo)", fontFamily: "var(--mono)" }}>recebi 3000 de salário</span></div>
        <div><span style={{ color: "var(--indigo)", fontFamily: "var(--mono)" }}>resumo</span></div>
      </div>
    </div>
  )

  if (id === "configuracoes") return (
    <div>
      <div className="wb-tray-label">Membros</div>
      {[
        { name: "Carlos", role: "Admin", color: "#4F46E5" },
        { name: "Esposa", role: "Membro", color: "#7C3AED" },
      ].map(m => (
        <div key={m.name} className="wb-tray-row" style={{ alignItems: "center", gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
            {m.name.slice(0, 2).toUpperCase()}
          </div>
          <span style={{ flex: 1 }}>{m.name}</span>
          <span style={{ fontSize: 10, color: "var(--text3)" }}>{m.role}</span>
        </div>
      ))}
    </div>
  )

  return null
}

const NAV_ITEMS = [
  {
    id: "dashboard", href: "/", label: "Painel",
    icon: (
      <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/>
        <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/>
        <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/>
        <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>
      </svg>
    ),
  },
  {
    id: "lancamentos", href: "/lancamentos", label: "Lançamentos",
    icon: (
      <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 16V4m0 0L3 8m4-4l4 4"/>
        <path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
      </svg>
    ),
  },
  {
    id: "orcamento", href: "/orcamento", label: "Orçamento",
    icon: (
      <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="5"/>
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    id: "relatorios", href: "/relatorios", label: "Relatórios",
    icon: (
      <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    id: "recorrencias", href: "/recorrencias", label: "Recorrências",
    icon: (
      <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 1l4 4-4 4"/>
        <path d="M3 11V9a4 4 0 014-4h14"/>
        <path d="M7 23l-4-4 4-4"/>
        <path d="M21 13v2a4 4 0 01-4 4H3"/>
      </svg>
    ),
  },
  {
    id: "whatsapp", href: "/whatsapp", label: "WhatsApp", badge: true,
    icon: (
      <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
  },
  {
    id: "configuracoes", href: "/configuracoes", label: "Configurações",
    icon: (
      <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    ),
  },
]

function DockIcon({
  id, href, icon, label, badge, active, summary,
}: {
  id: string; href: string; icon: React.ReactNode; label: string
  badge?: boolean; active: boolean; summary: DockSummary
}) {
  const [tray, setTray] = useState(false)
  const enterTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const showTray = () => {
    clearTimeout(leaveTimer.current)
    enterTimer.current = setTimeout(() => setTray(true), 170)
  }
  const hideTray = () => {
    clearTimeout(enterTimer.current)
    leaveTimer.current = setTimeout(() => setTray(false), 260)
  }

  return (
    <div className="wb-icon-wrap" onMouseEnter={showTray} onMouseLeave={hideTray}>
      <Link
        href={href}
        className={`wb-icon-btn${active ? " active" : ""}${tray && !active ? " hovered" : ""}`}
        onClick={() => setTray(false)}
        title={label}
      >
        {icon}
        {active && <div className="wb-active-bar" />}
        {badge && <div className="wb-badge-dot" />}
      </Link>

      <div
        className={`wb-tray${tray ? " visible" : ""}`}
        onMouseEnter={() => { clearTimeout(leaveTimer.current); setTray(true) }}
        onMouseLeave={hideTray}
      >
        <div className="wb-tray-title">
          <span>{label}</span>
          {badge && <span className="wb-tray-badge">BETA</span>}
        </div>
        <TrayContent id={id} summary={summary} />
        <Link href={href} className="wb-tray-open" onClick={() => setTray(false)}>
          Abrir seção →
        </Link>
      </div>
    </div>
  )
}

export function Sidebar({ summary, onNewTx, user, onUserSwitch }: DockProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted && theme === "dark"

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <aside className="wb-dock">
      {/* Logo */}
      <div className="wb-dock-logo">
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#1a1000" strokeWidth="2">
          <rect x="1" y="4" width="22" height="16" rx="2"/>
          <path d="M1 10h22"/>
          <circle cx="18" cy="15" r="1" fill="#1a1000" stroke="none"/>
        </svg>
      </div>

      {/* Navigation */}
      <nav className="wb-dock-nav">
        {NAV_ITEMS.map(item => (
          <DockIcon
            key={item.id}
            {...item}
            active={isActive(item.href)}
            summary={summary}
          />
        ))}
      </nav>

      <div className="wb-dock-sep" />

      {/* Bottom controls */}
      <div className="wb-dock-bottom">
        <button
          className={`wb-dock-ctrl${isDark ? " dark-mode" : ""}`}
          onClick={() => setTheme(isDark ? "light" : "dark")}
          title={isDark ? "Tema Claro" : "Tema Escuro"}
        >
          {isDark ? (
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            </svg>
          )}
        </button>

        <button
          className="wb-dock-avatar"
          onClick={onUserSwitch}
          title={`${user} — trocar`}
        >
          {user.slice(0, 2).toUpperCase()}
        </button>

        <button
          className="wb-dock-fab"
          onClick={onNewTx}
          title="Novo Lançamento"
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#1a1000" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>
  )
}
