import { Router } from "express";
import { AdminRequestsController } from "../../controllers/admin/adminRequests.controller.js";

const router = Router();
const controller = new AdminRequestsController();

// GET /admin/requests
router.get("/", controller.getAll.bind(controller));

export default router;
