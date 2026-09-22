import { z } from "zod";

export const createContactSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.email(),
  phone: z.string().min(6),
  phoneCountry: z.string().length(2).optional(),
  message: z.string().trim().min(10).max(4000),
});
