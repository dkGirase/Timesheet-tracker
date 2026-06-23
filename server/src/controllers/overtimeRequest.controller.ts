import { Request, Response } from "express";
import { OvertimeRequestService } from "../services/overtimeRequest.service.js";
import { CreateOvertimeRequestSchema } from "../dto/overtime/createOvertimeRequest.dto.js";
import { GetMyOvertimeRequestsSchema } from "../dto/overtime/getMyOvertimeRequests.dto.js";

const service = new OvertimeRequestService();

export class OvertimeRequestController {
  async create(req: Request, res: Response) {
    try {
      const userId = req.user.userId;
      const dto = CreateOvertimeRequestSchema.parse(req.body);

      const result = await service.createOvertimeRequest(userId, dto);

      return res.status(201).json({
        message: "Overtime request created successfully",
        data: result,
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
      const dto = GetMyOvertimeRequestsSchema.parse(req.query);

      const result = await service.getMyOvertimeRequests(userId, dto);

      return res.status(200).json({
        message: "Overtime requests fetched successfully",
        ...result,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Something went wrong",
      });
    }
  }

  async getByUser(req: Request, res: Response) {
    try {
      const userId = Number(req.params.userId);
      const dto = GetMyOvertimeRequestsSchema.parse(req.query);

      const result = await service.getMyOvertimeRequests(userId, dto);

      return res.status(200).json({
        message: "Overtime requests fetched successfully",
        ...result,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Something went wrong",
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await service.getOvertimeById(id);

      if (!result) {
        return res.status(404).json({ message: "Overtime request not found" });
      }

      return res.status(200).json({
        message: "Overtime request fetched successfully",
        data: result,
      });
    } catch (error: any) {
      return res
        .status(400)
        .json({ message: error.message ?? "Something went wrong" });
    }
  }
}
