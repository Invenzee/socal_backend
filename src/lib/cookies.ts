import type { CookieOptions, Response } from "express";
import { env, isProd } from "../config/env.js";
import { ttlToMs } from "./jwt.js";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

function baseCookie(): CookieOptions {
  const options: CookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: env.COOKIE_SECURE || isProd,
    path: "/",
  };

  if (env.COOKIE_DOMAIN && env.COOKIE_DOMAIN !== "localhost") {
    options.domain = env.COOKIE_DOMAIN;
  }

  return options;
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...baseCookie(),
    maxAge: ttlToMs(env.JWT_ACCESS_TTL),
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseCookie(),
    maxAge: ttlToMs(env.JWT_REFRESH_TTL),
  });
}

export function clearAuthCookies(res: Response) {
  const options = baseCookie();
  res.clearCookie(ACCESS_COOKIE, options);
  res.clearCookie(REFRESH_COOKIE, options);
}
