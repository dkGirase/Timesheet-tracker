import express from "express";
import { LeaveBalancesController } from "../../controllers/admin/leaveBalances.controller.js";

const router = express.Router();
const controller = new LeaveBalancesController();

router.post(
  "/update-leave-balance",
  controller.createOrUpdateLeaveBalance.bind(controller)
);

router.get("/", controller.getUserLeaveBalances.bind(controller));

export default router;
