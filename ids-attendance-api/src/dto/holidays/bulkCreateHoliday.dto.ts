import { z } from "zod";
import { CreateHolidaySchema } from "./createHoliday.dto.js";

export const BulkCreateHolidaySchema = z.object({
  holidays: z.array(CreateHolidaySchema),
});

export type BulkCreateHolidayDTO = z.infer<typeof BulkCreateHolidaySchema>;
