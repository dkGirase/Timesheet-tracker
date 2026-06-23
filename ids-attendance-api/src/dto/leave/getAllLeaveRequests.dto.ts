import { z } from "zod";

export const GetAllLeaveRequestsSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

export type GetAllLeaveRequestsDTO = z.infer<typeof GetAllLeaveRequestsSchema>;
