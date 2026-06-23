import { Router } from "express";
import { LogoutRequestController } from "../../controllers/logoutRequest.controller.js";

const router = Router();
const controller = new LogoutRequestController();

// GET manager's team logout requests
router.get("/team", controller.getTeamLogoutRequests.bind(controller));

// APPROVE / REJECT (manager)
router.patch(
  "/:id/action",
  controller.approveOrRejectTeamMember.bind(controller),
);

export default router;
