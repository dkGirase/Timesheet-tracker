import express from "express";
import { listUsersNonTeam } from "../../controllers/admin/user.controller.js";

const router = express.Router();

router.get("/", listUsersNonTeam);

export default router;
