import { Request, Response } from "express";
import { AdminRequestsService } from "../../services/adminRequests.service.js";

const service = new AdminRequestsService();

export class AdminRequestsController {
  async getAll(req: Request, res: Response) {
    try {
      const { status, page = 1, limit = 10 } = req.query;

      const result = await service.getAllRequests({
        status: status as string | undefined,
        page: Number(page),
        limit: Number(limit),
      });

      return res.status(200).json({
        message: "All requests fetched successfully",
        ...result,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Something went wrong",
      });
    }
  }
}
