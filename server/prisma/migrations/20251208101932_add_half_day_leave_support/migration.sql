-- AlterTable
ALTER TABLE "leave_requests" ADD COLUMN     "half_day_period" TEXT,
ADD COLUMN     "is_half_day" BOOLEAN NOT NULL DEFAULT false;
