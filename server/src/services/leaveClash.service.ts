import { LeaveClashDTO } from "../dto/leave/leaveClash.dto.js";
import { LeaveClashRepository } from "../repositories/leaveClash.repository.js";

export class LeaveClashService {
  private repo = new LeaveClashRepository();

  async findClashes(managerId: number, dto: LeaveClashDTO) {
    const { teamId, startDate, endDate } = dto;

    return this.repo.findClashingLeaves(
      teamId,
      new Date(startDate),
      new Date(endDate)
    );
  }
}
