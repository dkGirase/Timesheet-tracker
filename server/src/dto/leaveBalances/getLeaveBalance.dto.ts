import { z } from "zod";

export const GetLeaveBalanceSchema = z.object({
  userId: z.coerce.number().int(), // Coerce the input into a number
  month: z.coerce.number().int().min(1).max(12), // Coerce to number and validate month
  year: z.coerce.number().int().min(2000), // Coerce to number and validate year
});

export type GetLeaveBalanceDTO = z.infer<typeof GetLeaveBalanceSchema>;
