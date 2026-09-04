import { Router } from "express";
import { authenticate, optionalAuth, requireCapability, requireVerified } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/error.js";
import * as ctrl from "./listings.controller.js";
import { listingBodySchema } from "./listings.validators.js";

export const listingsRouter = Router();

listingsRouter.get("/", ctrl.publicIndex);
listingsRouter.get("/mine", authenticate, requireCapability("sell"), ctrl.mine);
listingsRouter.get("/leads", authenticate, requireCapability("sell"), ctrl.sellerLeads);
listingsRouter.get("/:id", optionalAuth, ctrl.publicShow);
listingsRouter.post(
  "/",
  authenticate,
  requireCapability("sell"),
  requireVerified,
  validate(listingBodySchema),
  ctrl.create,
);
listingsRouter.patch(
  "/:id",
  authenticate,
  requireCapability("sell"),
  requireVerified,
  validate(listingBodySchema.partial()),
  ctrl.update,
);
listingsRouter.delete("/:id", authenticate, requireCapability("sell"), ctrl.remove);
listingsRouter.post("/:id/reveal-phone", authenticate, requireVerified, ctrl.reveal);
