import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { globalLimiter } from "./middleware/rateLimit.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { taxonomyRouter } from "./modules/taxonomy/taxonomy.routes.js";
import { listingsRouter } from "./modules/listings/listings.routes.js";
import { uploadsRouter } from "./modules/uploads/uploads.routes.js";
import { favoritesRouter } from "./modules/favorites/favorites.routes.js";
import { chatRouter } from "./modules/chat/chat.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(globalLimiter);

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  const api = express.Router();
  api.use("/auth", authRouter);
  api.use("/taxonomy", taxonomyRouter);
  api.use("/listings", listingsRouter);
  api.use("/uploads", uploadsRouter);
  api.use("/favorites", favoritesRouter);
  api.use("/conversations", chatRouter);
  api.use("/admin", adminRouter);

  app.use(env.API_PREFIX, api);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
