import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nextMonthDate } from "@/lib/recurrence-utils";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const nextStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextEnd   = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);

  const thisMonthRecorrentes = await prisma.transaction.findMany({
    where: { recorrente: true, date: { gte: monthStart, lte: monthEnd } },
  });

  let created = 0;

  for (const tx of thisMonthRecorrentes) {
    const existing = await prisma.transaction.findFirst({
      where: {
        recorrente:  true,
        userId:      tx.userId,
        categoryId:  tx.categoryId,
        type:        tx.type,
        description: tx.description,
        date:        { gte: nextStart, lte: nextEnd },
      },
    });

    if (existing) continue;

    await prisma.transaction.create({
      data: {
        description: tx.description,
        amount:      tx.amount,
        categoryId:  tx.categoryId,
        userId:      tx.userId,
        type:        tx.type,
        date:        nextMonthDate(tx.date),
        recorrente:  true,
      },
    });
    created++;
  }

  return NextResponse.json({ created });
}
