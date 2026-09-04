import { Types } from "mongoose";
import { env, isProd } from "../../config/env.js";
import { WelcomeTemplate } from "../../emails/welcome.js";
import { PasswordResetTemplate } from "../../emails/password-reset.js";
import { sendEmail } from "../../emails/send.js";
import { VerifyEmailTemplate } from "../../emails/verify-email.js";
import { ApiError } from "../../lib/apiError.js";
import {
  hashToken,
  randomDigits,
  signAccessToken,
  signRefreshToken,
  ttlToMs,
  verifyRefreshToken,
} from "../../lib/jwt.js";
import { comparePassword, hashPassword } from "../../lib/password.js";
import { normalizePhone } from "../../lib/phone.js";
import { RefreshToken } from "../../models/refresh-token.model.js";
import { User } from "../../models/user.model.js";
import type { UserRole } from "../../types/roles.js";
import type { CountryCode } from "libphonenumber-js";

const VERIFY_TTL_MS = 15 * 60 * 1000;
const RESET_TTL_MS = 30 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

function publicUser(user: {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  phoneCountry: string;
  role: UserRole;
  status: string;
  emailVerifiedAt?: Date | null;
  createdAt?: Date;
}) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    phoneCountry: user.phoneCountry,
    role: user.role,
    status: user.status,
    emailVerified: Boolean(user.emailVerifiedAt),
  };
}

async function issueTokens(user: {
  _id: Types.ObjectId;
  role: UserRole;
  emailVerifiedAt?: Date | null;
}) {
  const accessToken = signAccessToken({
    sub: String(user._id),
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt),
  });
  const refreshToken = signRefreshToken(String(user._id));
  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + ttlToMs(env.JWT_REFRESH_TTL)),
  });
  return { accessToken, refreshToken };
}

async function sendVerifyCode(user: {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  emailVerifySentAt?: Date | null;
}) {
  const lastSent = user.emailVerifySentAt ? new Date(user.emailVerifySentAt).getTime() : 0;
  if (Date.now() - lastSent < RESEND_COOLDOWN_MS) {
    throw ApiError.badRequest("Wait a minute before requesting another code.", "COOLDOWN");
  }

  const code = randomDigits(6);
  await User.findByIdAndUpdate(user._id, {
    emailVerifyCodeHash: hashToken(code),
    emailVerifyExpiresAt: new Date(Date.now() + VERIFY_TTL_MS),
    emailVerifySentAt: new Date(),
  });

  if (!isProd) {
    console.info(`[verify-code] ${user.email} ${code}`);
  }

  await sendEmail(user.email, "Your verification code", VerifyEmailTemplate({ name: user.fullName, code }));
}

export async function registerUser(input: {
  fullName: string;
  email: string;
  phone: string;
  phoneCountry?: string;
  password: string;
  role: "buyer" | "seller";
}) {
  const email = input.email.toLowerCase().trim();
  const { e164, country } = normalizePhone(input.phone, (input.phoneCountry as CountryCode) || "US");

  const existing = await User.findOne({ $or: [{ email }, { phone: e164 }] });
  if (existing) {
    throw ApiError.conflict("An account with this email or phone already exists.");
  }

  const user = await User.create({
    fullName: input.fullName.trim(),
    email,
    phone: e164,
    phoneCountry: country,
    passwordHash: await hashPassword(input.password),
    role: input.role,
    status: "active",
  });

  await sendVerifyCode(user);
  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens, needsVerification: true };
}

export async function loginUser(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+passwordHash +emailVerifySentAt",
  );
  if (!user) throw ApiError.unauthorized("Invalid email or password.");
  if (user.status !== "active") throw ApiError.forbidden("This account is suspended.");

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) throw ApiError.unauthorized("Invalid email or password.");

  const tokens = await issueTokens(user);
  return {
    user: publicUser(user),
    ...tokens,
    needsVerification: !user.emailVerifiedAt,
  };
}

