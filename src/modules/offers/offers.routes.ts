import { Router } from "express";
import type { CountryCode } from "libphonenumber-js";
import { optionalAuth } from "../../middleware/authenticate.js";
import { offerLimiter } from "../../middleware/rateLimit.js";
import { validate } from "../../middleware/error.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { ApiError } from "../../lib/apiError.js";
import { normalizePhone } from "../../lib/phone.js";
import { OfferLead } from "../../models/offer-lead.model.js";
import { Make } from "../../models/make.model.js";
import { TruckModel } from "../../models/truck-model.model.js";
import { Condition } from "../../models/condition.model.js";
import { createOfferSchema, latestOfferQuerySchema } from "./offers.validators.js";

const DUPLICATE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export const offersRouter = Router();

offersRouter.get(
  "/latest",
  offerLimiter,
  asyncHandler(async (req, res) => {
    const parsed = latestOfferQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw parsed.error;
    }
    const item = await OfferLead.findOne({ guestId: parsed.data.guestId })
      .sort({ createdAt: -1 })
      .populate([
        { path: "make", select: "name slug" },
        { path: "model", select: "name slug" },
        { path: "condition", select: "name slug" },
      ]);
    res.json({ success: true, data: { item: item || null } });
  }),
);

offersRouter.post(
  "/",
  offerLimiter,
  optionalAuth,
  validate(createOfferSchema),
  asyncHandler(async (req, res) => {
    if (req.user) {
      throw ApiError.forbidden("Guests can request an offer without an account. List the vehicle instead if you are signed in.");
    }

    const { guestId, fullName, email, phone, phoneCountry, licensePlate, year, make, model, mileage, condition, city, zip } =
      req.body as typeof req.body;

    const { e164, country } = normalizePhone(phone, (phoneCountry as CountryCode) || "US");

    const [makeDoc, modelDoc, conditionDoc] = await Promise.all([
      Make.findById(make),
      TruckModel.findById(model),
      Condition.findById(condition),
    ]);

    if (!makeDoc?.isActive) throw ApiError.badRequest("Select a valid make.");
    if (!modelDoc?.isActive || String(modelDoc.make) !== make) throw ApiError.badRequest("Select a valid model for that make.");
    if (!conditionDoc?.isActive) throw ApiError.badRequest("Select a valid condition.");

    const since = new Date(Date.now() - DUPLICATE_WINDOW_MS);
    const duplicate = await OfferLead.findOne({
      createdAt: { $gte: since },
      $or: [{ guestId }, { email: email.toLowerCase() }, { licensePlate }],
    });
    if (duplicate) {
      throw ApiError.conflict("We already have your request.", "OFFER_EXISTS");
    }

    const item = await OfferLead.create({
      guestId,
      fullName,
      email: email.toLowerCase(),
      phone: e164,
      phoneCountry: country,
      licensePlate,
      year,
      make,
      model,
      mileage,
      condition,
      city,
      zip,
    });

    res.status(201).json({ success: true, data: { item } });
  }),
);
