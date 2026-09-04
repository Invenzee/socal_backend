import { env } from "../config/env.js";
import { hashPassword } from "../lib/password.js";
import { normalizePhone } from "../lib/phone.js";
import { User } from "../models/user.model.js";

export async function seedAdmin() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    console.warn("Skipping admin seed: ADMIN_EMAIL or ADMIN_PASSWORD is empty.");
    return;
  }

  const email = env.ADMIN_EMAIL.toLowerCase().trim();
  let phone = "+14155552671";
  if (env.ADMIN_PHONE) {
    try {
      phone = normalizePhone(env.ADMIN_PHONE).e164;
    } catch {
      console.warn("ADMIN_PHONE is invalid; using a placeholder US number.");
    }
  }

  const existing = await User.findOne({
    $or: [{ email }, { phone }, { role: "admin" }],
  });

  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);

  if (existing) {
    existing.fullName = env.ADMIN_NAME;
    existing.email = email;
    existing.phone = phone;
    existing.phoneCountry = "US";
    existing.passwordHash = passwordHash;
    existing.role = "admin";
    existing.status = "active";
    existing.emailVerifiedAt = new Date();
    await existing.save();
    console.log(`Admin updated: ${email}`);
    return;
  }

  await User.create({
    fullName: env.ADMIN_NAME,
    email,
    phone,
    phoneCountry: "US",
    passwordHash,
    role: "admin",
    status: "active",
    emailVerifiedAt: new Date(),
  });
  console.log(`Admin created: ${email}`);
}
