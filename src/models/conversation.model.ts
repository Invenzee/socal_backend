import { Schema, model } from "mongoose";

const conversationSchema = new Schema(
  {
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true, index: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessagePreview: { type: String, default: "" },
    buyerUnread: { type: Number, default: 0 },
    sellerUnread: { type: Number, default: 0 },
  },
  { timestamps: true },
);

conversationSchema.index({ listing: 1, buyer: 1 }, { unique: true });

conversationSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret: Record<string, unknown>) {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

export const Conversation = model("Conversation", conversationSchema);
