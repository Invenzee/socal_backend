import { Schema } from "mongoose";

export function createTaxonomySchema(extra: Record<string, unknown> = {}) {
  const schema = new Schema(
    {
      name: { type: String, required: true, trim: true },
      slug: { type: String, required: true, trim: true, lowercase: true },
      isActive: { type: Boolean, default: true },
      sortOrder: { type: Number, default: 0 },
      ...extra,
    },
    { timestamps: true },
  );

  schema.index({ slug: 1 }, { unique: true });
  schema.index({ isActive: 1, sortOrder: 1, name: 1 });

  schema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform(_doc, ret: Record<string, unknown>) {
      ret.id = String(ret._id);
      delete ret._id;
      return ret;
    },
  });

  return schema;
}
