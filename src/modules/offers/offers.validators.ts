import { z } from "zod";

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id");

export const createOfferSchema = z.object({
  guestId: z.uuid(),
  fullName: z.string().trim().min(2).max(80),
  email: z.email(),
  phone: z.string().min(6),
  phoneCountry: z.string().length(2).optional(),
  licensePlate: z
    .string()
    .trim()
    .min(2)
    .max(12)
    .transform((value) => value.toUpperCase().replace(/\s+/g, "")),
  year: z.coerce.number().int().min(1950).max(2100),
  make: objectId,
  model: objectId,
  mileage: z.coerce.number().min(0).max(2_000_000),
  condition: objectId,
  city: z.string().trim().min(2).max(80),
  zip: z
    .string()
    .trim()
    .regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code."),
});
