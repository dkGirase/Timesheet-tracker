// controllers/admin/leave-credit.controller.ts
import { Request, Response } from "express";
import { LeaveCreditService } from "../../services/leave-credit.service.js";

const service = new LeaveCreditService();

export class LeaveCreditController {
  async runMonthlyLeaveCredit(req: Request, res: Response) {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ message: "month and year required" });
    }

    await service.processMonthlyLeaveCredit(month, year);

    res.json({ message: "Leave credit processed successfully" });
  }
}
