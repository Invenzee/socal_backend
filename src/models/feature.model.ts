import { model } from "mongoose";
import { createTaxonomySchema } from "./taxonomy.factory.js";

export const Feature = model("Feature", createTaxonomySchema());
