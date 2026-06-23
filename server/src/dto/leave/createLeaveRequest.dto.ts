import { z } from "zod";
import { HalfDayPeriod } from "../../../prisma/generated/enums.js";

const BalanceSnapshotSchema = z.object({
  startingBalance: z.number(),
  remainingBalance: z.number(),
  paidLeaves: z.number(),
  unpaidLeaves: z.number(),
});

// One entry for one date
const LeaveDetailSchema = z
  .object({
    date: z.coerce.date(),
    isHalfDay: z.boolean(),
    halfDayPeriod: z.enum(Object.values(HalfDayPeriod)).optional().nullable(),
    balanceSnapshot: BalanceSnapshotSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isHalfDay && !data.halfDayPeriod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "halfDayPeriod is required when isHalfDay is true",
        path: ["halfDayPeriod"], // mark the failing field
      });
    }
  });

// Main request
export const CreateLeaveRequestSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().min(3),
  details: z.array(LeaveDetailSchema).min(1),
});

export type CreateLeaveRequestDTO = z.infer<typeof CreateLeaveRequestSchema>;
