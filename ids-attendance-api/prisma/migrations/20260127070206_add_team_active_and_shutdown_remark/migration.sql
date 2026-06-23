-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "shutdown_remark" TEXT;
