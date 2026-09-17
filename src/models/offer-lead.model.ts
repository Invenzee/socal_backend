import { Schema, model } from "mongoose";
import { OFFER_STATUSES } from "../types/offers.js";

const offerLeadSchema = new Schema(
  {
    guestId: { type: String, required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    claimedAt: { type: Date, default: null },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true },
    phoneCountry: { type: String, required: true, default: "US" },
    licensePlate: { type: String, required: true, trim: true, uppercase: true, index: true },
    year: { type: Number, required: true, min: 1950, max: 2100 },
    make: { type: Schema.Types.ObjectId, ref: "Make", required: true },
    model: { type: Schema.Types.ObjectId, ref: "TruckModel", required: true },
    mileage: { type: Number, required: true, min: 0 },
    condition: { type: Schema.Types.ObjectId, ref: "Condition", required: true },
    city: { type: String, required: true, trim: true },
    zip: { type: String, required: true, trim: true },
    status: { type: String, enum: OFFER_STATUSES, default: "new", index: true },
    offerPrice: { type: Number, default: null },
    offerMessage: { type: String, default: "" },
    offeredAt: { type: Date, default: null },
  },
  { timestamps: true },
);

offerLeadSchema.index({ createdAt: -1 });
offerLeadSchema.index({ email: 1, createdAt: -1 });
offerLeadSchema.index({ guestId: 1, createdAt: -1 });

offerLeadSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret: Record<string, unknown>) {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

export const OfferLead = model("OfferLead", offerLeadSchema);
