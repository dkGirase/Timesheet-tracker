import { Request, Response } from "express";
import { OvertimeApprovalService } from "../services/overtimeApproval.service.js";

const service = new OvertimeApprovalService();

export class OvertimeApprovalController {
  async approveOvertime(req: Request, res: Response) {
    try {
      const overtimeId = Number(req.params.id);
      const approverId = req.user.userId; // from auth middleware
      const overtime = await service.approveOvertime(overtimeId, approverId);
      res.json({ success: true, overtime });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async rejectOvertime(req: Request, res: Response) {
    try {
      const overtimeId = Number(req.params.id);
      const approverId = req.user.userId;
      const { remarks } = req.body;
      const overtime = await service.rejectOvertime(
        overtimeId,
        approverId,
        remarks
      );
      res.json({ success: true, overtime });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
