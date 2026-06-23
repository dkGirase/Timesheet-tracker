import express from "express";
import {
  addTeamMembers,
  createTeam,
  removeTeamMembers,
  updateTeamDetails,
  updateTeamManager,
  getAllTeams,
  updateTeamDescription,
  deactivateTeam,
  getTeams,
  reassignTeamMembers,
} from "../../controllers/admin/team.controller.js";
import { validateBody } from "../../middlewares/validationMiddleware.js";
import { updateTeamWeekends } from "../../controllers/admin/team.controller.js";

const router = express.Router();

router.get("/", getAllTeams);
router.get("/team-names", getTeams);

// ADMIN ONLY ROUTE
router.post("/create", validateBody("createTeamWithWeekendSchema"), createTeam);

router.post(
  "/:oldTeamId/reassign-members",
  validateBody("reassignTeamMembersSchema"),
  reassignTeamMembers,
);

router.patch(
  "/:id",
  validateBody("updateTeamDetailsSchema"),
  updateTeamDetails,
);

router.patch(
  "/:id/manager",
  validateBody("updateTeamManagerSchema"),
  updateTeamManager,
);

router.patch(
  "/:id/description",
  validateBody("updateTeamDescriptionSchema"),
  updateTeamDescription,
);

router.patch(
  "/:id/deactivate",
  validateBody("deactivateTeamSchema"),
  deactivateTeam,
);

router.post(
  "/:id/members",
  validateBody("updateTeamMembersSchema"),
  addTeamMembers,
);

router.delete(
  "/:id/members",
  validateBody("updateTeamMembersSchema"),
  removeTeamMembers,
);

router.patch(
  "/:id/weekends",
  validateBody("updateTeamWeekendsSchema"),
  updateTeamWeekends,
);

export default router;
