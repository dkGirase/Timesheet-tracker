import { Request, Response } from "express";
import { LeaveApprovalService } from "../services/leaveApproval.service.js";

const service = new LeaveApprovalService();

export class LeaveApprovalController {
  async approveLeave(req: Request, res: Response) {
    try {
      const leaveId = Number(req.params.id);
      const approverId = req.user.userId; // assume auth middleware sets req.user
      const leave = await service.approveLeave(leaveId, approverId);
      res.json({ success: true, leave });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async rejectLeave(req: Request, res: Response) {
    try {
      const leaveId = Number(req.params.id);
      const approverId = req.user.userId;
      const { remarks } = req.body;
      const leave = await service.rejectLeave(leaveId, approverId, remarks);
      res.json({ success: true, leave });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
