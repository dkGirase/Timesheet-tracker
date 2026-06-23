import { z } from "zod";
import { DAY_NAMES } from "../../constants.js";

export const createTeamSchema = z.object({
  name: z
    .string()
    .min(2, "Team name must be at least 2 characters")
    .max(100, "Team name too long"),

  description: z.string().max(255, "Description too long").optional(),

  managerId: z
    .number()
    .int("Manager ID must be an integer")
    .positive("Manager ID must be positive")
    .nullable()
    .optional(),
  memberIds: z
    .array(
      z
        .number()
        .int("Member ID must be an integer")
        .positive("Member ID must be positive"),
    )
    .optional(),
});

export const updateTeamDescriptionSchema = z.object({
  description: z.string().trim().min(1).nullable().optional(),
});

export const updateTeamDetailsSchema = z.object({
  name: z.string().min(1, "Team name cannot be empty").optional(),
  description: z.string().optional(),
});

export const updateTeamManagerSchema = z.object({
  managerId: z
    .number()
    .int()
    .positive("managerId must be a valid number")
    .nullable(),
});

export const updateTeamMembersSchema = z.object({
  memberIds: z
    .array(z.number().int().positive("Member ID must be a valid number"))
    .nonempty("At least one member ID is required"),
});

const WeekDayEnum = z.enum(DAY_NAMES.map((d) => d.toUpperCase()));

const validateAtLeastOneWorkingDay = (
  weekends: { day: z.infer<typeof WeekDayEnum> }[] | undefined,
  ctx: z.RefinementCtx,
) => {
  if (!weekends || weekends.length === 0) return;

  const allDays = DAY_NAMES.map((d) => d.toUpperCase());
  const weekendDays = new Set(weekends.map((w) => w.day));

  if (weekendDays.size === allDays.length) {
    ctx.addIssue({
      path: ["weekends"],
      message: "Team must have at least one working day",
      code: z.ZodIssueCode.custom,
    });
  }
};

export const createTeamWithWeekendSchema = createTeamSchema
  .extend({
    weekends: z
      .array(
        z.object({
          day: WeekDayEnum,
          startDate: z.string().datetime(),
          endDate: z.string().datetime().optional(),
        }),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    validateAtLeastOneWorkingDay(data.weekends, ctx);
  });

export const updateTeamWeekendsSchema = z
  .object({
    weekends: z.array(
      z.object({
        day: WeekDayEnum,
        startDate: z.string().datetime(),
        endDate: z.string().datetime().optional(),
      }),
    ),
  })
  .superRefine((data, ctx) => {
    validateAtLeastOneWorkingDay(data.weekends, ctx);
  });

export const deactivateTeamSchema = z.object({
  shutdownRemark: z
    .string()
    .min(5, "Shutdown remark is required and must be meaningful"),
});

export const reassignTeamMembersSchema = z.object({
  shutdownRemark: z.string().min(5, "Shutdown remark must be meaningful"),

  reassignments: z
    .array(
      z.object({
        userId: z.number().int().positive(),
        newTeamId: z.number().int().positive(),
      }),
    )
    .nonempty("At least one user must be reassigned"),
});
