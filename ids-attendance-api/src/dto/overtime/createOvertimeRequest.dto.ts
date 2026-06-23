import { z } from "zod";

export const CreateOvertimeRequestSchema = z.object({
  date: z.coerce.date(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  totalHours: z.number().positive(),
  reason: z.string().min(3),
});

export type CreateOvertimeRequestDTO = z.infer<
  typeof CreateOvertimeRequestSchema
>;