export async function logoutUser(refreshToken?: string) {
  if (refreshToken) {
    await RefreshToken.deleteOne({ tokenHash: hashToken(refreshToken) });
  }
}

export async function refreshSession(refreshToken: string) {
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized();
  }

  const stored = await RefreshToken.findOne({ tokenHash: hashToken(refreshToken) });
  if (!stored) throw ApiError.unauthorized();

  await stored.deleteOne();
  const user = await User.findById(payload.sub);
  if (!user || user.status !== "active") throw ApiError.unauthorized();

  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens };
}

export async function getMe(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found.");
  return publicUser(user);
}

export async function updateMe(
  userId: string,
  input: { fullName?: string; phone?: string; phoneCountry?: string; role?: "seller" },
) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found.");

  if (input.fullName) user.fullName = input.fullName;
  if (input.phone) {
    const { e164, country } = normalizePhone(input.phone, (input.phoneCountry as CountryCode) || "US");
    user.phone = e164;
    user.phoneCountry = country;
  }
  if (input.role === "seller" && user.role === "buyer") {
    user.role = "seller";
  }
  await user.save();
  return publicUser(user);
}

export async function verifyEmail(userId: string | undefined, code: string, email?: string) {
  const user = userId
    ? await User.findById(userId).select("+emailVerifyCodeHash +emailVerifyExpiresAt")
    : await User.findOne({ email: email?.toLowerCase() }).select("+emailVerifyCodeHash +emailVerifyExpiresAt");

  if (!user) throw ApiError.notFound("Account not found.");
  if (user.emailVerifiedAt) return publicUser(user);

  if (
    !user.emailVerifyCodeHash ||
    !user.emailVerifyExpiresAt ||
    user.emailVerifyExpiresAt.getTime() < Date.now() ||
    user.emailVerifyCodeHash !== hashToken(code)
  ) {
    throw ApiError.badRequest("Invalid or expired code.", "INVALID_CODE");
  }

  user.emailVerifiedAt = new Date();
  user.emailVerifyCodeHash = null;
  user.emailVerifyExpiresAt = null;
  await user.save();

  await sendEmail(user.email, "Welcome to SoCal Truck Trade", WelcomeTemplate({ name: user.fullName, role: user.role }));
  return publicUser(user);
}

export async function resendVerification(userId?: string, email?: string) {
  const user = userId
    ? await User.findById(userId).select("+emailVerifySentAt")
    : await User.findOne({ email: email?.toLowerCase() }).select("+emailVerifySentAt");
  if (!user) throw ApiError.notFound("Account not found.");
  if (user.emailVerifiedAt) return;
  await sendVerifyCode(user);
}

export async function forgotPassword(email: string) {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return;

  const code = randomDigits(6);
  user.passwordResetCodeHash = hashToken(code);
  user.passwordResetExpiresAt = new Date(Date.now() + RESET_TTL_MS);
  await user.save();

  if (!isProd) {
    console.info(`[reset-code] ${user.email} ${code}`);
  }

  await sendEmail(user.email, "Reset your password", PasswordResetTemplate({ name: user.fullName, code }));
}

export async function resetPassword(email: string, code: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+passwordResetCodeHash +passwordResetExpiresAt",
  );
  if (
    !user ||
    !user.passwordResetCodeHash ||
    !user.passwordResetExpiresAt ||
    user.passwordResetExpiresAt.getTime() < Date.now() ||
    user.passwordResetCodeHash !== hashToken(code)
  ) {
    throw ApiError.badRequest("Invalid or expired reset code.", "INVALID_CODE");
  }

  user.passwordHash = await hashPassword(password);
  user.passwordResetCodeHash = null;
  user.passwordResetExpiresAt = null;
  await user.save();
  await RefreshToken.deleteMany({ user: user._id });
}

export { publicUser, issueTokens };
