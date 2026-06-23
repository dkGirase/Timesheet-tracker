import { Role } from "../../prisma/generated/enums.js";
import { authenticate } from "./authMiddleware.js";
import { authorize } from "./roleMiddleware.js";

export const adminAccessOnly = [
  authenticate,
  authorize([Role.ADMIN, Role.SUPER_ADMIN]),
];
