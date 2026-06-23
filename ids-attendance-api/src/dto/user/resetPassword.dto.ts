import { z } from "zod";

export const ResetPasswordSchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export type ResetPasswordDTO = z.infer<typeof ResetPasswordSchema>;
