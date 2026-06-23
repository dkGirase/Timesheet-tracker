import express from "express";
import { ReportsController } from "../../controllers/admin/report.controller.js";

const router = express.Router();
const controller = new ReportsController();

router.get(
  "/monthly-attendance",
  controller.getMonthlyAttendanceReport.bind(controller)
);

export default router;
