/*
  Warnings:

  - You are about to drop the column `recurrenceId` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the `recurrences` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "recurrences" DROP CONSTRAINT "recurrences_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "recurrences" DROP CONSTRAINT "recurrences_userId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_recurrenceId_fkey";

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "recurrenceId",
ADD COLUMN     "recorrente" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "recurrences";
