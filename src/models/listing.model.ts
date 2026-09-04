import { Schema, model } from "mongoose";
import { LISTING_STATUSES } from "../types/roles.js";

const imageSchema = new Schema(
  {
    publicId: { type: String, required: true },
    url: { type: String, required: true },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false },
);

const listingSchema = new Schema(
  {
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    year: { type: Number, required: true, min: 1950, max: 2100 },
    mileage: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    make: { type: Schema.Types.ObjectId, ref: "Make", required: true, index: true },
    model: { type: Schema.Types.ObjectId, ref: "TruckModel", required: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    condition: { type: Schema.Types.ObjectId, ref: "Condition", required: true, index: true },
    fuel: { type: Schema.Types.ObjectId, ref: "FuelType", required: true, index: true },
    transmission: { type: Schema.Types.ObjectId, ref: "Transmission", required: true },
    features: [{ type: Schema.Types.ObjectId, ref: "Feature" }],
    exteriorColor: { type: String, trim: true, default: "" },
    interiorColor: { type: String, trim: true, default: "" },
    vin: { type: String, trim: true, default: "" },
    licensePlate: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    engine: { type: String, trim: true, default: "" },
    horsePower: { type: String, trim: true, default: "" },
    torque: { type: String, trim: true, default: "" },
    driveTrain: { type: String, trim: true, default: "" },
    doors: { type: String, trim: true, default: "" },
    seats: { type: String, trim: true, default: "" },
    topSpeed: { type: String, trim: true, default: "" },
    contactPhone: { type: String, required: true },
    status: { type: String, enum: LISTING_STATUSES, default: "pending", index: true },
    rejectionReason: { type: String, default: "" },
    images: { type: [imageSchema], default: [] },
    views: { type: Number, default: 0 },
  },
  { timestamps: true },
);

listingSchema.index({ status: 1, createdAt: -1 });
listingSchema.index({ status: 1, price: 1 });
listingSchema.index({ status: 1, year: 1 });
listingSchema.index({ status: 1, mileage: 1 });
listingSchema.index({ title: "text", description: "text" });

listingSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret: Record<string, unknown>) {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

export const Listing = model("Listing", listingSchema);
