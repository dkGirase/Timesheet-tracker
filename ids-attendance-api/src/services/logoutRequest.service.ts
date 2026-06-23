// services/logoutRequest.service.ts
import { LogoutRequestRepository } from "../repositories/logoutRequest.repository.js";
import { subDays, format, startOfDay, endOfDay, isToday } from "date-fns";
import {
  LogoutRequestStatus,
  TimeLogType,
} from "../../prisma/generated/enums.js";
import { CreateLogoutRequestDTO } from "../dto/logout/createLogoutRequest.dto.js";

export class LogoutRequestService {
  private repo = new LogoutRequestRepository();

  private convert12hToDate(date: Date, time: string) {
    let [hm, modifier] = time.split(" "); // "12:15", "AM"
    let [hours, minutes] = hm.split(":").map(Number);

    if (modifier?.toUpperCase() === "PM" && hours < 12) hours += 12;
    if (modifier?.toUpperCase() === "AM" && hours === 12) hours = 0;

    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  }

  async findMissingLogoutDays(userId: number) {
    const today = new Date();

    // ❌ exclude today
    const endDate = endOfDay(subDays(today, 1)); // yesterday 23:59:59
    const startDate = startOfDay(subDays(today, 14)); // 14 days back

    const timeLogs = await this.repo.getTimeLogs(userId, startDate, endDate);

    const logoutRequests = await this.repo.getLogoutRequests(userId, startDate);

    const logsByDate = new Map<string, TimeLogType[]>();

    for (const log of timeLogs) {
      const dateKey = format(log.timestamp, "yyyy-MM-dd");

      if (!logsByDate.has(dateKey)) {
        logsByDate.set(dateKey, []);
      }
      logsByDate.get(dateKey)!.push(log.type);
    }

    const requestMap = new Map<string, LogoutRequestStatus>();

    for (const req of logoutRequests) {
      const dateKey = format(req.requestedLogout, "yyyy-MM-dd");
      requestMap.set(dateKey, req.status);
    }

    const missingDays: any[] = [];

    for (const [date, types] of logsByDate.entries()) {
      const hasLogin = types.includes(TimeLogType.LOGIN);
      const hasLogout = types.includes(TimeLogType.LOGOUT);

      if (!hasLogin || hasLogout) continue;

      const status = requestMap.get(date);

      // exclude PENDING & APPROVED
      if (
        status === LogoutRequestStatus.PENDING ||
        status === LogoutRequestStatus.APPROVED
      ) {
        continue;
      }

      missingDays.push({
        date,
        hasLogin: true,
        hasLogout: false,
        logoutRequestStatus: status ?? null,
      });
    }

    return missingDays;
  }
  async createLogoutRequest(userId: number, dto: CreateLogoutRequestDTO) {
    const { requestedLogout, logoutTime } = dto;

    // ❌ do not allow today
    if (isToday(requestedLogout)) {
      throw new Error("Cannot apply logout request for today");
    }

    const dayStart = startOfDay(requestedLogout);
    const dayEnd = endOfDay(requestedLogout);

    // 1️⃣ Check duplicate request for same day
    const existing = await this.repo.findRequestForDay(
      userId,
      dayStart,
      dayEnd,
    );

    if (existing && existing.status !== LogoutRequestStatus.REJECTED) {
      throw new Error("Logout request already exists for this day");
    }

    // 2️⃣ Check login exists for that day
    const hasLogin = await this.repo.hasLoginForDay(userId, dayStart, dayEnd);

    if (!hasLogin) {
      throw new Error("No login found for selected day");
    }

    // 3️⃣ Check logout already exists
    const hasLogout = await this.repo.hasLogoutForDay(userId, dayStart, dayEnd);

    if (hasLogout) {
      throw new Error("Logout already exists for selected day");
    }

    // 4️⃣ Create request
    // 4️⃣ Merge date + 12-hour time using helper
    const logoutDateTime = this.convert12hToDate(
      new Date(requestedLogout),
      logoutTime,
    );

    return this.repo.createLogoutRequest({
      userId,
      requestedLogout: logoutDateTime,
      status: LogoutRequestStatus.PENDING,
    });
  }

  async getAllLogoutRequests() {
    return this.repo.getAllLogoutRequests();
  }

  async approveOrReject(
    requestId: number,
    approverId: number,
    action: LogoutRequestStatus,
  ) {
    const request = await this.repo.getById(requestId);

    if (!request) throw new Error("Logout request not found");
    if (request.status !== LogoutRequestStatus.PENDING) {
      throw new Error("Request already processed");
    }

    // Update request status
    const updated = await this.repo.updateStatus(requestId, action);

    // Save approval action
    await this.repo.createApprovalAction({
      logoutRequestId: requestId,
      approverId,
      action,
    });

    // ✅ If APPROVED → insert LOGOUT time log
    if (action === LogoutRequestStatus.APPROVED) {
      await this.repo.createLogoutTimeLog({
        userId: request.userId,
        timestamp: request.requestedLogout,
        type: TimeLogType.LOGOUT,
      });
    }

    return updated;
  }

  async getTeamLogoutRequests(managerId: number) {
    return this.repo.getLogoutRequestsForManager(managerId);
  }

  async approveOrRejectByManager(
    requestId: number,
    managerId: number,
    action: LogoutRequestStatus,
  ) {
    const request = await this.repo.getById(requestId);
    if (!request) throw new Error("Logout request not found");

    // 🔐 Ownership check
    const isTeamMember = await this.repo.isManagerOfUser(
      managerId,
      request.userId,
    );

    if (!isTeamMember) {
      throw new Error("You are not allowed to approve this request");
    }

    // reuse existing logic
    return this.approveOrReject(requestId, managerId, action);
  }
}
