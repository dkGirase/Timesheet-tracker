import { z } from "zod";

export const HolidayResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  date: z.string(),
  description: z.string().optional(),
});

export type HolidayResponseDTO = z.infer<typeof HolidayResponseSchema>;
