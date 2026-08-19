import mongoose from "mongoose";
import dns from "node:dns";

// Try setting public DNS servers once at module init if allowed
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore if already in progress or restricted
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    // Graceful fallback for demo/offline development mode
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log("✅ Connected to MongoDB");
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null;
        console.error("❌ MongoDB connection error:", err);
        return null;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch {
    cached.promise = null;
    return null;
  }

  return cached.conn;
}