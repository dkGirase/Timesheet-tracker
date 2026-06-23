import { LeaveApprovalRepository } from "../repositories/leaveApproval.repository.js";

export class LeaveApprovalService {
  private repo: LeaveApprovalRepository;

  constructor() {
    this.repo = new LeaveApprovalRepository();
  }

  async approveLeave(leaveId: number, approverId: number) {
    // Add checks for manager/admin role here if needed
    return this.repo.approveLeave(leaveId, approverId);
  }

  async rejectLeave(leaveId: number, approverId: number, remarks?: string) {
    return this.repo.rejectLeave(leaveId, approverId, remarks);
  }
}
