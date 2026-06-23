import { LeaveRequestRepository } from "../repositories/leaveRequest.repository.js";
import { CreateLeaveRequestDTO } from "../dto/leave/createLeaveRequest.dto.js";
import { GetMyLeaveRequestsDTO } from "../dto/leave/getMyLeaveRequests.dto.js";
import { GetMyTeamLeaveRequestsDTO } from "../dto/leave/getMyTeamLeaveRequests.dto.js";
import { LeaveStatus } from "../../prisma/generated/enums.js";
import { GetLeaveRequestDetailsDTO } from "../dto/leave/getLeaveRequestDetails.dto.js";
import { OvertimeRequestRepository } from "../repositories/overtimeRequest.repository.js";

export class LeaveRequestService {
  private repo: LeaveRequestRepository;
  private overtimeRepo: OvertimeRequestRepository;

  constructor() {
    this.repo = new LeaveRequestRepository();
    this.overtimeRepo = new OvertimeRequestRepository();
  }

  async createLeaveRequest(userId: number, dto: CreateLeaveRequestDTO) {
    const { startDate, endDate, reason, details } = dto;

    // -------------------------
    // 1. Basic range validation
    // -------------------------
    if (startDate > endDate) {
      throw new Error("Start date cannot be after end date.");
    }

    // Convert details dates into actual Date objects (Zod already does this)
    const detailDates = details.map((d) => d.date);

    // -------------------------
    // 2. Ensure each detail date is within the range
    // -------------------------
    for (const d of details) {
      if (d.date < startDate || d.date > endDate) {
        throw new Error(
          `Detail date ${d.date.toDateString()} is outside the leave range.`,
        );
      }
    }

    // -------------------------
    // 3. Ensure no duplicate dates in details
    // -------------------------
    const dateStrings = detailDates.map((d) => d.toISOString().split("T")[0]);
    const uniqueCount = new Set(dateStrings).size;

    if (uniqueCount !== dateStrings.length) {
      throw new Error("Duplicate dates found in leave details.");
    }

    // -------------------------
    // 4. Check for overlapping leaves
    // -------------------------
    const overlap = await this.repo.isDateRangeOverlapping(
      userId,
      startDate,
      endDate,
    );

    if (overlap) {
      throw new Error("Leave request overlaps with an existing leave.");
    }

    // -------------------------
    // 5. Normalize / sort details before saving
    // -------------------------
    const normalizedDetails = [...details].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

    // -------------------------
    // 6. Create the leave request
    // -------------------------
    const leaveRequest = await this.repo.create({
      userId,
      startDate,
      endDate,
      reason,
      status: LeaveStatus.PENDING,
      details: normalizedDetails,
    });

    return leaveRequest;
  }

  async getMyLeaveRequests(userId: number, dto: GetMyLeaveRequestsDTO) {
    const page = dto.page || 1;
    const limit = dto.limit || 10;
    const status = dto.status;

    const [data, total] = await Promise.all([
      this.repo.findManyByUser(userId, status, page, limit),
      this.repo.countByUser(userId, status),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMyTeamRequestsWithOvertime(
    managerId: number,
    dto: GetMyTeamLeaveRequestsDTO,
  ) {
    const { status, page = 1, limit = 10 } = dto;

    // -------------------------------
    // 1. Get leave requests (existing)
    // -------------------------------
    const leaveResult = await this.repo.findByManager(
      managerId,
      status,
      page,
      limit,
    );

    // -------------------------------
    // 2. Get overtime requests for the same team members
    // -------------------------------
    const overtimeResult = await this.overtimeRepo.findByManager(
      managerId,
      status,
      page,
      limit,
    );

    return {
      leaveRequests: leaveResult.leaveRequests,
      overtimeRequests: overtimeResult.overtimeRequests,
      totalLeaveRequests: leaveResult.total,
      totalOvertimeRequests: overtimeResult.total,
      page,
      limit,
    };
  }

  async getMyTeamLeaveRequests(
    managerId: number,
    dto: GetMyTeamLeaveRequestsDTO,
  ) {
    const { status, page = 1, limit = 10 } = dto;

    const result = await this.repo.findByManager(
      managerId,
      status,
      page,
      limit,
    );

    return {
      leaveRequests: result.leaveRequests,
      total: result.total,
      page,
      limit,
    };
  }

  async getLeaveRequestDetails(
    userId: number,
    dto: GetLeaveRequestDetailsDTO,
    role?: string,
  ) {
    const { id } = dto;

    // 1. Fetch leave request
    const leave = await this.repo.findById(id);

    if (!leave) {
      throw new Error("Leave request not found.");
    }

    // 2. Permission checks
    const isOwner = leave.userId === userId;
    const isManager = await this.repo.isManagerOfEmployee(userId, leave.userId);
    const isAdmin = role === "ADMIN";

    if (!isOwner && !isManager && !isAdmin) {
      throw new Error("You are not allowed to view this leave request.");
    }

    // 3. Return leave request
    return leave;
  }

  async approveLeave(leaveId: number, approverId: number) {
    // You can extend: check if approver is manager/admin here
    return this.repo.updateStatus(leaveId, LeaveStatus.APPROVED);
  }

  async rejectLeave(leaveId: number, approverId: number) {
    // You can extend: check if approver is manager/admin here
    return this.repo.updateStatus(leaveId, LeaveStatus.REJECTED);
  }
}
