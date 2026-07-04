-- DropIndex
DROP INDEX "Subscription_confirmedAt_unsubscribedAt_lastSentAt_idx";

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "bouncedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Subscription_confirmedAt_unsubscribedAt_bouncedAt_lastSentA_idx" ON "Subscription"("confirmedAt", "unsubscribedAt", "bouncedAt", "lastSentAt");
