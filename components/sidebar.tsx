"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Suspense, useEffect, useState } from "react"

const navItems = [
  {
    section: "Principal",
    items: [
      {
        href: "/",
        label: "Painel",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/>
            <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/>
            <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/>
            <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>
          </svg>
        ),
      },
      {
        href: "/lancamentos",
        label: "Lançamentos",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 16V4m0 0L3 8m4-4l4 4"/>
            <path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
          </svg>
        ),
      },
      {
        href: "/orcamento",
        label: "Orçamento",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="5"/>
            <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
          </svg>
        ),
      },
      {
        href: "/relatorios",
        label: "Relatórios",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        ),
      },
    ],
  },
  {
    section: "Automação",
    items: [
      {
        href: "/recorrencias",
        label: "Recorrências",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 1l4 4-4 4"/>
            <path d="M3 11V9a4 4 0 014-4h14"/>
            <path d="M7 23l-4-4 4-4"/>
            <path d="M21 13v2a4 4 0 01-4 4H3"/>
          </svg>
        ),
      },
      {
        href: "/whatsapp",
        label: "WhatsApp",
        badge: "BETA",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        ),
      },
    ],
  },
  {
    section: "Sistema",
    items: [
      {
        href: "/configuracoes",
        label: "Configurações",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        ),
      },
    ],
  },
]

function SidebarInner() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = mounted && theme === "dark"

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  function closeSidebar() {
    document.documentElement.classList.remove("sb-open")
  }

  return (
    <>
      <div className="sb-overlay" onClick={closeSidebar} aria-hidden />

      <aside className="sidebar">
        <button className="sb-close" onClick={closeSidebar} aria-label="Fechar menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Logo */}
        <div className="sb-logo">
          <div className="sb-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2"/>
              <path d="M1 10h22"/>
              <circle cx="18" cy="15" r="1" fill="currentColor" stroke="none"/>
            </svg>
          </div>
          <div>
            <div className="sb-logo-name">FamilyFlow</div>
            <div className="sb-logo-tag">Gestão Doméstica</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sb-nav">
          {navItems.map((group) => (
            <div key={group.section}>
              <div className="sb-section">{group.section}</div>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sb-item ${isActive(item.href) ? "active" : ""}`}
                  onClick={closeSidebar}
                >
                  {item.icon}
                  {item.label}
                  {"badge" in item && item.badge && (
                    <span className="sb-badge">{item.badge}</span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Dark mode toggle */}
        <div className="sb-bottom">
          <button
            className="theme-btn"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            )}
            <span>{isDark ? "Tema Claro" : "Tema Escuro"}</span>
            <div className="theme-track">
              <div className="theme-thumb" />
            </div>
          </button>
        </div>

        {/* WhatsApp promo card */}
        <div className="sb-whatsapp-promo">
          <div className="promo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          <div className="promo-title">Lance pelo WhatsApp</div>
          <p className="promo-desc">Registre despesas sem abrir o app</p>
          <Link href="/whatsapp" className="promo-btn" onClick={closeSidebar}>
            Conectar agora
          </Link>
        </div>
      </aside>
    </>
  )
}

export function Sidebar() {
  return (
    <Suspense fallback={null}>
      <SidebarInner />
    </Suspense>
  )
}
