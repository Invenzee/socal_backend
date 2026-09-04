import type { CookieOptions } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: import("../types/roles.js").UserRole;
        emailVerified: boolean;
        canSell: boolean;
        canBuy: boolean;
      };
    }
  }
}

export type CookieConfig = CookieOptions;
