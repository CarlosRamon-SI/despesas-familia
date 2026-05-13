import fs from 'fs'
import path from 'path'

export type BotStatus = 'initializing' | 'qr' | 'connected' | 'disconnected'

export type StatusData = {
  status: BotStatus
  qr?: string
  phone?: string
  pid?: number
  updatedAt: string
}

const STATUS_FILE = path.join(process.cwd(), '.wwebjs_status.json')

export function writeStatus(data: Omit<StatusData, 'updatedAt'>): void {
  const payload: StatusData = { ...data, updatedAt: new Date().toISOString() }
  fs.writeFileSync(STATUS_FILE, JSON.stringify(payload), 'utf8')
}

export function readStatus(): StatusData {
  try {
    const raw = fs.readFileSync(STATUS_FILE, 'utf8')
    return JSON.parse(raw) as StatusData
  } catch {
    return { status: 'disconnected', updatedAt: new Date().toISOString() }
  }
}

export function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}
