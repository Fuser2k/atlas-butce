-- CreateEnum
CREATE TYPE "RecurrenceInterval" AS ENUM ('WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "nextOccurrenceDate" TIMESTAMP(3),
ADD COLUMN     "recurrenceInterval" "RecurrenceInterval",
ADD COLUMN     "recurrenceParentId" TEXT;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recurrenceParentId_fkey" FOREIGN KEY ("recurrenceParentId") REFERENCES "transactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
