import mongoose from "mongoose";
import { env } from "./env.js";

function mongoHost() {
  try {
    return new URL(env.MONGODB_URI.replace(/^mongodb(\+srv)?:/, "http:")).hostname;
  } catch {
    return "unknown";
  }
}

export async function connectDb() {
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 12_000 });
    console.log(`MongoDB connected (${mongoHost()})`);
  } catch (error) {
    const host = mongoHost();
    console.error(`MongoDB connection failed (host: ${host}).`);
    if (error instanceof Error && /ENOTFOUND|ECONNREFUSED/.test(error.message)) {
      console.error(
        "From this PC use Coolify External Credentials (public IP + external port), not the Internal Host.",
      );
    }
    throw error;
  }
}
