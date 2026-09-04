import { Router } from "express";
import { authenticate, optionalAuth } from "../../middleware/authenticate.js";
import { authLimiter } from "../../middleware/rateLimit.js";
import { validate } from "../../middleware/error.js";
import * as ctrl from "./auth.controller.js";
import {
  emailOnlySchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  setModeSchema,
  updateMeSchema,
  verifyEmailSchema,
} from "./auth.validators.js";

export const authRouter = Router();

authRouter.post("/register", authLimiter, validate(registerSchema), ctrl.register);
authRouter.post("/login", authLimiter, validate(loginSchema), ctrl.login);
authRouter.post("/logout", ctrl.logout);
authRouter.post("/refresh", ctrl.refresh);
authRouter.get("/me", authenticate, ctrl.me);
authRouter.patch("/me", authenticate, validate(updateMeSchema), ctrl.patchMe);
authRouter.patch("/mode", authenticate, validate(setModeSchema), ctrl.patchMode);
authRouter.post("/verify-email", optionalAuth, authLimiter, validate(verifyEmailSchema), ctrl.verify);
authRouter.post("/resend-verification", optionalAuth, authLimiter, validate(emailOnlySchema), ctrl.resend);
authRouter.post("/forgot-password", authLimiter, validate(emailOnlySchema), ctrl.forgot);
authRouter.post("/reset-password", authLimiter, validate(resetPasswordSchema), ctrl.reset);
