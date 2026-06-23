import { Request, Response } from "express";
import { LeaveClashService } from "../services/leaveClash.service.js";
import {
  LeaveClashSchema,
  LeaveClashDTO,
} from "../dto/leave/leaveClash.dto.js";

const service = new LeaveClashService();

export class LeaveClashController {
  async findClashes(req: Request, res: Response) {
    try {
      const dto: LeaveClashDTO = LeaveClashSchema.parse(req.body);
      const managerId = req.user.userId;

      const result = await service.findClashes(managerId, dto);
      res.json({ clashes: result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
