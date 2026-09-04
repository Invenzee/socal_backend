import { Schema, model, type Types } from "mongoose";
import { USER_ROLES, USER_STATUSES, type UserRole, type UserStatus } from "../types/roles.js";

const userSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    phoneCountry: { type: String, required: true, default: "US" },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, required: true },
    status: { type: String, enum: USER_STATUSES, default: "active" },
    emailVerifiedAt: { type: Date, default: null },
    emailVerifyCodeHash: { type: String, default: null, select: false },
    emailVerifyExpiresAt: { type: Date, default: null, select: false },
    emailVerifySentAt: { type: Date, default: null, select: false },
    passwordResetCodeHash: { type: String, default: null, select: false },
    passwordResetExpiresAt: { type: Date, default: null, select: false },
  },
  { timestamps: true },
);

userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret: Record<string, unknown>) {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.passwordHash;
    delete ret.emailVerifyCodeHash;
    delete ret.passwordResetCodeHash;
    return ret;
  },
});

export type UserDoc = {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  phoneCountry: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt: Date | null;
};

export const User = model("User", userSchema);
