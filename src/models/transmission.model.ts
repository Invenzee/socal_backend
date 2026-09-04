import { model } from "mongoose";
import { createTaxonomySchema } from "./taxonomy.factory.js";

export const Transmission = model("Transmission", createTaxonomySchema());
