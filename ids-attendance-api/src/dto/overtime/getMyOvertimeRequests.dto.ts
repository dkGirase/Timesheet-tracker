import { z } from "zod";

export const GetMyOvertimeRequestsSchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

export type GetMyOvertimeRequestsDTO = z.infer<
  typeof GetMyOvertimeRequestsSchema
>;
