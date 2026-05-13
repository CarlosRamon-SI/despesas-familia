'use client'

import { useEffect, useState, useTransition, useCallback, useRef } from 'react'
import { Topbar } from '@/components/topbar'
import type { StatusData } from '@/lib/whatsapp/status'

type BotConfig = { mode: 'DEDICATED' | 'SHARED'; sharedSource: string | null }
type User = { id: string; name: string; phone: string; allowed: boolean }

const commands = [
  { cmd: 'gastei 45 no almoço', desc: 'Registra despesa' },
  { cmd: 'recebi 3000 de salário', desc: 'Registra receita' },
  { cmd: 'farmácia 32,90', desc: 'Formato curto (despesa)' },
  { cmd: 'resumo', desc: 'Saldo do mês atual' },
  { cmd: 'categorias', desc: 'Gastos por categoria' },
  { cmd: 'últimas', desc: 'Últimas 10 transações' },
  { cmd: 'cancelar', desc: 'Remove o último lançamento (pede confirmação)' },
  { cmd: 'ajuda', desc: 'Lista de comandos' },
]

const STATUS_LABEL: Record<string, string> = {
  initializing: 'Inicializando…',
  qr: 'Aguardando QR Code',
  connected: 'Conectado',
  disconnected: 'Desconectado',
}
const STATUS_COLOR: Record<string, string> = {
  initializing: '#f59e0b',
  qr: '#f59e0b',
  connected: '#22c55e',
  disconnected: '#ef4444',
}

