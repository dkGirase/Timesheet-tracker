import { z } from "zod";
export const CreateLogoutRequestSchema = z.object({
  requestedLogout: z.coerce.date(),
  logoutTime: z.string().regex(
  /^(\d{1,2}):(\d{2})\s?(AM|PM)?$/i,
  "Invalid time format"
)
});

export type CreateLogoutRequestDTO = z.infer<typeof CreateLogoutRequestSchema>;
