import { model } from "mongoose";
import { createTaxonomySchema } from "./taxonomy.factory.js";

export const FuelType = model("FuelType", createTaxonomySchema());
