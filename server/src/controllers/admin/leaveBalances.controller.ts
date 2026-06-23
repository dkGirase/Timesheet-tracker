import { Request, Response } from "express";
import { LeaveBalancesService } from "../../services/leaveBalances.service.js";
import {
  GetLeaveBalanceSchema,
  GetLeaveBalanceDTO,
} from "../../dto/leaveBalances/getLeaveBalance.dto.js";
import {
  CreateOrUpdateLeaveBalanceDTO,
  CreateOrUpdateLeaveBalanceSchema,
} from "../../dto/leaveBalances/createOrUpdateLeaveBalance.dto.js";
import { isRoleAdminOrManager } from "../../utils/user.js";

const service = new LeaveBalancesService();

export class LeaveBalancesController {
  // Method to create or update the leave balance
  async createOrUpdateLeaveBalance(req: Request, res: Response) {
    try {
      // Parse and validate the request body using Zod
      const dto: CreateOrUpdateLeaveBalanceDTO =
        CreateOrUpdateLeaveBalanceSchema.parse(req.body);

      // Call the service to create or update the leave balance
      const leaveBalance = await service.createOrUpdateLeaveBalance(
        dto.userId,
        dto.month,
        dto.year,
        dto.earned,
        dto.used
      );

      return res.status(201).json({
        message: "Leave balance created or updated successfully",
        data: leaveBalance,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Something went wrong",
      });
    }
  }

  // Method to get the leave balance for a specific user in a month/year
  async getUserLeaveBalances(req: Request, res: Response) {
    try {
      // Parse and validate the query parameters using Zod
      const dto: GetLeaveBalanceDTO = GetLeaveBalanceSchema.parse(req.query);

      // Check if the requester is either the user or has the required role (admin/manager)
      const requesterId = req.user?.userId; // Assuming the user id of the requester is in `req.user`
      const requesterRole = req.user?.role; // Assuming the role of the requester is in `req.user`

      // If the requester is not the same user and is not an admin or manager, return forbidden
      if (dto.userId !== requesterId && !isRoleAdminOrManager(requesterRole)) {
        return res.status(403).json({
          message:
            "You do not have permission to view this user's leave balance.",
        });
      }

      // Call the service to fetch the leave balance
      const leaveBalance = await service.getLeaveBalance(
        dto.userId,
        dto.month,
        dto.year
      );

      if (leaveBalance) {
        return res.status(200).json({
          message: "Leave balance fetched successfully",
          data: leaveBalance,
        });
      } else {
        return res.status(404).json({
          message: "Leave balance not found for the given month/year",
        });
      }
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Something went wrong",
      });
    }
  }

  async getLatestLeaveBalances(req: Request, res: Response) {
    try {
      // Get current date info
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Extract userId from query parameters (no need for DTO)
      const userId = parseInt(req.query.userId as string, 10);

      if (isNaN(userId)) {
        return res.status(400).json({
          message: "Invalid or missing userId in the request.",
        });
      }

      // Check if the requester is either the user or has the required role (admin/manager)
      const requesterId = req.user?.userId; // Assuming the user id of the requester is in `req.user`
      const requesterRole = req.user?.role; // Assuming the role of the requester is in `req.user`

      // If the requester is not the same user and is not an admin or manager, return forbidden
      if (userId !== requesterId && !isRoleAdminOrManager(requesterRole)) {
        return res.status(403).json({
          message:
            "You do not have permission to view this user's leave balance.",
        });
      }

      // Attempt to fetch the leave balance for the current month/year
      let leaveBalance = await service.getLeaveBalance(
        userId,
        currentMonth,
        currentYear
      );

      if (!leaveBalance) {
        // If no leave balance is found, attempt to fetch the most recent balance (last month/year)
        leaveBalance = await service.getLatestLeaveBalance(userId);
      }

      if (leaveBalance) {
        return res.status(200).json({
          message: "Leave balance fetched successfully",
          data: leaveBalance,
        });
      } else {
        return res.status(404).json({
          message: "No leave balance data found for the user.",
        });
      }
    } catch (error: any) {
      return res.status(400).json({
        message: error.message ?? "Something went wrong",
      });
    }
  }
}
