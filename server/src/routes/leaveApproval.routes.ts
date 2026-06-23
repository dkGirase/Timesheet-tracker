import express from "express";
import { LeaveApprovalController } from "../controllers/leaveApproval.controller.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();
const controller = new LeaveApprovalController();

// Approve leave
router.post("/:id/approve", controller.approveLeave.bind(controller));

// Reject leave
router.post("/:id/reject", controller.rejectLeave.bind(controller));

export default router;
