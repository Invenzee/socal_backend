import { Router } from "express";
import type { Model } from "mongoose";
import { z } from "zod";
import { authenticate, requireRole } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/error.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { ApiError } from "../../lib/apiError.js";
import { slugify } from "../../lib/slug.js";
import { param } from "../../lib/param.js";

const upsertSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  make: z.string().optional(),
});

const patchSchema = upsertSchema.partial();

type TaxonomyDoc = {
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
};

export function createTaxonomyRouter(
  Model: Model<TaxonomyDoc>,
  options: { parentField?: string } = {},
) {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const includeInactive = req.query.includeInactive === "true";
      const filter: Record<string, unknown> = includeInactive ? {} : { isActive: true };
      if (options.parentField && req.query.make) {
        filter[options.parentField] = req.query.make;
      }
      const items = await Model.find(filter).sort({ sortOrder: 1, name: 1 });
      res.json({ success: true, data: { items } });
    }),
  );

  router.post(
    "/",
    authenticate,
    requireRole("admin"),
    validate(upsertSchema),
    asyncHandler(async (req, res) => {
      const slug = slugify(req.body.slug || req.body.name);
      const doc = await Model.create({
        name: req.body.name,
        slug,
        isActive: req.body.isActive ?? true,
        sortOrder: req.body.sortOrder ?? 0,
        ...(options.parentField && req.body.make ? { [options.parentField]: req.body.make } : {}),
      });
      res.status(201).json({ success: true, data: { item: doc } });
    }),
  );

  router.patch(
    "/:id",
    authenticate,
    requireRole("admin"),
    validate(patchSchema),
    asyncHandler(async (req, res) => {
      const item = await Model.findById(param(req.params.id));
      if (!item) throw ApiError.notFound("Option not found.");
      if (req.body.name) item.name = req.body.name;
      if (req.body.slug || req.body.name) item.slug = slugify(req.body.slug || req.body.name);
      if (typeof req.body.isActive === "boolean") item.isActive = req.body.isActive;
      if (typeof req.body.sortOrder === "number") item.sortOrder = req.body.sortOrder;
      if (options.parentField && req.body.make) {
        (item as unknown as Record<string, unknown>)[options.parentField] = req.body.make;
      }
      await item.save();
      res.json({ success: true, data: { item } });
    }),
  );

  router.delete(
    "/:id",
    authenticate,
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const item = await Model.findById(param(req.params.id));
      if (!item) throw ApiError.notFound("Option not found.");
      item.isActive = false;
      await item.save();
      res.json({ success: true, data: { item } });
    }),
  );

  return router;
}
