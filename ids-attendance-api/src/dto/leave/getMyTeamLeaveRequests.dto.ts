import { z } from "zod";

export const GetMyTeamLeaveRequestsSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

export type GetMyTeamLeaveRequestsDTO = z.infer<
  typeof GetMyTeamLeaveRequestsSchema
>;