export default function WhatsAppPage() {
  const [status, setStatus] = useState<StatusData | null>(null)
  const [config, setConfig] = useState<BotConfig | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [sharedInput, setSharedInput] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [savedOk, setSavedOk] = useState(false)
  const [isPending, startTransition] = useTransition()
  const logBoxRef = useRef<HTMLDivElement>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/status')
      if (res.ok) setStatus(await res.json())
    } catch { /* bot não iniciado */ }
  }, [])

  const fetchConfig = useCallback(async () => {
    const res = await fetch('/api/whatsapp/config')
    if (res.ok) {
      const c: BotConfig = await res.json()
      setConfig(c)
      setSharedInput(c.sharedSource ?? '')
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    const res = await fetch('/api/whatsapp/users')
    if (res.ok) setUsers(await res.json())
  }, [])

  const fetchLogs = useCallback(async () => {
    const res = await fetch('/api/whatsapp/logs')
    if (res.ok) {
      const { lines } = await res.json() as { lines: string[] }
      setLogs(lines)
    }
  }, [])

  // Rola o log para o fim sempre que novas linhas chegam
  useEffect(() => {
    const box = logBoxRef.current
    if (box) box.scrollTop = box.scrollHeight
  }, [logs])

  useEffect(() => {
    fetchStatus()
    fetchConfig()
    fetchUsers()
    const statusId = setInterval(fetchStatus, 5000)
    return () => clearInterval(statusId)
  }, [fetchStatus, fetchConfig, fetchUsers])

  // Polling de logs só quando modo SHARED está ativo
  useEffect(() => {
    if (config?.mode !== 'SHARED') return
    fetchLogs()
    const logId = setInterval(fetchLogs, 3000)
    return () => clearInterval(logId)
  }, [config?.mode, fetchLogs])

  function handleConnect() {
    startTransition(async () => {
      await fetch('/api/whatsapp/connect', { method: 'POST' })
      await fetchStatus()
    })
  }

  function handleDisconnect() {
    startTransition(async () => {
      await fetch('/api/whatsapp/disconnect', { method: 'POST' })
      await fetchStatus()
    })
  }

  async function selectMode(mode: 'DEDICATED' | 'SHARED') {
    if (config?.mode === mode) return
    const res = await fetch('/api/whatsapp/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    })
    if (res.ok) setConfig(await res.json())
  }

  async function saveSharedSource() {
    const res = await fetch('/api/whatsapp/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sharedSource: sharedInput.trim() || null }),
    })
    if (res.ok) {
      setConfig(await res.json())
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 2000)
    }
  }

  async function toggleUser(user: User) {
    const res = await fetch('/api/whatsapp/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, allowed: !user.allowed }),
    })
    if (res.ok) {
      const updated: User = await res.json()
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    }
  }

  const s = status?.status ?? 'disconnected'
  const color = STATUS_COLOR[s]
  const isRunning = s === 'connected' || s === 'initializing' || s === 'qr'

  return (
    <>
      <Topbar title={<>WhatsApp · wweb.js <span className="sb-badge">BETA</span></>} />
      <div className="content">
        <div className="split-50">
          {/* Coluna esquerda: status + modo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Card status + controle */}
            <div className="card">
              <div className="card-head"><div className="card-title">Status do Bot</div></div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: color, boxShadow: s === 'connected' ? `0 0 0 3px ${color}33` : 'none' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color }}>{STATUS_LABEL[s]}</span>
                {status?.phone && <span style={{ fontSize: '12px', color: 'var(--text3)', marginLeft: 'auto' }}>+{status.phone}</span>}
              </div>

              <div style={{ display: 'flex', gap: '10px', padding: '14px 0', borderBottom: s === 'qr' && status?.qr ? '1px solid var(--border)' : 'none' }}>
                <button onClick={handleConnect} disabled={isPending || isRunning}
                  style={{ flex: 1, padding: '9px', borderRadius: 'var(--r-sm)', border: 'none', cursor: isRunning ? 'not-allowed' : 'pointer', background: isRunning ? 'var(--border)' : 'var(--indigo)', color: isRunning ? 'var(--text3)' : '#fff', fontWeight: 600, fontSize: '13px' }}>
                  {isPending ? '…' : '▶ Conectar'}
                </button>
                <button onClick={handleDisconnect} disabled={isPending || !isRunning}
                  style={{ flex: 1, padding: '9px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', cursor: !isRunning ? 'not-allowed' : 'pointer', background: 'transparent', color: !isRunning ? 'var(--text3)' : 'var(--text)', fontWeight: 600, fontSize: '13px' }}>
                  ■ Desconectar
                </button>
              </div>

              {s === 'qr' && status?.qr && (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '12px' }}>Abra o WhatsApp → Aparelhos conectados → Conectar aparelho</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={status.qr} alt="QR Code WhatsApp" style={{ width: 200, height: 200, borderRadius: 8, border: '1px solid var(--border)' }} />
                </div>
              )}
            </div>

            {/* Card modo de operação */}
            <div className="card">
              <div className="card-head"><div className="card-title">Modo de operação</div></div>

              {/* Seleção de modo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                {([
                  { value: 'DEDICATED', label: 'Número dedicado', desc: 'Apenas contatos aprovados neste número' },
                  { value: 'SHARED',    label: 'Número compartilhado', desc: 'Mensagens de um grupo específico' },
                ] as const).map((opt) => {
                  const active = config?.mode === opt.value
                  return (
                    <button key={opt.value} onClick={() => selectMode(opt.value)}
                      style={{
                        textAlign: 'left', padding: '10px 12px', borderRadius: 'var(--r-sm)', cursor: 'pointer',
                        border: `1.5px solid ${active ? 'var(--indigo)' : 'var(--border)'}`,
                        background: active ? 'var(--indigo-l)' : 'transparent',
                        transition: 'border-color .15s, background .15s',
                      }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: active ? 'var(--indigo)' : 'var(--text)', marginBottom: 3 }}>{opt.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text2)', lineHeight: 1.4 }}>{opt.desc}</div>
                    </button>
                  )
                })}
              </div>

              {/* Modo compartilhado: input do grupo + log viewer */}
              {config?.mode === 'SHARED' && (
                <div style={{ paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Input do grupo */}
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
                      ID do grupo (ex: <code style={{ fontSize: '11px' }}>120363xxxxxx@g.us</code>)
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        value={sharedInput}
                        onChange={(e) => setSharedInput(e.target.value)}
                        placeholder="120363xxxxxx@g.us"
                        style={{ flex: 1, padding: '7px 10px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '12px', fontFamily: 'monospace' }}
                      />
                      <button onClick={saveSharedSource}
                        style={{ padding: '7px 14px', borderRadius: 'var(--r-sm)', border: 'none', background: savedOk ? '#22c55e' : 'var(--indigo)', color: '#fff', fontWeight: 600, fontSize: '12px', cursor: 'pointer', transition: 'background .2s' }}>
                        {savedOk ? '✓ Salvo' : 'Salvar'}
                      </button>
                    </div>
                  </div>

                  {/* Log viewer */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 600 }}>Log do bot</label>
                      <span style={{ fontSize: '11px', color: 'var(--text3)' }}>atualiza a cada 3s · IDs em verde</span>
                    </div>
                    <div
                      ref={logBoxRef}
                      style={{
                        background: '#0d1117',
                        borderRadius: 'var(--r-sm)',
                        border: '1px solid var(--border)',
                        padding: '10px 12px',
                        height: 200,
                        overflowY: 'auto',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        lineHeight: 1.7,
                      }}
                    >
                      {logs.length === 0 ? (
                        <span style={{ color: '#4b5563' }}>
                          Nenhum log ainda. Inicie o bot e envie uma mensagem no grupo para ver o ID aparecer aqui.
                        </span>
                      ) : (
                        logs.map((line, i) => {
                          const isGroupId = line.includes('@g.us')
                          const isError   = line.toLowerCase().includes('[error]')
                          const color     = isGroupId ? '#22c55e' : isError ? '#f87171' : '#6b7280'
                          return (
                            <div key={i} style={{ color, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                              {line}
                            </div>
                          )
                        })
                      )}
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text3)', marginTop: 6 }}>
                      Envie uma mensagem no grupo → copie o ID em verde → cole no campo acima e salve.
                    </p>
                  </div>
                </div>
              )}

              {/* Modo dedicado: lista de usuários */}
              {config?.mode === 'DEDICATED' && (
                <div style={{ paddingTop: '14px' }}>
                  {users.length === 0 ? (
                    <p style={{ fontSize: '12px', color: 'var(--text3)' }}>Nenhum contato registrado ainda.</p>
                  ) : (
                    users.map((u, i) => (
                      <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{u.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: 1 }}>+{u.phone}</div>
                        </div>
                        <button onClick={() => toggleUser(u)}
                          style={{ position: 'relative', width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', background: u.allowed ? 'var(--indigo)' : 'var(--border)', transition: 'background .2s', flexShrink: 0 }}>
                          <span style={{ position: 'absolute', top: 2, left: u.allowed ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s', display: 'block' }} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Coluna direita: comandos */}
          <div className="card">
            <div className="card-head"><div className="card-title">Comandos</div></div>
            {commands.map((c, i) => (
              <div key={c.cmd} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 0', borderBottom: i < commands.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <code style={{ fontSize: '11.5px', background: 'var(--indigo-l)', color: 'var(--indigo)', padding: '2px 7px', borderRadius: '5px', whiteSpace: 'nowrap', flexShrink: 0 }}>{c.cmd}</code>
                <span style={{ fontSize: '12.5px', color: 'var(--text2)', paddingTop: '2px' }}>{c.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
