import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { ApiError } from "../../lib/apiError.js";
import { authenticate, requireVerified } from "../../middleware/authenticate.js";
import { Favorite } from "../../models/favorite.model.js";
import { Listing } from "../../models/listing.model.js";
import { param } from "../../lib/param.js";

export const favoritesRouter = Router();

favoritesRouter.use(authenticate, requireVerified);

favoritesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const items = await Favorite.find({ user: req.user!.id })
      .sort({ createdAt: -1 })
      .populate({
        path: "listing",
        populate: [
          { path: "make", select: "name slug" },
          { path: "fuel", select: "name slug" },
          { path: "category", select: "name slug" },
        ],
      });
    res.json({ success: true, data: { items } });
  }),
);

favoritesRouter.post(
  "/:listingId",
  asyncHandler(async (req, res) => {
    const listing = await Listing.findById(param(req.params.listingId));
    if (!listing || listing.status !== "approved") throw ApiError.notFound("Listing not found.");
    const item = await Favorite.findOneAndUpdate(
      { user: req.user!.id, listing: listing._id },
      { user: req.user!.id, listing: listing._id },
      { upsert: true, new: true },
    );
    res.status(201).json({ success: true, data: { item } });
  }),
);

favoritesRouter.delete(
  "/:listingId",
  asyncHandler(async (req, res) => {
    await Favorite.deleteOne({ user: req.user!.id, listing: param(req.params.listingId) });
    res.json({ success: true, data: { ok: true } });
  }),
);
