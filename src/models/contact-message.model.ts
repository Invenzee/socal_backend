import { Schema, model } from "mongoose";

const contactMessageSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true },
    phoneCountry: { type: String, required: true, default: "US" },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

contactMessageSchema.index({ createdAt: -1 });

contactMessageSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret: Record<string, unknown>) {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

export const ContactMessage = model("ContactMessage", contactMessageSchema);
