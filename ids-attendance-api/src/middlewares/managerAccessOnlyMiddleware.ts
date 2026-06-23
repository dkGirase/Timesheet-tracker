import { Role } from "../../prisma/generated/enums.js";
import { authenticate } from "./authMiddleware.js";
import { authorize } from "./roleMiddleware.js";

export const managerAccessOnly = [
  authenticate,
  authorize([Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER]),
];
