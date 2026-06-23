import { z } from "zod";
import {
  AttendanceStatus,
  HalfDayPeriod,
} from "../../../prisma/generated/enums.js";

export const ManualAttendanceSchema = z
  .object({
    userId: z.number(),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
    status: z.enum(Object.values(AttendanceStatus)),
    halfDayPeriod: z.enum(Object.values(HalfDayPeriod)).optional(),
    remarks: z.string().min(3, "Remarks are required"),
  })
  .superRefine((data, ctx) => {
    // Check half-day period
    if (
      data.status === AttendanceStatus.LEAVE_HALF_DAY &&
      !data.halfDayPeriod
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "halfDayPeriod is required for half-day leave",
        path: ["halfDayPeriod"],
      });
    }
  });

export type ManualAttendanceDTO = z.infer<typeof ManualAttendanceSchema>;
