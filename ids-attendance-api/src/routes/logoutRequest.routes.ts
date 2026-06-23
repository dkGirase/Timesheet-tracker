// routes/logoutRequest.routes.ts
import { Router } from "express";
import { LogoutRequestController } from "../controllers/logoutRequest.controller.js";

const router = Router();
const controller = new LogoutRequestController();

router.get("/missing", controller.getMissingLogouts.bind(controller));
router.post("/", controller.create.bind(controller));

export default router;
