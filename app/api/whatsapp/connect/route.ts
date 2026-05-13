import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { readStatus, isProcessRunning, writeStatus } from '@/lib/whatsapp/status'

export async function POST() {
  const current = readStatus()

  if (
    current.pid &&
    isProcessRunning(current.pid) &&
    current.status !== 'disconnected'
  ) {
    return NextResponse.json({ ok: false, message: 'Bot já está rodando.' }, { status: 409 })
  }

  const logFile = path.join(process.cwd(), '.wwebjs_bot.log')
  const out = fs.openSync(logFile, 'w')

  const tsx = path.join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs')
  const script = path.join(process.cwd(), 'scripts', 'whatsapp.ts')

  const child = spawn(process.execPath, [tsx, script], {
    windowsHide: true,
    stdio: ['ignore', out, out],
    cwd: process.cwd(),
    env: process.env,
  })

  writeStatus({ status: 'initializing', pid: child.pid })

  return NextResponse.json({ ok: true, pid: child.pid })
}
