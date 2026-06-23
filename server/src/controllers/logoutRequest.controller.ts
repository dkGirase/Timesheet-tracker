// controllers/logoutRequest.controller.ts
import { Request, Response } from "express";
import { LogoutRequestService } from "../services/logoutRequest.service.js";
import { CreateLogoutRequestSchema } from "../dto/logout/createLogoutRequest.dto.js";
import { ActionLogoutRequestSchema } from "../dto/logout/actionLogoutRequest.dto.js";

const service = new LogoutRequestService();

export class LogoutRequestController {
  async getMissingLogouts(req: Request, res: Response) {
    try {
      const userId = req.user.userId;

      const data = await service.findMissingLogoutDays(userId);

      return res.status(200).json({
        message: "Missing logout days fetched successfully",
        data,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Something went wrong",
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const userId = req.user.userId;
      const dto = CreateLogoutRequestSchema.parse(req.body);

      const data = await service.createLogoutRequest(userId, dto);

      return res.status(201).json({
        message: "Logout request submitted successfully",
        data,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Something went wrong",
      });
    }
  }

  // ADD this method
  async getAll(req: Request, res: Response) {
    try {
      // Optional: role check (ADMIN / MANAGER)
      const data = await service.getAllLogoutRequests();

      return res.status(200).json({
        message: "Logout requests fetched successfully",
        data,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Something went wrong",
      });
    }
  }

  // ADD
  async approveOrReject(req: Request, res: Response) {
    try {
      const approverId = req.user.userId;
      const requestId = Number(req.params.id);
      const dto = ActionLogoutRequestSchema.parse(req.body);

      const data = await service.approveOrReject(
        requestId,
        approverId,
        dto.action,
      );

      return res.status(200).json({
        message: `Logout request ${dto.action.toLowerCase()} successfully`,
        data,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Something went wrong",
      });
    }
  }

  // MANAGER: get team logout requests
  async getTeamLogoutRequests(req: Request, res: Response) {
    try {
      const managerId = req.user.userId;

      const data = await service.getTeamLogoutRequests(managerId);

      return res.status(200).json({
        message: "Team logout requests fetched successfully",
        data,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Something went wrong",
      });
    }
  }

  // MANAGER: approve / reject team member
  async approveOrRejectTeamMember(req: Request, res: Response) {
    try {
      const managerId = req.user.userId;
      const requestId = Number(req.params.id);
      const dto = ActionLogoutRequestSchema.parse(req.body);

      const data = await service.approveOrRejectByManager(
        requestId,
        managerId,
        dto.action,
      );

      return res.status(200).json({
        message: `Logout request ${dto.action.toLowerCase()} successfully`,
        data,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Something went wrong",
      });
    }
  }
}
