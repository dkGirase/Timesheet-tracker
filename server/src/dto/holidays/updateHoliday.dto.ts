import { z } from "zod";

export const UpdateHolidaySchema = z.object({
  name: z.string().min(1).optional(),
  date: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const [day, month, year] = val.split("/").map(Number);
      return new Date(
        Date.UTC(year < 100 ? year + 2000 : year, month - 1, day)
      );
    }),
  description: z.string().nullable().optional(),
});

export type UpdateHolidayDTO = z.infer<typeof UpdateHolidaySchema>;
