import { Request, Response } from "express";
import { LeaveRequestService } from "../services/leaveRequest.service.js";
import { CreateLeaveRequestSchema } from "../dto/leave/createLeaveRequest.dto.js";
import { GetMyLeaveRequestsSchema } from "../dto/leave/getMyLeaveRequests.dto.js";
import { GetMyTeamLeaveRequestsSchema } from "../dto/leave/getMyTeamLeaveRequests.dto.js";
import { GetLeaveRequestDetailsSchema } from "../dto/leave/getLeaveRequestDetails.dto.js";
import { TeamWeekendService } from "../services/teamWeekend.service.js";
import { LeaveBalancesService } from "../services/leaveBalances.service.js";

const service = new LeaveRequestService();

export class LeaveRequestController {
  async create(req: Request, res: Response) {
    try {
      const userId = req.user.userId;
      const dto = CreateLeaveRequestSchema.parse(req.body);
      const leaveRequest = await service.createLeaveRequest(userId, dto);

      return res.status(201).json({
        message: "Leave request created successfully",
        data: leaveRequest,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Something went wrong",
      });
    }
  }

  async getMine(req: Request, res: Response) {
    try {
      const userId = req.user.userId;
      const dto = GetMyLeaveRequestsSchema.parse(req.query);
      const result = await service.getMyLeaveRequests(userId, dto);

      return res.status(200).json({
        message: "Leave requests fetched successfully",
        ...result,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Something went wrong",
      });
    }
  }

  async getMyTeamMembers(req: Request, res: Response) {
    try {
      const userId = Number(req.params.userId);
      const dto = GetMyLeaveRequestsSchema.parse(req.query);
      const result = await service.getMyLeaveRequests(userId, dto);

      return res.status(200).json({
        message: "Leave requests fetched successfully",
        ...result,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Something went wrong",
      });
    }
  }

  async getMyTeamRequests(req: Request, res: Response) {
    try {
      const userId = req.user.userId;
      const dto = GetMyTeamLeaveRequestsSchema.parse(req.query);

      const result = await service.getMyTeamRequestsWithOvertime(userId, dto);

      return res.status(200).json({
        message: "Team leave & overtime requests fetched successfully",
        ...result,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Something went wrong",
      });
    }
  }

  async getLeaveRequestDetails(req: Request, res: Response) {
    try {
      const { userId, role } = req.user;
      const dto = GetLeaveRequestDetailsSchema.parse(req.params);

      const result = await service.getLeaveRequestDetails(userId, dto, role);

      return res.status(200).json({
        message: "Leave requests fetched successfully",
        ...result,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Something went wrong",
      });
    }
  }

  async getMyWeekends(req: Request, res: Response) {
    const userId = req.user.userId;
    const service = new TeamWeekendService();

    const weekends = await service.getUserWeekendDays(userId, new Date());

    res.json({
      weekends,
    });
  }

  async getLeaveBalanceByDateRange(req: Request, res: Response) {
    const userId = req.user.userId;
    const { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        message: "fromDate and toDate are required",
      });
    }

    const service = new LeaveBalancesService();

    const result = await service.getLeaveBalanceByRange(
      userId,
      new Date(fromDate as string),
      new Date(toDate as string),
    );

    res.json(result);
  }
}
