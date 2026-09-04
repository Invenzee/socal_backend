import { z } from "zod";

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id");

const imageSchema = z.object({
  publicId: z.string().min(1),
  url: z.string().url(),
  width: z.number().optional(),
  height: z.number().optional(),
  isPrimary: z.boolean().optional(),
});

export const listingBodySchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(8000),
  year: z.coerce.number().int().min(1950).max(2100),
  mileage: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
  make: objectId,
  model: objectId,
  category: objectId,
  condition: objectId,
  fuel: objectId,
  transmission: objectId,
  features: z.array(objectId).optional().default([]),
  exteriorColor: z.string().trim().optional().default(""),
  interiorColor: z.string().trim().optional().default(""),
  vin: z.string().trim().optional().default(""),
  licensePlate: z.string().trim().optional().default(""),
  state: z.string().trim().optional().default(""),
  engine: z.string().trim().optional().default(""),
  horsePower: z.string().trim().optional().default(""),
  torque: z.string().trim().optional().default(""),
  driveTrain: z.string().trim().optional().default(""),
  doors: z.string().trim().optional().default(""),
  seats: z.string().trim().optional().default(""),
  topSpeed: z.string().trim().optional().default(""),
  images: z.array(imageSchema).min(1).max(8),
});

export const listingQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sort: z.string().optional(),
  q: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  category: z.string().optional(),
  condition: z.string().optional(),
  fuel: z.string().optional(),
  transmission: z.string().optional(),
  color: z.string().optional(),
  priceMin: z.string().optional(),
  priceMax: z.string().optional(),
  yearMin: z.string().optional(),
  yearMax: z.string().optional(),
  mileageMin: z.string().optional(),
  mileageMax: z.string().optional(),
  status: z.string().optional(),
});
