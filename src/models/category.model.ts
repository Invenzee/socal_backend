import { model } from "mongoose";
import { createTaxonomySchema } from "./taxonomy.factory.js";

export const Category = model("Category", createTaxonomySchema());
