import { OvertimeApprovalRepository } from "../repositories/overtimeApproval.repository.js";

export class OvertimeApprovalService {
  private repo: OvertimeApprovalRepository;

  constructor() {
    this.repo = new OvertimeApprovalRepository();
  }

  async approveOvertime(overtimeId: number, approverId: number) {
    return this.repo.approveOvertime(overtimeId, approverId);
  }

  async rejectOvertime(
    overtimeId: number,
    approverId: number,
    remarks?: string
  ) {
    return this.repo.rejectOvertime(overtimeId, approverId, remarks);
  }
}
