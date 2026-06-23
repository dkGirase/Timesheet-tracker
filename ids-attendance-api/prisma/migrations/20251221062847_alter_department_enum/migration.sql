/*
  Warnings:

  - The values [RESEARCH,DATA_ANALYSIS] on the enum `Department` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Department_new" AS ENUM ('MARKETING', 'MARKETING_SEO', 'EMAIL_MARKETING', 'MARKET_RESEARCH', 'GRAPHIC_DESIGNER', 'DIGITAL_MARKETING', 'SALES', 'ENGINEERING', 'OTHER');
ALTER TABLE "public"."users_info" ALTER COLUMN "department" DROP DEFAULT;
ALTER TABLE "users_info" ALTER COLUMN "department" TYPE "Department_new" USING ("department"::text::"Department_new");
ALTER TYPE "Department" RENAME TO "Department_old";
ALTER TYPE "Department_new" RENAME TO "Department";
DROP TYPE "public"."Department_old";
ALTER TABLE "users_info" ALTER COLUMN "department" SET DEFAULT 'OTHER';
COMMIT;
