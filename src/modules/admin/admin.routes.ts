import { Router } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/error.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { param } from "../../lib/param.js";
import { ApiError } from "../../lib/apiError.js";
import { env } from "../../config/env.js";
import { sendEmail } from "../../emails/send.js";
import { ListingApprovedTemplate } from "../../emails/listing-approved.js";
import { ListingRejectedTemplate } from "../../emails/listing-rejected.js";
import { listAdmin, setListingStatus } from "../listings/listings.service.js";
import { User } from "../../models/user.model.js";
import { Listing } from "../../models/listing.model.js";
import { Lead } from "../../models/lead.model.js";
import { Conversation } from "../../models/conversation.model.js";
import { Message } from "../../models/message.model.js";
import { Favorite } from "../../models/favorite.model.js";
import { RefreshToken } from "../../models/refresh-token.model.js";
import { paginationMeta, parsePagination } from "../../lib/paginate.js";
import { USER_ROLES, USER_STATUSES } from "../../types/roles.js";
import { OFFER_STATUSES } from "../../types/offers.js";
import { isStaff } from "../../lib/user-mode.js";
import { OfferLead } from "../../models/offer-lead.model.js";
import { OfferPriceTemplate } from "../../emails/offer-price.js";

export const adminRouter = Router();
adminRouter.use(authenticate, requireRole("admin"));

adminRouter.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const [users, listings, pending, approved, leads, conversations] = await Promise.all([
      User.countDocuments(),
      Listing.countDocuments(),
      Listing.countDocuments({ status: "pending" }),
      Listing.countDocuments({ status: "approved" }),
      Lead.countDocuments(),
      Conversation.countDocuments(),
    ]);
    res.json({
      success: true,
      data: { users, listings, pending, approved, leads, conversations },
    });
  }),
);

adminRouter.get(
  "/listings",
  asyncHandler(async (req, res) => {
    const data = await listAdmin(req.query as Record<string, unknown>);
    res.json({ success: true, data });
  }),
);

adminRouter.post(
  "/listings/:id/approve",
  asyncHandler(async (req, res) => {
    const listing = await setListingStatus(param(req.params.id), "approved");
    const seller = listing.seller as unknown as { email?: string; fullName?: string } | null;
    const email = seller?.email || listing.guestEmail;
    const name = seller?.fullName || listing.guestName || "there";
    if (email) {
      await sendEmail(
        email,
        "Your listing is live",
        ListingApprovedTemplate({
          name,
          title: listing.title,
          url: `${env.APP_URL}/listings/${String(listing._id)}`,
        }),
      );
    }
    res.json({ success: true, data: { item: listing } });
  }),
);

const rejectSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

adminRouter.post(
  "/listings/:id/reject",
  validate(rejectSchema),
  asyncHandler(async (req, res) => {
    const listing = await setListingStatus(param(req.params.id), "rejected", req.body.reason);
    const seller = listing.seller as unknown as { email?: string; fullName?: string } | null;
    const email = seller?.email || listing.guestEmail;
    const name = seller?.fullName || listing.guestName || "there";
    if (email) {
      await sendEmail(
        email,
        "Your listing was not approved",
        ListingRejectedTemplate({
          name,
          title: listing.title,
          reason: req.body.reason,
        }),
      );
    }
    res.json({ success: true, data: { item: listing } });
  }),
);

adminRouter.get(
  "/users",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const filter: Record<string, unknown> = {};
    if (req.query.role) filter.originalRole = req.query.role;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.q) {
      filter.$or = [
        { fullName: new RegExp(String(req.query.q), "i") },
        { email: new RegExp(String(req.query.q), "i") },
      ];
    }
    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, data: { items, meta: paginationMeta(total, page, limit) } });
  }),
);

const userPatchSchema = z.object({
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(USER_STATUSES).optional(),
});

adminRouter.patch(
  "/users/:id",
  validate(userPatchSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findById(param(req.params.id));
    if (!user) throw ApiError.notFound("User not found.");
    if (user.role === "admin" && req.body.status === "suspended") {
      throw ApiError.badRequest("Cannot suspend the admin account.");
    }
    if (req.body.role) {
      user.role = req.body.role;
      if (req.body.role === "admin") {
        user.originalRole = "admin";
        user.currentMode = "buyer";
      } else {
        user.currentMode = req.body.role;
        if (req.body.role === "seller" && !user.sellerEnabledAt) {
          user.sellerEnabledAt = new Date();
        }
      }
    }
    if (req.body.status) user.status = req.body.status;
    await user.save();
    res.json({ success: true, data: { item: user } });
  }),
);

