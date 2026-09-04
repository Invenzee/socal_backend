import http from "node:http";
import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { configureCloudinary } from "./config/cloudinary.js";
import { attachSocket } from "./modules/chat/socket.js";
import { seedAdmin } from "./seeds/admin.seed.js";
import { seedTaxonomy } from "./seeds/taxonomy.seed.js";

async function bootstrap() {
  await connectDb();
  configureCloudinary();
  await seedAdmin();
  await seedTaxonomy();

  const app = createApp();
  const server = http.createServer(app);
  attachSocket(server);

  server.listen(env.PORT, "0.0.0.0", () => {
    console.log(`API listening on ${env.PORT}${env.API_PREFIX}`);
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
