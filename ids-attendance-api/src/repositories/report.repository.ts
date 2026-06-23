import { prisma } from "../lib/prisma.js";
import { startOfUTCMonth, endOfUTCMonth } from "../utils/date.js";

const STATUS_MAP: Record<string, string> = {
  PRESENT: "P",
  ABSENT: "A",
  LEAVE_FULL_DAY: "L",
  LEAVE_HALF_DAY: "1/2",
  HOLIDAY: "H",
  WORK_FROM_HOME: "WFH",
  COMP_OFF: "CO",
};

export class ReportRepository {
  async fetchMonthlyData(month: number, year: number) {
    const start = startOfUTCMonth(year, month);
    const end = endOfUTCMonth(year, month);
    const daysInMonth = end.getUTCDate();

    const users = await prisma.user.findMany({
      where: { isActive: true },
      include: {
        userInfo: true,
        attendances: {
          where: { date: { gte: start, lte: end } },
        },
        monthlyBalances: {
          where: { month, year },
          take: 1,
        },
      },
    });

    const teamWeekends = await prisma.teamWeekend.findMany({
      where: {
        endDate: null, // ✅ ONLY latest active weekends
      },
      include: {
        team: {
          include: {
            teamMembers: true,
          },
        },
      },
    });

    const holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      select: {
        date: true,
      },
    });

    const holidaySet = new Set(
      holidays.map((h) => h.date.toISOString().slice(0, 10)),
    );

    // STEP 2 – Build user → weekly off map
    const userWeeklyOffMap = new Map<number, Set<number>>();

    for (const tw of teamWeekends) {
      const weekdayIndex = {
        MONDAY: 1,
        TUESDAY: 2,
        WEDNESDAY: 3,
        THURSDAY: 4,
        FRIDAY: 5,
        SATURDAY: 6,
        SUNDAY: 0,
      }[tw.day];

      for (const tm of tw.team.teamMembers) {
        if (!userWeeklyOffMap.has(tm.userId)) {
          userWeeklyOffMap.set(tm.userId, new Set());
        }
        userWeeklyOffMap.get(tm.userId)!.add(weekdayIndex);
      }
    }

    return {
      daysInMonth,
      holidaySet,
      users: users.map((u) => {
        const attendance: Record<number, string> = {};

        // existing logic — DO NOT CHANGE
        for (const a of u.attendances) {
          const day = a.date.getUTCDate();
          attendance[day] = STATUS_MAP[a.status] ?? "";
        }

        // STEP 3 – Fill Weekly Off (WO)
        const weeklyOffDays = userWeeklyOffMap.get(u.id) ?? new Set();

        for (let d = 1; d <= daysInMonth; d++) {
          if (attendance[d]) continue;

          const date = new Date(Date.UTC(year, month - 1, d));
          const weekday = date.getUTCDay(); // 0–6
          const dateKey = date.toISOString().slice(0, 10);

          if (holidaySet.has(dateKey)) continue;

          if (weeklyOffDays.has(weekday)) {
            attendance[d] = "WO";
          }
        }

        return {
          fullName: [
            u.userInfo?.firstName,
            u.userInfo?.middleName,
            u.userInfo?.lastName,
          ]
            .filter(Boolean)
            .join(" "),
          attendance,
          balance: u.monthlyBalances[0] ?? null,
          joiningDate: u.userInfo?.dateOfJoining ?? null,
          deactivatedAt: u.deactivatedAt ?? null,
        };
      }),
    };
  }

  async fetchMonthlyOvertime(month: number, year: number) {
    const start = startOfUTCMonth(year, month);
    const end = endOfUTCMonth(year, month);

    const overtimeRequests = await prisma.overtimeRequest.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
        status: "APPROVED", // optional, remove if you want all
      },
      include: {
        user: {
          include: {
            userInfo: true,
            teamMembers: {
              include: {
                team: true,
              },
            },
          },
        },
        approvals: {
          include: {
            approver: {
              include: {
                userInfo: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    return overtimeRequests.map((ot) => {
      const approver = ot.approvals[0]?.approver?.userInfo;

      // ===== DATE FORMAT: DD/MM/YY =====
      const formattedDate = new Date(ot.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });

      // ===== TIME FORMAT: 12-HOUR =====
      const formatTime12Hr = (date: Date) =>
        date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

      return {
        date: formattedDate,
        name: [ot.user.userInfo?.firstName, ot.user.userInfo?.lastName]
          .filter(Boolean)
          .join(" "),
        team: ot.user.teamMembers[0]?.team?.name ?? "-",
        time: `${formatTime12Hr(ot.startTime)} - ${formatTime12Hr(ot.endTime)}`,
        duration: ot.totalHours,
        reason: ot.reason,
        approvedBy: approver
          ? `${approver.firstName} ${approver.lastName}`
          : "-",
      };
    });
  }
}
