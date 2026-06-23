import { z } from "zod";

export const LeaveClashSchema = z.object({
  teamId: z.number(),
  startDate: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: "Invalid startDate format",
  }),
  endDate: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: "Invalid endDate format",
  }),
});

export type LeaveClashDTO = z.infer<typeof LeaveClashSchema>;
