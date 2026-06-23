import { loginSchema, signupSchema } from "./schemas/auth.js";
import { changePasswordSchema } from "./schemas/password.js";
import { changePinSchema } from "./schemas/pin.js";
import {
  createTeamSchema,
  createTeamWithWeekendSchema,
  deactivateTeamSchema,
  reassignTeamMembersSchema,
  updateTeamDescriptionSchema,
  updateTeamDetailsSchema,
  updateTeamManagerSchema,
  updateTeamMembersSchema,
  updateTeamWeekendsSchema,
} from "./schemas/team.js";

export const schemas = {
  loginSchema,
  signupSchema,
  createTeamSchema,
  updateTeamDetailsSchema,
  updateTeamManagerSchema,
  updateTeamMembersSchema,
  changePasswordSchema,
  changePinSchema,
  createTeamWithWeekendSchema,
  updateTeamWeekendsSchema,
  updateTeamDescriptionSchema,
  deactivateTeamSchema,
  reassignTeamMembersSchema
};
