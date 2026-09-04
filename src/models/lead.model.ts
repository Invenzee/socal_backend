import { Schema, model } from "mongoose";

const leadSchema = new Schema(
  {
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true, index: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["phone", "chat"], required: true },
  },
  { timestamps: true },
);

leadSchema.index({ listing: 1, buyer: 1, type: 1 });

leadSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret: Record<string, unknown>) {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

export const Lead = model("Lead", leadSchema);
