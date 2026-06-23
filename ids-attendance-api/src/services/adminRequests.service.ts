import { LeaveRequestRepository } from "../repositories/leaveRequest.repository.js";
import { OvertimeRequestRepository } from "../repositories/overtimeRequest.repository.js";

export class AdminRequestsService {
  private leaveRepo = new LeaveRequestRepository();
  private overtimeRepo = new OvertimeRequestRepository();

  async getAllRequests(dto: { status?: string; page: number; limit: number }) {
    const { status, page, limit } = dto;

    const [leaveRequests, leaveTotal, overtimeRequests, overtimeTotal] =
      await Promise.all([
        this.leaveRepo.findAll(status, page, limit),
        this.leaveRepo.countAll(status),

        this.overtimeRepo.findAll(status, page, limit),
        this.overtimeRepo.countAll(status),
      ]);

    return {
      leaveRequests,
      overtimeRequests,
      meta: {
        leaveTotal,
        overtimeTotal,
        page,
        limit,
      },
    };
  }
}
