import { z } from "zod";

export const GetMyLeaveRequestsSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

export type GetMyLeaveRequestsDTO = z.infer<typeof GetMyLeaveRequestsSchema>;
