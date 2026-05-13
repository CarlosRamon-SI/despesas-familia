"use client"

import { ReactNode } from "react"

export function Topbar({ title, children }: { title: ReactNode; children?: ReactNode }) {
  function openSidebar() {
    document.documentElement.classList.add("sb-open")
  }

  return (
    <header className="topbar">
      <button className="menu-btn" onClick={openSidebar} aria-label="Abrir menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Title — shown on mobile only, hidden on desktop */}
      <span className="topbar-title">{title}</span>

      {/* Search — desktop only (hidden via CSS on mobile) */}
      <div className="topbar-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input placeholder="Buscar transações…" />
      </div>

      <div className="topbar-spacer" />

      {/* Bell */}
      <button className="topbar-bell" aria-label="Notificações">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
      </button>

      {/* Page actions */}
      {children && <div className="topbar-actions">{children}</div>}

      {/* User pill */}
      <div className="topbar-user">
        <div className="topbar-user-avatar">FS</div>
        <div>
          <div className="topbar-user-name">Família</div>
          <div className="topbar-user-sub">Carlos · Esposa</div>
        </div>
      </div>
    </header>
  )
}
