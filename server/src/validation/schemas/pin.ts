import { z } from "zod";

export const pinSchema = z
  .string()
  .min(1, "PIN is required")
  .regex(/^\d{4}$/, "PIN must be exactly 4 digits");

export const changePinSchema = z.object({
  pin: pinSchema,
});
