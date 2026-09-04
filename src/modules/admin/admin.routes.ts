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
import { paginationMeta, parsePagination } from "../../lib/paginate.js";
import { USER_ROLES, USER_STATUSES } from "../../types/roles.js";

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
    const seller = listing.seller as unknown as { email: string; fullName: string };
    await sendEmail(
      seller.email,
      "Your listing is live",
      ListingApprovedTemplate({
        name: seller.fullName,
        title: listing.title,
        url: `${env.APP_URL}/listings/${String(listing._id)}`,
      }),
    );
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
    const seller = listing.seller as unknown as { email: string; fullName: string };
    await sendEmail(
      seller.email,
      "Your listing was not approved",
      ListingRejectedTemplate({
        name: seller.fullName,
        title: listing.title,
        reason: req.body.reason,
      }),
    );
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
