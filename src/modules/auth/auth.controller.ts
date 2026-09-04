import type { Request, Response } from "express";
import { REFRESH_COOKIE, clearAuthCookies, setAuthCookies } from "../../lib/cookies.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import {
  forgotPassword,
  getMe,
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
  resendVerification,
  resetPassword,
  setMode,
  updateMe,
  verifyEmail,
} from "./auth.service.js";

export const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  res.status(201).json({
    success: true,
    data: { user: result.user, needsVerification: result.needsVerification },
  });
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body.email, req.body.password);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  res.json({
    success: true,
    data: { user: result.user, needsVerification: result.needsVerification },
  });
});

export const logout = asyncHandler(async (req, res) => {
  await logoutUser(req.cookies?.[REFRESH_COOKIE]);
  clearAuthCookies(res);
  res.json({ success: true, data: { ok: true } });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!token) {
    res.status(401).json({ success: false, error: { message: "Please sign in.", code: "UNAUTHORIZED" } });
    return;
  }
  const result = await refreshSession(token);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  res.json({ success: true, data: { user: result.user } });
});

export const me = asyncHandler(async (req, res) => {
  const user = await getMe(req.user!.id);
  res.json({ success: true, data: { user } });
});

export const patchMe = asyncHandler(async (req, res) => {
  const user = await updateMe(req.user!.id, req.body);
  res.json({ success: true, data: { user } });
});

export const patchMode = asyncHandler(async (req, res) => {
  const user = await setMode(req.user!.id, req.body.mode);
  res.json({ success: true, data: { user } });
});

export const verify = asyncHandler(async (req, res) => {
  const user = await verifyEmail(req.user?.id, req.body.code, req.body.email);
  res.json({ success: true, data: { user } });
});

export const resend = asyncHandler(async (req: Request, res: Response) => {
  await resendVerification(req.user?.id, req.body.email);
  res.json({ success: true, data: { ok: true } });
});

export const forgot = asyncHandler(async (req, res) => {
  await forgotPassword(req.body.email);
  res.json({ success: true, data: { ok: true } });
});

export const reset = asyncHandler(async (req, res) => {
  await resetPassword(req.body.email, req.body.code, req.body.password);
  res.json({ success: true, data: { ok: true } });
});
