"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { nextMonthDate } from "@/lib/recurrence-utils";
import { TransactionType } from "@prisma/client";

export async function createTransaction(formData: FormData) {
  const description = formData.get("description") as string;
  const amount = parseFloat((formData.get("amount") as string).replace(",", "."));
  const categoryId = formData.get("categoryId") as string;
  const userName = formData.get("userName") as string;
  const type = formData.get("type") as TransactionType;
  const dateRaw = formData.get("date") as string;
  const date = dateRaw ? new Date(dateRaw) : new Date();
  const recorrente = formData.get("recorrente") === "on";

  const user = await prisma.user.upsert({
    where: { phone: userName },
    update: {},
    create: { name: userName, phone: userName },
  });

  await prisma.transaction.create({
    data: { description, amount, categoryId, userId: user.id, type, date, recorrente },
  });

  if (recorrente) {
    await prisma.transaction.create({
      data: {
        description,
        amount,
        categoryId,
        userId: user.id,
        type,
        date: nextMonthDate(date),
        recorrente: true,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/lancamentos");
  revalidatePath("/recorrencias");
}

export async function deleteTransaction(id: string) {
  await prisma.transaction.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/lancamentos");
  revalidatePath("/recorrencias");
}

export async function createCategory(formData: FormData) {
  const name  = (formData.get("catName")  as string).trim();
  const emoji = (formData.get("catEmoji") as string).trim() || "•";
  if (!name) return null;

  const category = await prisma.category.upsert({
    where: { name },
    update: {},
    create: { name, emoji, keywords: [] },
  });

  revalidatePath("/");
  revalidatePath("/lancamentos");
  return { id: category.id, name: category.name, emoji: category.emoji };
}
