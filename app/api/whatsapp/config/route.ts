import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const config = await prisma.botConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  })
  return NextResponse.json(config)
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { mode?: string; sharedSource?: string | null }

  const config = await prisma.botConfig.upsert({
    where: { id: 'default' },
    update: {
      ...(body.mode ? { mode: body.mode as 'DEDICATED' | 'SHARED' } : {}),
      ...('sharedSource' in body ? { sharedSource: body.sharedSource ?? null } : {}),
    },
    create: { id: 'default' },
  })

  return NextResponse.json(config)
}
