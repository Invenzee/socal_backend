import { Router } from "express";
import { Category } from "../../models/category.model.js";
import { Condition } from "../../models/condition.model.js";
import { Feature } from "../../models/feature.model.js";
import { FuelType } from "../../models/fuel-type.model.js";
import { Make } from "../../models/make.model.js";
import { Transmission } from "../../models/transmission.model.js";
import { TruckModel } from "../../models/truck-model.model.js";
import { createTaxonomyRouter } from "./taxonomy.router-factory.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { param } from "../../lib/param.js";

export const taxonomyRouter = Router();

taxonomyRouter.use("/makes", createTaxonomyRouter(Make as never));
taxonomyRouter.use("/models", createTaxonomyRouter(TruckModel as never, { parentField: "make" }));
taxonomyRouter.use("/features", createTaxonomyRouter(Feature as never));
taxonomyRouter.use("/conditions", createTaxonomyRouter(Condition as never));
taxonomyRouter.use("/categories", createTaxonomyRouter(Category as never));
taxonomyRouter.use("/fuels", createTaxonomyRouter(FuelType as never));
taxonomyRouter.use("/transmissions", createTaxonomyRouter(Transmission as never));

taxonomyRouter.get(
  "/makes/:id/models",
  asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === "true";
    const filter: Record<string, unknown> = { make: param(req.params.id) };
    if (!includeInactive) filter.isActive = true;
    const items = await TruckModel.find(filter).sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, data: { items } });
  }),
);

taxonomyRouter.get(
  "/all",
  asyncHandler(async (_req, res) => {
    const [makes, features, conditions, categories, fuels, transmissions] = await Promise.all([
      Make.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }),
      Feature.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }),
      Condition.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }),
      Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }),
      FuelType.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }),
      Transmission.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }),
    ]);
    res.json({
      success: true,
      data: { makes, features, conditions, categories, fuels, transmissions },
    });
  }),
);
