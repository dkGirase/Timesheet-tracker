import { z } from "zod";

export const GetLeaveRequestDetailsSchema = z.object({
  id: z.string().transform(Number),
});

export type GetLeaveRequestDetailsDTO = z.infer<
  typeof GetLeaveRequestDetailsSchema
>;
