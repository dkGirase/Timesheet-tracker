import { z } from "zod";

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Invalid email").optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dateOfBirth: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  dateOfJoining: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

export type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>;
