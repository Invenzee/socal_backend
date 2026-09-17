import { Router } from "express";
import { z } from "zod";
import { cloudinary, configureCloudinary } from "../../config/cloudinary.js";
import { env } from "../../config/env.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { ApiError } from "../../lib/apiError.js";
import { isGuestId } from "../../lib/guest-id.js";
import { optionalAuth } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/error.js";
import { guestUploadLimiter } from "../../middleware/rateLimit.js";

const signatureBodySchema = z
  .object({
    guestId: z.uuid().optional(),
  })
  .default({});

export const uploadsRouter = Router();

uploadsRouter.post(
  "/signature",
  guestUploadLimiter,
  optionalAuth,
  validate(signatureBodySchema),
  asyncHandler(async (req, res) => {
    if (req.user) {
      if (!req.user.emailVerified) {
        throw ApiError.forbidden("Verify your email to continue.", "EMAIL_UNVERIFIED");
      }
    } else if (!isGuestId(req.body?.guestId)) {
      throw ApiError.unauthorized("Sign in or continue as a guest to upload photos.");
    }

    if (!configureCloudinary()) {
      throw ApiError.badRequest("Image uploads are not configured.", "CLOUDINARY");
    }
    const timestamp = Math.round(Date.now() / 1000);
    const folder = env.CLOUDINARY_UPLOAD_FOLDER;
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      env.CLOUDINARY_API_SECRET,
    );
    res.json({
      success: true,
      data: {
        timestamp,
        signature,
        cloudName: env.CLOUDINARY_CLOUD_NAME,
        apiKey: env.CLOUDINARY_API_KEY,
        folder,
      },
    });
  }),
);
