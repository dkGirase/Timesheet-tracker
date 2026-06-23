import { Router } from "express";
import { LeaveRequestController } from "../controllers/leaveRequest.controller.js";

const router = Router();
const controller = new LeaveRequestController();

router.get("/my-weekends", controller.getMyWeekends.bind(controller));

router.get(
  "/leave-balance/range",
  controller.getLeaveBalanceByDateRange.bind(controller),
);

// POST /leave-requests
router.post("/", controller.create.bind(controller));

// Get my leave requests
router.get("/", controller.getMine.bind(controller));

// Get my leave requests
router.get("/user/:userId", controller.getMyTeamMembers.bind(controller));

// Get my team's leave requests
router.get("/my-team", controller.getMyTeamRequests.bind(controller));

// Get leave request details
router.get("/:id", controller.getLeaveRequestDetails.bind(controller));

export default router;
