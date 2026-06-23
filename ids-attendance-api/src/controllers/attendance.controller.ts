import { Request, Response } from "express";
import { AttendanceService } from "../services/attendance.service.js";
import { ManualAttendanceSchema } from "../dto/attendance/manualAttendance.dto.js";

const service = new AttendanceService();

export class AttendanceController {
  async overrideAttendance(req: Request, res: Response) {
    try {
      const adminId = req.user.userId; // from auth middleware
      const role = req.user.role;
      const dto = ManualAttendanceSchema.parse(req.body);

      const result = await service.overrideAttendance(adminId, dto, role);

      res.json({ success: true, result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async startWorking(req: Request, res: Response) {
    try {
      const userId = req.user.userId;
      const result = await service.startWorking(userId);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async stopWorking(req: Request, res: Response) {
    try {
      const userId = req.user.userId;

      const result = await service.stopWorking(userId);

      res.json({ success: true, result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
  async getStatus(req: Request, res: Response) {
    try {
      const userId = req.user.userId;

      const results = await service.getWorkingStatuses([userId]);
      const todayStatus = results[0];

      res.json({
        isWorking: todayStatus.status === "WORKING",
        status: todayStatus.status,
        lastLog: todayStatus.lastLog,
        date: new Date().toISOString().slice(0, 10),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async getMonthlyAttendance(req: Request, res: Response) {
    try {
      const month = parseInt(req.query.month as string);
      const year = parseInt(req.query.year as string);
      const teamId = req.query.teamId ? Number(req.query.teamId) : undefined;

      if (!month || !year) {
        return res.status(400).json({ error: "month and year are required" });
      }

      const loggedInUserId = req.user.userId;
      const requestedUserId = req.query.id
        ? parseInt(req.query.id as string)
        : loggedInUserId;

      const result = await service.getMonthlyAttendance(
        Number(requestedUserId),
        month,
        year,
        req.user.role,
        loggedInUserId,
        teamId, // Pass teamId to service
      );

      res.json({ success: true, result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
