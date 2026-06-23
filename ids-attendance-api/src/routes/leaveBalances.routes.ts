import express from "express";
import { LeaveBalancesController } from "../controllers/admin/leaveBalances.controller.js";

const router = express.Router();
const controller = new LeaveBalancesController();

router.get("/", controller.getUserLeaveBalances.bind(controller));
router.get("/current", controller.getLatestLeaveBalances.bind(controller));

export default router;
