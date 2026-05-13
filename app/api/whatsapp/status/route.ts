import { NextResponse } from 'next/server'
import { readStatus } from '@/lib/whatsapp/status'

export const dynamic = 'force-dynamic'

export function GET() {
  const status = readStatus()
  return NextResponse.json(status)
}
