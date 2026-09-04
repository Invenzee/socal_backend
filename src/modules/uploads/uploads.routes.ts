import { Router } from "express";
import { cloudinary, configureCloudinary } from "../../config/cloudinary.js";
import { env } from "../../config/env.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { ApiError } from "../../lib/apiError.js";
import { authenticate, requireVerified } from "../../middleware/authenticate.js";

export const uploadsRouter = Router();

uploadsRouter.post(
  "/signature",
  authenticate,
  requireVerified,
  asyncHandler(async (_req, res) => {
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
