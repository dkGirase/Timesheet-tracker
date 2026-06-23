import express from "express";
import { OvertimeApprovalController } from "../controllers/overtimeApproval.controller.js";

const router = express.Router();
const controller = new OvertimeApprovalController();

// Approve overtime
router.post("/:id/approve", controller.approveOvertime.bind(controller));

// Reject overtime
router.post("/:id/reject", controller.rejectOvertime.bind(controller));

export default router;
