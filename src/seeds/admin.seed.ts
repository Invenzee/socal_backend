import { env } from "../config/env.js";
import { INFO_ADMIN_EMAIL } from "../emails/send.js";
import { hashPassword } from "../lib/password.js";
import { normalizePhone } from "../lib/phone.js";
import { User } from "../models/user.model.js";

const INFO_ADMIN_NAME = "SoCal Truck Trade";
const INFO_ADMIN_PASSWORD = "SocalTruckTrade@123";
const INFO_ADMIN_PHONE = "+13109629113";

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
    $or: [{ email }, { phone }, { role: "admin", email: { $ne: INFO_ADMIN_EMAIL } }],
  });

  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);

  if (existing) {
    existing.fullName = env.ADMIN_NAME;
    existing.email = email;
    existing.phone = phone;
    existing.phoneCountry = "US";
    existing.passwordHash = passwordHash;
    existing.role = "admin";
    existing.originalRole = "admin";
    existing.currentMode = "buyer";
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
    originalRole: "admin",
    currentMode: "buyer",
    status: "active",
    emailVerifiedAt: new Date(),
  });
  console.log(`Admin created: ${email}`);
}

export async function seedInfoAdmin() {
  const email = INFO_ADMIN_EMAIL;
  const passwordHash = await hashPassword(INFO_ADMIN_PASSWORD);
  const existing = await User.findOne({ email });

  if (existing) {
    existing.fullName = existing.fullName || INFO_ADMIN_NAME;
    existing.role = "admin";
    existing.originalRole = "admin";
    existing.currentMode = "buyer";
    existing.status = "active";
    existing.passwordHash = passwordHash;
    existing.emailVerifiedAt = existing.emailVerifiedAt || new Date();
    await existing.save();
    console.log(`Admin updated: ${email}`);
    return;
  }

  let phone = INFO_ADMIN_PHONE;
  const phoneTaken = await User.findOne({ phone });
  if (phoneTaken) phone = "+13105550199";
  const fallbackTaken = phone !== INFO_ADMIN_PHONE && (await User.findOne({ phone }));
  if (fallbackTaken) {
    console.warn(`Skipping ${email}: both phone numbers are already in use.`);
    return;
  }

  await User.create({
    fullName: INFO_ADMIN_NAME,
    email,
    phone,
    phoneCountry: "US",
    passwordHash,
    role: "admin",
    originalRole: "admin",
    currentMode: "buyer",
    status: "active",
    emailVerifiedAt: new Date(),
  });
  console.log(`Admin created: ${email}`);
}
