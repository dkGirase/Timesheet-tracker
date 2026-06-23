import express from "express";
import { AttendanceController } from "../controllers/attendance.controller.js";

const router = express.Router();
const controller = new AttendanceController();

router.post("/override", controller.overrideAttendance.bind(controller));

export default router;
