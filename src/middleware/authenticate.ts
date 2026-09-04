import type { NextFunction, Request, Response } from "express";
import { ACCESS_COOKIE } from "../lib/cookies.js";
import { ApiError } from "../lib/apiError.js";
import { verifyAccessToken } from "../lib/jwt.js";
import { User } from "../models/user.model.js";
import type { UserRole } from "../types/roles.js";

function readAccessToken(req: Request) {
  const cookieToken = req.cookies?.[ACCESS_COOKIE] as string | undefined;
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return null;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = readAccessToken(req);
    if (!token) throw ApiError.unauthorized();

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select("role status emailVerifiedAt");
    if (!user || user.status !== "active") {
      throw ApiError.unauthorized("Account is not available.");
    }

    req.user = {
      id: String(user._id),
      role: user.role,
      emailVerified: Boolean(user.emailVerifiedAt),
    };
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }
    next(ApiError.unauthorized());
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readAccessToken(req);
  if (!token) {
    next();
    return;
  }

  void authenticate(req, _res, (err) => {
    if (err) {
      req.user = undefined;
    }
    next();
  });
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden());
      return;
    }
    next();
  };
}

export function requireVerified(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    next(ApiError.unauthorized());
    return;
  }
  if (!req.user.emailVerified) {
    next(ApiError.forbidden("Verify your email to continue.", "EMAIL_UNVERIFIED"));
    return;
  }
  next();
}
