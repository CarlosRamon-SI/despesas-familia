import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const users = await prisma.user.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(users)
}

export async function PATCH(req: NextRequest) {
  const { id, allowed } = await req.json() as { id: string; allowed: boolean }
  const user = await prisma.user.update({ where: { id }, data: { allowed } })
  return NextResponse.json(user)
}
