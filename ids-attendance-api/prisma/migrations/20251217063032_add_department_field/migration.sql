-- CreateEnum
CREATE TYPE "Department" AS ENUM ('MARKETING', 'DIGITAL_MARKETING', 'SALES', 'RESEARCH', 'DATA_ANALYSIS', 'ENGINEERING', 'OTHER');

-- AlterTable
ALTER TABLE "users_info" ADD COLUMN     "department" "Department" DEFAULT 'OTHER';
