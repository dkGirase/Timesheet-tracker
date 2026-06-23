import { z } from "zod";
import { LogoutRequestStatus } from "../../../prisma/generated/enums.js";

export const ActionLogoutRequestSchema = z.object({
  action: z.enum([LogoutRequestStatus.APPROVED, LogoutRequestStatus.REJECTED]),
});

export type ActionLogoutRequestDTO = z.infer<typeof ActionLogoutRequestSchema>;
