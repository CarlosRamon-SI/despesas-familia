"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";

export async function createTransaction(formData: FormData) {
  const description = formData.get("description") as string;
  const amount = parseFloat((formData.get("amount") as string).replace(",", "."));
  const categoryId = formData.get("categoryId") as string;
  const userName = formData.get("userName") as string;
  const type = formData.get("type") as TransactionType;
  const dateRaw = formData.get("date") as string;
  const date = dateRaw ? new Date(dateRaw) : new Date();

  const user = await prisma.user.upsert({
    where: { phone: userName },
    update: {},
    create: { name: userName, phone: userName },
  });

  await prisma.transaction.create({
    data: { description, amount, categoryId, userId: user.id, type, date },
  });

  revalidatePath("/");
  revalidatePath("/lancamentos");
}

export async function deleteTransaction(id: string) {
  await prisma.transaction.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/lancamentos");
}

export async function createRecurrence(formData: FormData) {
  const description = formData.get("description") as string;
  const amount = parseFloat((formData.get("amount") as string).replace(",", "."));
  const categoryId = formData.get("categoryId") as string;
  const userName = formData.get("userName") as string;
  const type = formData.get("type") as TransactionType;
  const dayOfMonth = parseInt(formData.get("dayOfMonth") as string, 10);

  const user = await prisma.user.upsert({
    where: { phone: userName },
    update: {},
    create: { name: userName, phone: userName },
  });

  await prisma.recurrence.create({
    data: {
      description,
      amount,
      categoryId,
      userId: user.id,
      type,
      dayOfMonth: Math.min(Math.max(dayOfMonth, 1), 31),
      active: true,
    },
  });

  revalidatePath("/recorrencias");
}

export async function deleteRecurrence(id: string) {
  await prisma.recurrence.delete({ where: { id } });
  revalidatePath("/recorrencias");
}

export async function toggleRecurrence(id: string, active: boolean) {
  await prisma.recurrence.update({ where: { id }, data: { active } });
  revalidatePath("/recorrencias");
}

export async function generateThisMonth(): Promise<number> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const daysInMonth = end.getDate();

  const recurrences = await prisma.recurrence.findMany({
    where: { active: true },
  });

  let generated = 0;

  for (const rec of recurrences) {
    const existing = await prisma.transaction.findFirst({
      where: {
        description: rec.description,
        userId: rec.userId,
        categoryId: rec.categoryId,
        type: rec.type,
        date: { gte: start, lte: end },
      },
    });

    if (existing) continue;

    const day = Math.min(rec.dayOfMonth, daysInMonth);
    const date = new Date(now.getFullYear(), now.getMonth(), day);

    await prisma.transaction.create({
      data: {
        description: rec.description,
        amount: rec.amount,
        categoryId: rec.categoryId,
        userId: rec.userId,
        type: rec.type,
        date,
      },
    });
    generated++;
  }

  revalidatePath("/");
  revalidatePath("/lancamentos");
  revalidatePath("/recorrencias");
  return generated;
}
