import { model } from "mongoose";
import { createTaxonomySchema } from "./taxonomy.factory.js";

export const Make = model("Make", createTaxonomySchema());
