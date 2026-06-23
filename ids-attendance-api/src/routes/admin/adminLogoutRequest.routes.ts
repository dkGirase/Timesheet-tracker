// routes/logoutRequest.routes.ts
import { Router } from "express";
import { LogoutRequestController } from "../../controllers/logoutRequest.controller.js";

const router = Router();
const controller = new LogoutRequestController();
// NEW
router.get("/", controller.getAll.bind(controller));
// NEW
router.patch("/:id/action", controller.approveOrReject.bind(controller));

export default router;
