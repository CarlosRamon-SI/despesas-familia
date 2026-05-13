import { NextResponse } from 'next/server'
import { readStatus, writeStatus, isProcessRunning } from '@/lib/whatsapp/status'

export async function POST() {
  const current = readStatus()

  if (!current.pid || !isProcessRunning(current.pid)) {
    writeStatus({ status: 'disconnected' })
    return NextResponse.json({ ok: true, message: 'Nenhum processo ativo.' })
  }

  try {
    process.kill(current.pid, 'SIGTERM')
    writeStatus({ status: 'disconnected' })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, message: 'Não foi possível encerrar o processo.' }, { status: 500 })
  }
}
