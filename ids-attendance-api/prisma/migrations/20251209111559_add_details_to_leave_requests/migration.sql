/*
  Warnings:

  - You are about to drop the column `half_day_period` on the `leave_requests` table. All the data in the column will be lost.
  - You are about to drop the column `is_half_day` on the `leave_requests` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "leave_requests" DROP COLUMN "half_day_period",
DROP COLUMN "is_half_day",
ADD COLUMN     "details" JSONB NOT NULL DEFAULT '[]';
