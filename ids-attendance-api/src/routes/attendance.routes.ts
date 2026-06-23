import express from "express";
import { AttendanceController } from "../controllers/attendance.controller.js";

const router = express.Router();
const controller = new AttendanceController();

// Get monthly attendance
router.get(
  "/monthly-attendance",
  controller.getMonthlyAttendance.bind(controller)
);

// Get current working status
router.get("/status", controller.getStatus.bind(controller));

// Start working
router.post("/start-working", controller.startWorking.bind(controller));

// Stop working
router.patch("/stop-working", controller.stopWorking.bind(controller));

export default router;
