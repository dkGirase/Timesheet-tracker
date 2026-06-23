import { z } from "zod";

export const CreateOrUpdateLeaveBalanceSchema = z.object({
  userId: z.number().int(),
  month: z.number().int().min(1).max(12),
  year: z
    .number()
    .int()
    .min(new Date().getFullYear(), "Year cannot be in the past"),
  earned: z.number().min(0),
  used: z.number().min(0),
});

// Create DTO for the same
export type CreateOrUpdateLeaveBalanceDTO = z.infer<
  typeof CreateOrUpdateLeaveBalanceSchema
>;
