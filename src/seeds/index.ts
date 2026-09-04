import { connectDb } from "../config/db.js";
import "../config/env.js";
import { seedAdmin } from "./admin.seed.js";
import { seedTaxonomy } from "./taxonomy.seed.js";

async function run() {
  await connectDb();
  await seedAdmin();
  await seedTaxonomy();
  process.exit(0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
