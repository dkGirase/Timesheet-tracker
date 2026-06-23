// routes/admin/leave-credit.routes.ts
import express from "express";
import { LeaveCreditController } from "../../controllers/admin/leave-credit.controller.js";

const router = express.Router();
const controller = new LeaveCreditController();

router.post("/", controller.runMonthlyLeaveCredit.bind(controller));

export default router;
