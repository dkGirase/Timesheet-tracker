import {
  AttendanceStatus,
  HalfDayPeriod,
  Role,
  TimeLogType,
  WeekDay,
} from "../../prisma/generated/enums.js";
import { prisma } from "../lib/prisma.js";
import { endOfUTCMonth, startOfUTCMonth, toUTCDate } from "../utils/date.js";
import { isRoleAdminOrManager } from "../utils/user.js";
import { OvertimeStatus } from "../../prisma/generated/enums.js";
const DAY_NUMBER_TO_WEEKDAY: Record<number, WeekDay> = {
  0: WeekDay.SUNDAY,
  1: WeekDay.MONDAY,
  2: WeekDay.TUESDAY,
  3: WeekDay.WEDNESDAY,
  4: WeekDay.THURSDAY,
  5: WeekDay.FRIDAY,
  6: WeekDay.SATURDAY,
};

type TimeLog = {
  createdAt: Date;
  id: number;
  userId: number;
  timestamp: Date;
  type: TimeLogType;
};

export class AttendanceRepository {
  async createFullDayLeave(userId: number, date: Date, leaveRequestId: number) {
    const dateUTC = toUTCDate(date);
    return prisma.attendance.create({
      data: {
        userId,
        date: dateUTC,
        status: AttendanceStatus.LEAVE_FULL_DAY,
        leaveRequestId,
      },
    });
  }

  async createHalfDayAttendance(
    userId: number,
    date: Date,
    leaveRequestId: number,
    halfDayPeriod: HalfDayPeriod,
  ) {
    const dateUTC = toUTCDate(date);
    return prisma.attendance.create({
      data: {
        userId,
        date: dateUTC,
        status: AttendanceStatus.LEAVE_HALF_DAY,
        leaveRequestId,
        halfDayPeriod,
      },
    });
  }

  async exists(userId: number, date: Date) {
    const dateUTC = toUTCDate(date);
    return prisma.attendance.findFirst({
      where: { userId, date: dateUTC },
    });
  }

  async startWorking(
    userId: number,
    context?: {
      isOnLeave: boolean;
      isHalfDay: boolean;
      isHoliday: boolean;
      isWeekend: boolean;
    },
  ) {
    const now = new Date();
    const dateOnly = toUTCDate(now);

    await prisma.timeLog.create({
      data: {
        userId,
        timestamp: now,
        type: TimeLogType.LOGIN,
      },
    });

    await prisma.attendance.upsert({
      where: { userId_date: { userId, date: dateOnly } },
      update: { status: AttendanceStatus.PRESENT },
      create: {
        userId,
        date: dateOnly,
        status: AttendanceStatus.PRESENT,
      },
    });

    return { context };
  }

  async stopWorking(userId: number) {
    const now = new Date(); // UTC timestamp internally

    const timeLog = await prisma.timeLog.create({
      data: {
        userId,
        timestamp: now,
        type: TimeLogType.LOGOUT,
      },
    });

    return { timeLog };
  }

  async getLastTimeLog(userId: number, date: Date) {
    const startOfDay = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );

    const endOfDay = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    return prisma.timeLog.findFirst({
      where: {
        userId,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    });
  }