adminRouter.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await User.findById(param(req.params.id));
    if (!user) throw ApiError.notFound("User not found.");
    if (String(user._id) === req.user!.id) {
      throw ApiError.badRequest("You cannot delete your own account.");
    }
    if (isStaff(user)) {
      throw ApiError.badRequest("Cannot delete an admin account.");
    }

    const listingIds = await Listing.find({ seller: user._id }).distinct("_id");
    const conversationIds = await Conversation.find({
      $or: [{ buyer: user._id }, { seller: user._id }, { listing: { $in: listingIds } }],
    }).distinct("_id");

    await Message.deleteMany({ conversation: { $in: conversationIds } });
    await Conversation.deleteMany({ _id: { $in: conversationIds } });
    await Lead.deleteMany({
      $or: [{ buyer: user._id }, { seller: user._id }, { listing: { $in: listingIds } }],
    });
    await Favorite.deleteMany({
      $or: [{ user: user._id }, { listing: { $in: listingIds } }],
    });
    await Listing.deleteMany({ seller: user._id });
    await RefreshToken.deleteMany({ user: user._id });
    await user.deleteOne();

    res.json({ success: true, data: { deleted: true } });
  }),
);

adminRouter.get(
  "/leads",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const [items, total] = await Promise.all([
      Lead.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("listing", "title")
        .populate("buyer", "fullName email phone")
        .populate("seller", "fullName email"),
      Lead.countDocuments(),
    ]);
    res.json({ success: true, data: { items, meta: paginationMeta(total, page, limit) } });
  }),
);

const OFFER_POPULATE = [
  { path: "make", select: "name" },
  { path: "model", select: "name" },
  { path: "condition", select: "name" },
] as const;

function taxonomyName(value: unknown) {
  if (value && typeof value === "object" && "name" in value) return String((value as { name: string }).name);
  return "";
}

adminRouter.get(
  "/offers",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const filter: Record<string, unknown> = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.q) {
      const term = new RegExp(String(req.query.q).trim(), "i");
      filter.$or = [{ fullName: term }, { email: term }, { phone: term }, { licensePlate: term }, { city: term }];
    }
    const [items, total] = await Promise.all([
      OfferLead.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate([...OFFER_POPULATE]),
      OfferLead.countDocuments(filter),
    ]);
    res.json({ success: true, data: { items, meta: paginationMeta(total, page, limit) } });
  }),
);

const offerPatchSchema = z.object({
  status: z.enum(OFFER_STATUSES),
});

adminRouter.patch(
  "/offers/:id",
  validate(offerPatchSchema),
  asyncHandler(async (req, res) => {
    const item = await OfferLead.findByIdAndUpdate(
      param(req.params.id),
      { status: req.body.status },
      { returnDocument: "after" },
    ).populate([...OFFER_POPULATE]);
    if (!item) throw ApiError.notFound("Offer lead not found.");
    res.json({ success: true, data: { item } });
  }),
);

const offerEmailSchema = z.object({
  price: z.coerce.number().positive(),
  message: z.string().trim().max(2000).optional().default(""),
});

adminRouter.post(
  "/offers/:id/email",
  validate(offerEmailSchema),
  asyncHandler(async (req, res) => {
    const item = await OfferLead.findById(param(req.params.id)).populate([...OFFER_POPULATE]);
    if (!item) throw ApiError.notFound("Offer lead not found.");

    const vehicle = [item.year, taxonomyName(item.make), taxonomyName(item.model)].filter(Boolean).join(" ");
    const price = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(req.body.price);

    await sendEmail(
      item.email,
      `Your offer for ${vehicle || "your truck"}`,
      OfferPriceTemplate({
        name: item.fullName,
        vehicle: vehicle || "your truck",
        price,
        message: req.body.message || undefined,
      }),
    );

    item.status = "offered";
    item.offerPrice = req.body.price;
    item.offerMessage = req.body.message || "";
    item.offeredAt = new Date();
    await item.save();

    res.json({ success: true, data: { item } });
  }),
);

adminRouter.delete(
  "/offers/:id",
  asyncHandler(async (req, res) => {
    const item = await OfferLead.findById(param(req.params.id));
    if (!item) throw ApiError.notFound("Offer lead not found.");
    await item.deleteOne();
    res.json({ success: true, data: { deleted: true } });
  }),
);
