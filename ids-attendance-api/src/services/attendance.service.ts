import { AttendanceRepository } from "../repositories/attendance.repository.js";
import { ManualAttendanceDTO } from "../dto/attendance/manualAttendance.dto.js";
import {
  AttendanceStatus,
  Role,
  TimeLogType,
} from "../../prisma/generated/enums.js";
import { startOfUTCMonth, endOfUTCMonth, toUTCDate } from "../utils/date.js";

export type WorkingStatus = "NOT_STARTED" | "WORKING" | "STOPPED";
type LeaveDetail = {
  date: string;
  isHalfDay: boolean;
  halfDayPeriod?: string;
};

export interface WorkingStatusResult {
  status: WorkingStatus;
  lastLog: {
    timestamp: Date;
    type: TimeLogType;
  } | null;
}

export class AttendanceService {
  private repo: AttendanceRepository;

  constructor() {
    this.repo = new AttendanceRepository();
  }

  async overrideAttendance(
    adminId: number,
    dto: ManualAttendanceDTO,
    currentUserRole: Role,
  ) {
    const date = new Date(dto.date);

    // 🔍 Fetch last manual override (if any)
    const lastOverride = await this.repo.getLastManualOverride(
      dto.userId,
      toUTCDate(date),
    );

    // 🛑 RULE ENFORCEMENT
    if (
      lastOverride &&
      lastOverride.markedBy.role === "ADMIN" &&
      currentUserRole === "MANAGER"
    ) {
      throw new Error(
        "This attendance was already overridden by an Admin. Manager cannot override it.",
      );
    }

    // Existing validation (unchanged)
    if (dto.status === AttendanceStatus.LEAVE_HALF_DAY && !dto.halfDayPeriod) {
      throw new Error("halfDayPeriod is required for half-day leave.");
    }

    // Continue existing flow
    return this.repo.overrideAttendance({
      userId: dto.userId,
      date,
      status: dto.status,
      markedById: adminId,
      halfDayPeriod: dto.halfDayPeriod,
      remarks: dto.remarks,
    });
  }

  async getWorkingStatus(userId: number): Promise<WorkingStatusResult> {
    const today = new Date();

    const lastLog = await this.repo.getLastTimeLog(userId, today);

    if (!lastLog) {
      return {
        status: "NOT_STARTED",
        lastLog: null,
      };
    }

    if (lastLog.type === "LOGIN" || lastLog.type === "AUTO") {
      return {
        status: "WORKING",
        lastLog: {
          timestamp: lastLog.timestamp,
          type: lastLog.type,
        },
      };
    }

    if (lastLog.type === "LOGOUT") {
      return {
        status: "STOPPED",
        lastLog: {
          timestamp: lastLog.timestamp,
          type: lastLog.type,
        },
      };
    }

    return {
      status: "NOT_STARTED",
      lastLog: {
        timestamp: lastLog.timestamp,
        type: lastLog.type,
      },
    };
  }

  async getWorkingStatuses(userIds: number[]) {
    const today = new Date();

    const latestLogsMap = await this.repo.getLastTimeLogsForUsers(
      userIds,
      today,
    );

    return userIds.map((userId) => {
      const lastLog = latestLogsMap.get(userId);

      if (!lastLog) {
        return { userId, status: "NOT_STARTED", lastLog: null };
      }

      let status: "WORKING" | "STOPPED" | "NOT_STARTED" = "NOT_STARTED";
      if (lastLog.type === "LOGIN" || lastLog.type === "AUTO")
        status = "WORKING";
      else if (lastLog.type === "LOGOUT") status = "STOPPED";

      return {
        userId,
        status,
        lastLog: {
          timestamp: lastLog.timestamp,
          type: lastLog.type,
        },
      };
    });
  }

  async startWorking(userId: number) {
    const context = await this.getTodayWorkContext(userId);

    return this.repo.startWorking(userId, {
      isOnLeave: context.isOnLeave,
      isHalfDay: context.isHalfDay,
      isHoliday: context.isHoliday,
      isWeekend: context.isWeekend,
    });
  }

  async stopWorking(userId: number) {
    return this.repo.stopWorking(userId);
  }

  async getMonthlyAttendance(
    userIdToFetch: number,
    month: number,
    year: number,
    requesterRole: Role,
    requesterId: number,
    teamId?: number,
  ) {
    const startDate = startOfUTCMonth(year, month);
    const endDate = endOfUTCMonth(year, month);

    const attendanceData = await this.repo.getMonthlyAttendance(
      userIdToFetch,
      month,
      year,
      requesterRole,
      requesterId,
    );

    const teamWeekends = await this.repo.getUserTeamWeekends(
      userIdToFetch,
      startDate,
      endDate,
      teamId,
    );

    const holidays = await this.repo.getMonthlyHolidays(startDate, endDate);

    const overtimeRequests = await this.repo.getMonthlyOvertimeRequests(
      userIdToFetch,
      startDate,
      endDate,
    );

    return {
      ...attendanceData,
      teamWeekends: teamWeekends.map((tw) => ({
        teamId: tw.team.id,
        teamName: tw.team.name,
        day: tw.day, // MONDAY, SATURDAY, etc
        startDate: tw.startDate,
        endDate: tw.endDate,
      })),
      holidays,
      overtimeRequests: overtimeRequests.map((ot) => ({
        id: ot.id,
        date: ot.date,
        startTime: ot.startTime,
        endTime: ot.endTime,
        totalHours: ot.totalHours,
        status: ot.status,
        reason: ot.reason,
        createdAt: ot.createdAt,

        // ✅ NEW (OPTIONAL FIELD)
        approvedBy: ot.approvals?.[0]?.approver?.userInfo
          ? {
              firstName: ot.approvals[0].approver.userInfo.firstName,
              lastName: ot.approvals[0].approver.userInfo.lastName,
              action: ot.approvals[0].action,
            }
          : null,
      })),
    };
  }

  private async getTodayLeaveInfo(userId: number) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const leave = await this.repo.getTodayLeave(userId, today);

    // ⛔ Ignore non-approved leaves
    if (!leave || leave.status !== "APPROVED") return null;

    const halfDay = (leave.details as any[])?.find(
      (d) =>
        new Date(d.date).toISOString().slice(0, 10) ===
          today.toISOString().slice(0, 10) && d.isHalfDay,
    );

    return {
      isOnLeave: true,
      isHalfDay: !!halfDay,
      halfDayPeriod: halfDay?.halfDayPeriod ?? null,
    };
  }

  private async getTodayWorkContext(userId: number) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // ---- Leave ----
    const leave = await this.repo.getTodayLeave(userId, today);

    let isOnLeave = false;
    let isHalfDay = false;

    if (leave?.status === "APPROVED") {
      const halfDay = (leave.details as any[])?.find(
        (d) =>
          new Date(d.date).toISOString().slice(0, 10) ===
            today.toISOString().slice(0, 10) && d.isHalfDay,
      );

      isOnLeave = true;
      isHalfDay = !!halfDay;
    }

    // ---- Holiday ----
    const holiday = await this.repo.getHolidayByDate(today);

    // ---- Team Weekend ----
    const weekend = await this.repo.isTeamWeekend(userId, today);

    return {
      isOnLeave,
      isHalfDay,
      isHoliday: !!holiday,
      isWeekend: !!weekend,
    };
  }
}
