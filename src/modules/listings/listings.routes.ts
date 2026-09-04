import { Router } from "express";
import { authenticate, optionalAuth, requireRole, requireVerified } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/error.js";
import * as ctrl from "./listings.controller.js";
import { listingBodySchema } from "./listings.validators.js";

export const listingsRouter = Router();

listingsRouter.get("/", ctrl.publicIndex);
listingsRouter.get("/mine", authenticate, requireRole("seller", "admin"), ctrl.mine);
listingsRouter.get("/leads", authenticate, requireRole("seller", "admin"), ctrl.sellerLeads);
listingsRouter.get("/:id", optionalAuth, ctrl.publicShow);
listingsRouter.post(
  "/",
  authenticate,
  requireRole("seller", "admin"),
  requireVerified,
  validate(listingBodySchema),
  ctrl.create,
);
listingsRouter.patch(
  "/:id",
  authenticate,
  requireRole("seller", "admin"),
  requireVerified,
  validate(listingBodySchema.partial()),
  ctrl.update,
);
listingsRouter.delete("/:id", authenticate, requireRole("seller", "admin"), ctrl.remove);
listingsRouter.post("/:id/reveal-phone", authenticate, requireVerified, ctrl.reveal);
