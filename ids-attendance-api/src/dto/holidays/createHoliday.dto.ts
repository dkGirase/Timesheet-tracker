import { z } from "zod";

export const CreateHolidaySchema = z.object({
  name: z.string().min(1, "Holiday name is required"),

  date: z
    .string()
    .refine(
      (val) => {
        if (!val.includes("/")) return false;
        const [day, month, year] = val.split("/").map(Number);
        return day > 0 && month > 0 && year > 0 && month <= 12 && day <= 31;
      },
      { message: "Invalid date format" },
    )
    .transform((val) => {
      let [day, month, year] = val.split("/").map(Number);

      if (year < 100) year += 2000;
      return new Date(Date.UTC(year, month - 1, day));
    }),
  description: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === null ? undefined : val)),
});

export type CreateHolidayDTO = z.infer<typeof CreateHolidaySchema>;
