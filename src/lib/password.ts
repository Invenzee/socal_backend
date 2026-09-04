import bcrypt from "bcrypt";
import { env } from "../config/env.js";

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, env.BCRYPT_ROUNDS);
}

export function comparePassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}
