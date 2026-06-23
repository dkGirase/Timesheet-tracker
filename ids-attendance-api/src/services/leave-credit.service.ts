import { prisma } from "../lib/prisma.js";

export class LeaveCreditService {
  async processMonthlyLeaveCredit(month: number, year: number) {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { not: "INTERN" },
      },
      include: {
        userInfo: true,
      },
    });

    for (const user of users) {
      if (!user.userInfo?.dateOfJoining) continue;

      // ✅ 1. Check 3 months eligibility
      const doj = user.userInfo.dateOfJoining;
      const eligibilityDate = new Date(doj);
      eligibilityDate.setMonth(eligibilityDate.getMonth() + 3);

      const creditDate = new Date(year, month - 1, 1);
      if (creditDate < eligibilityDate) continue;

      await prisma.$transaction(async (tx) => {
        // ✅ 2. If current month already exists → DO NOTHING
        const alreadyCredited = await tx.leaveBalanceMonth.findUnique({
          where: {
            userId_month_year: {
              userId: user.id,
              month,
              year,
            },
          },
        });

        if (alreadyCredited) return;

        // ✅ 3. Get last month balance
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;

        const previous = await tx.leaveBalanceMonth.findUnique({
          where: {
            userId_month_year: {
              userId: user.id,
              month: prevMonth,
              year: prevYear,
            },
          },
        });

        const initialBalance = previous?.finalBalance ?? 0;
        const earned = 1.75;
        const finalBalance = initialBalance + earned;

        // ✅ 4. Create current month record
        await tx.leaveBalanceMonth.create({
          data: {
            userId: user.id,
            month,
            year,
            initialBalance,
            earnedBalance: earned,
            used: 0,
            finalBalance,
          },
        });

        // ✅ 5. Prepare next month opening balance (if exists)
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;

        const nextMonthRecord = await tx.leaveBalanceMonth.findUnique({
          where: {
            userId_month_year: {
              userId: user.id,
              month: nextMonth,
              year: nextYear,
            },
          },
        });

        if (nextMonthRecord) {
          await tx.leaveBalanceMonth.update({
            where: { id: nextMonthRecord.id },
            data: {
              initialBalance: finalBalance,
            },
          });
        }
      });
    }
  }
}
