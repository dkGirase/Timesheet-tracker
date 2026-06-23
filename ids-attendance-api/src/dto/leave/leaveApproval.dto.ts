import { z } from "zod";

export const LeaveApprovalSchema = z.object({
  remarks: z.string().optional(),
});

export type LeaveApprovalDTO = z.infer<typeof LeaveApprovalSchema>;
