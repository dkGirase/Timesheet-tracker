import express from "express";
import {
  listUsers,
  toggleUserActivation,
  changeUserPassword,
  changeUserPin,
  changeUserRole,
  listUsersNonTeam,
} from "../../controllers/admin/user.controller.js";
import { validateBody } from "../../middlewares/validationMiddleware.js";

const router = express.Router();

router.get("/", listUsers);
router.get("/nonTeam", listUsersNonTeam);
router.patch("/:id/activation", toggleUserActivation);

router.patch("/:id/change-pin", validateBody("changePinSchema"), changeUserPin);

router.patch(
  "/:id/change-password",
  validateBody("changePasswordSchema"),
  changeUserPassword
);

router.patch("/:id/change-role", changeUserRole);

export default router;
