import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { z } from "zod";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

loadEnv({ path: path.join(root, ".env.local") });
loadEnv({ path: path.join(root, ".env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  API_PREFIX: z.string().default("/api/v1"),
  CLIENT_ORIGIN: z.string().default("http://localhost:3000"),
  APP_URL: z.string().default("http://localhost:3000"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_ACCESS_SECRET: z.string().optional().default(""),
  JWT_REFRESH_SECRET: z.string().optional().default(""),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("30d"),
  COOKIE_DOMAIN: z.string().optional().default(""),
  COOKIE_SECURE: z
    .string()
    .optional()
    .default("false")
    .transform((value) => value === "true"),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  ADMIN_NAME: z.string().default("Site Admin"),
  ADMIN_EMAIL: z.string().optional().default(""),
  ADMIN_PASSWORD: z.string().optional().default(""),
  ADMIN_PHONE: z.string().optional().default(""),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
  CLOUDINARY_API_KEY: z.string().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().optional().default(""),
  CLOUDINARY_UPLOAD_FOLDER: z.string().default("socaltrucktrade"),
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  MAIL_FROM: z.string().default("SoCal Truck Trade <safdar.invenzee@gmail.com>"),
  MAIL_REPLY_TO: z.string().optional().default(""),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

if (parsed.data.NODE_ENV === "production") {
  if (!parsed.data.JWT_ACCESS_SECRET || !parsed.data.JWT_REFRESH_SECRET) {
    console.error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required in production.");
    process.exit(1);
  }
} else {
  if (!parsed.data.JWT_ACCESS_SECRET) {
    parsed.data.JWT_ACCESS_SECRET = "dev-access-secret-change-me!!";
  }
  if (!parsed.data.JWT_REFRESH_SECRET) {
    parsed.data.JWT_REFRESH_SECRET = "dev-refresh-secret-change-me!";
  }
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
