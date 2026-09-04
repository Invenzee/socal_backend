import { Schema, model } from "mongoose";

const favoriteSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true, index: true },
  },
  { timestamps: true },
);

favoriteSchema.index({ user: 1, listing: 1 }, { unique: true });

favoriteSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret: Record<string, unknown>) {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

export const Favorite = model("Favorite", favoriteSchema);
