import express from "express";
import { LeaveClashController } from "../../controllers/leaveClash.controller.js";

const router = express.Router();
const controller = new LeaveClashController();

router.post("/", controller.findClashes.bind(controller));

export default router;
