/*
  Warnings:

  - The `half_day_period` column on the `attendance` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `half_day_period` column on the `leave_requests` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "HalfDayPeriod" AS ENUM ('FIRST_HALF', 'SECOND_HALF');

-- AlterTable
ALTER TABLE "attendance" DROP COLUMN "half_day_period",
ADD COLUMN     "half_day_period" "HalfDayPeriod";

-- AlterTable
ALTER TABLE "leave_requests" DROP COLUMN "half_day_period",
ADD COLUMN     "half_day_period" "HalfDayPeriod";
