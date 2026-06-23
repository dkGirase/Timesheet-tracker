-- CreateEnum
CREATE TYPE "WeekDay" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "team_weekends" (
    "id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "day" "WeekDay" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),

    CONSTRAINT "team_weekends_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_team_weekend_lookup" ON "team_weekends"("team_id", "day", "start_date", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "uq_team_weekend_start" ON "team_weekends"("team_id", "day", "start_date");

-- AddForeignKey
ALTER TABLE "team_weekends" ADD CONSTRAINT "team_weekends_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
