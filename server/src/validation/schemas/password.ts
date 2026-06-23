import { z } from "zod";

// Password regex and schema (same as before)
const passwordValidationRegex = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  specialChar: /[\W_]/,
  number: /\d/,
};

export const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters long")
  .refine((val) => /[A-Z]/.test(val), {
    message: "Password must contain at least one uppercase letter",
  })
  .refine((val) => /[a-z]/.test(val), {
    message: "Password must contain at least one lowercase letter",
  })
  .refine((val) => /\d/.test(val), {
    message: "Password must contain at least one number",
  })
  .refine((val) => /[\W_]/.test(val), {
    message: "Password must contain at least one special character",
  });

export const changePasswordSchema = z.object({
  password: passwordSchema,
});
