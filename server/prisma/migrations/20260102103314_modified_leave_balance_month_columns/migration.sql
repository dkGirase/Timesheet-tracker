/*
  Warnings:

  - You are about to drop the column `company_holidays` on the `leave_balances_month` table. All the data in the column will be lost.
  - You are about to drop the column `earned` on the `leave_balances_month` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "leave_balances_month" DROP COLUMN "company_holidays",
DROP COLUMN "earned",
ADD COLUMN     "earned_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "full_day_leaves" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "initial_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "work_from_home" DOUBLE PRECISION NOT NULL DEFAULT 0;
