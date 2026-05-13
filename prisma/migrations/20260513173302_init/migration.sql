-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "recurrenceId" TEXT;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recurrenceId_fkey" FOREIGN KEY ("recurrenceId") REFERENCES "recurrences"("id") ON DELETE SET NULL ON UPDATE CASCADE;
