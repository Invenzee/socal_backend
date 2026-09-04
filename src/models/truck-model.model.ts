import { Schema, model, type Types } from "mongoose";

const truckModelSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    make: { type: Schema.Types.ObjectId, ref: "Make", required: true, index: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

truckModelSchema.index({ make: 1, slug: 1 }, { unique: true });
truckModelSchema.index({ isActive: 1, sortOrder: 1, name: 1 });

truckModelSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret: Record<string, unknown>) {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

export type TruckModelDoc = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  make: Types.ObjectId;
  isActive: boolean;
  sortOrder: number;
};

export const TruckModel = model("TruckModel", truckModelSchema);
