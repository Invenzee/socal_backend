import { model } from "mongoose";
import { createTaxonomySchema } from "./taxonomy.factory.js";

export const Condition = model("Condition", createTaxonomySchema());
