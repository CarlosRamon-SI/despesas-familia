import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const LOG_FILE = path.join(process.cwd(), '.wwebjs_bot.log')
const MAX_LINES = 80

// Filtra linhas do QR code ASCII que não têm utilidade no viewer
const isQRLine = (l: string) => /[█▄▀▐▌]{3,}/.test(l)

export function GET() {
  try {
    const content = fs.readFileSync(LOG_FILE, 'utf8')
    const lines = content
      .split('\n')
      .filter(l => l.trim() && !isQRLine(l))
      .slice(-MAX_LINES)
    return NextResponse.json({ lines })
  } catch {
    return NextResponse.json({ lines: [] })
  }
}
