import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.email(),
  phone: z.string().min(6),
  phoneCountry: z.string().length(2).optional(),
  password: z.string().min(8).max(72),
  role: z.enum(["buyer", "seller"]),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const verifyEmailSchema = z.object({
  code: z.string().regex(/^\d{6}$/),
  email: z.email().optional(),
});

export const emailOnlySchema = z.object({
  email: z.email(),
});

export const resetPasswordSchema = z.object({
  email: z.email(),
  code: z.string().regex(/^\d{6}$/),
  password: z.string().min(8).max(72),
});

export const updateMeSchema = z.object({
  fullName: z.string().trim().min(2).max(80).optional(),
  phone: z.string().min(6).optional(),
  phoneCountry: z.string().length(2).optional(),
});

export const setModeSchema = z.object({
  mode: z.enum(["buyer", "seller"]),
});
