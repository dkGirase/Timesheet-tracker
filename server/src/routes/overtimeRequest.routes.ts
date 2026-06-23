import { Router } from "express";
import { OvertimeRequestController } from "../controllers/overtimeRequest.controller.js";

const router = Router();
const controller = new OvertimeRequestController();

// Create overtime request
router.post("/", controller.create.bind(controller));

// Get my overtime requests
router.get("/", controller.getMine.bind(controller));

// Get overtime requests of a specific user
router.get("/user/:userId", controller.getByUser.bind(controller));

router.get("/:id", controller.getById.bind(controller));

export default router;
