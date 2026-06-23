import { z } from "zod";

const isWithinLastWeek = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const oneWeekAgo = new Date();

  oneWeekAgo.setHours(0, 0, 0, 0);
  today.setHours(23, 59, 59, 999);
  oneWeekAgo.setDate(today.getDate() - 7);

  return date >= oneWeekAgo && date <= today;
};

export const loginSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  secret: z.string().min(1, "Password or PIN is required"),
});

export const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  employeeCode: z.string().min(1, "Employee code is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  pin: z.string().min(4, "PIN must be at least 4 characters"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dateOfJoining: z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), "Invalid date format for dateOfJoining")
  .refine(
    (val) => isWithinLastWeek(val),
    "Date of Joining must be within the last 7 days"
  ),

  dateOfBirth: z
    .string()
    .refine(
      (val) => !isNaN(Date.parse(val)),
      "Invalid date format for dateOfBirth"
    )
    .optional(),
  role: z.enum([
    "SUPER_ADMIN",
    "ADMIN",
    "MANAGER",
    "EMPLOYEE",
    "INTERN",
    "CONSULTANT",
  ]),
});