  async getLastTimeLogsForUsers(userIds: number[], date: Date) {
    const startOfDay = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
    const endOfDay = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    const logs = await prisma.timeLog.findMany({
      where: {
        userId: { in: userIds },
        timestamp: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { timestamp: "desc" },
    });

    // Return only the latest log per user
    const latestLogsMap = new Map<number, (typeof logs)[0]>();
    for (const log of logs) {
      if (!latestLogsMap.has(log.userId)) {
        latestLogsMap.set(log.userId, log);
      }
    }

    return latestLogsMap; // Map<userId, log>
  }

  /**
   * Overrides attendance for a user.
   * Updates both manualAttendanceAction and attendance table.
   */
  async overrideAttendance(data: {
    userId: number;
    date: Date;
    status: AttendanceStatus;
    markedById: number;
    halfDayPeriod?: HalfDayPeriod;
    remarks?: string;
  }) {
    const { userId, date, status, markedById, halfDayPeriod, remarks } = data;
    const dateUTC = toUTCDate(date);

    // 1️⃣ Upsert attendance table
    await prisma.attendance.upsert({
      where: { userId_date: { userId, date: dateUTC } },
      update: {
        status,
        ...(status === AttendanceStatus.LEAVE_HALF_DAY
          ? { halfDayPeriod }
          : { halfDayPeriod: null }),
      },
      create: {
        userId,
        date: dateUTC,
        status,
        ...(status === AttendanceStatus.LEAVE_HALF_DAY
          ? { halfDayPeriod }
          : {}),
      },
    });

    // 2️⃣ Record in manualAttendanceAction for tracking
    return prisma.manualAttendanceAction.create({
      data: {
        userId,
        date: dateUTC,
        status,
        markedById,
        remarks,
      },
    });
  }

  async getUserTeamWeekends(
    userId: number,
    startDate: Date,
    endDate: Date,
    teamId?: number,
  ) {
    return prisma.teamWeekend.findMany({
      where: {
        teamId: teamId,
        team: {
          teamMembers: {
            some: {
              userId,
            },
          },
        },
        startDate: {
          lte: endDate,
        },
        OR: [
          { endDate: null },
          {
            endDate: {
              gte: startDate,
            },
          },
        ],
      },
      select: {
        day: true,
        startDate: true,
        endDate: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        day: "asc",
      },
    });
  }

  async getMonthlyAttendance(
    userIdToFetch: number,
    month: number,
    year: number,
    requesterRole: Role,
    requesterId: number,
  ) {
    const startDate = startOfUTCMonth(year, month);
    const endDate = endOfUTCMonth(year, month);

    // Fetch attendances for the month
    const attendances = await prisma.attendance.findMany({
      where: {
        userId: userIdToFetch,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    const manualAttendances = await prisma.manualAttendanceAction.findMany({
      where: {
        userId: userIdToFetch,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        markedBy: {
          include: {
            userInfo: true,
          },
        },
      },
    });

    const manualByDate: Record<string, typeof manualAttendances> = {};

    for (const ma of manualAttendances) {
      const key = ma.date.toISOString().slice(0, 10);
      if (!manualByDate[key]) manualByDate[key] = [];
      manualByDate[key].push(ma);
    }

    // Fetch time logs only for Managers and Admins
    let timeLogs: TimeLog[] = [];
    const areLogsAccessible =
      requesterId === userIdToFetch || isRoleAdminOrManager(requesterRole);

    if (areLogsAccessible) {
      timeLogs = await prisma.timeLog.findMany({
        where: {
          userId: userIdToFetch,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { timestamp: "asc" },
      });
    }

    // Organize logs by date for easy lookup
    const logsByDate: Record<string, TimeLog[]> = {};
    for (const log of timeLogs) {
      const key = log.timestamp.toISOString().slice(0, 10);
      if (!logsByDate[key]) logsByDate[key] = [];
      logsByDate[key].push(log);
    }

    return {
      month,
      year,
      days: attendances.map((att) => ({
        date: att.date,
        status: att.status, // This can be accessed by all users
        halfDayPeriod: att.halfDayPeriod, // This can be accessed by all users
        logs: areLogsAccessible
          ? (logsByDate[att.date.toISOString().slice(0, 10)] ?? []) // Only return logs for Self, Admins/Managers
          : [], // For regular users, no time logs
        manualAttendance:
          manualByDate[att.date.toISOString().slice(0, 10)]?.map((ma) => ({
            id: ma.id,
            status: ma.status,
            remarks: ma.remarks,
            createdAt: ma.createdAt,
            markedBy: ma.markedBy?.userInfo
              ? {
                  firstName: ma.markedBy.userInfo.firstName,
                  lastName: ma.markedBy.userInfo.lastName,
                }
              : null,
          })) ?? [],
      })),
    };
  }

  async getMonthlyHolidays(startDate: Date, endDate: Date) {
    return prisma.holiday.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        name: true,
        date: true,
        description: true,
      },
      orderBy: {
        date: "asc",
      },
    });
  }

  async getMonthlyOvertimeRequests(
    userId: number,
    startDate: Date,
    endDate: Date,
  ) {
    return prisma.overtimeRequest.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        totalHours: true,
        status: true,
        reason: true,
        createdAt: true,

        // ✅ ADD THIS (NON-BREAKING)
        approvals: {
          orderBy: { createdAt: "desc" },
          take: 1, // latest approval only
          select: {
            action: true,
            approver: {
              select: {
                userInfo: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });
  }

  async getTodayLeave(userId: number, date: Date) {
    return prisma.leaveRequest.findFirst({
      where: {
        userId,
        status: { in: ["APPROVED", "PENDING"] },
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });
  }

  async getHolidayByDate(date: Date) {
    return prisma.holiday.findUnique({
      where: { date },
    });
  }

  async isTeamWeekend(userId: number, date: Date) {
    const weekDay = DAY_NUMBER_TO_WEEKDAY[date.getUTCDay()];

    const team = await prisma.teamMember.findFirst({
      where: { userId },
      include: {
        team: { include: { teamWeekends: true } },
      },
    });

    if (!team) return false;

    return team.team.teamWeekends.some((w) => {
      const start = new Date(w.startDate);
      const end = w.endDate ? new Date(w.endDate) : null;

      return w.day === weekDay && date >= start && (!end || date <= end);
    });
  }

  async findManualOverrideByDate(userId: number, date: Date) {
    return prisma.manualAttendanceAction.findFirst({
      where: {
        userId,
        date,
      },
      include: {
        markedBy: true, // needed to check role
      },
      orderBy: {
        createdAt: "desc", // latest override wins
      },
    });
  }

  async getLastManualOverride(userId: number, date: Date) {
  return prisma.manualAttendanceAction.findFirst({
    where: {
      userId,
      date,
    },
    include: {
      markedBy: {
        select: { role: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

}