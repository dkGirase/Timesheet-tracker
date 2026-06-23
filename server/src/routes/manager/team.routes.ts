import express from "express";
import {
  addTeamMembers,
  removeTeamMembers,
  updateTeamDetails,
  getMyTeamDetails,
} from "../../controllers/admin/team.controller.js";
import { validateBody } from "../../middlewares/validationMiddleware.js";

const router = express.Router();

router.get("/my-team", getMyTeamDetails);

router.patch(
  "/:id",
  validateBody("updateTeamDetailsSchema"),
  updateTeamDetails
);

router.post(
  "/:id/members",
  validateBody("updateTeamMembersSchema"),
  addTeamMembers
);

router.delete(
  "/:id/members",
  validateBody("updateTeamMembersSchema"),
  removeTeamMembers
);

export default router;
