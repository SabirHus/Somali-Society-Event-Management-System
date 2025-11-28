// server/src/config/cors.js - Cross-Origin Resource Sharing (CORS) Configuration

import cors from "cors";

// Read allowed origins from WEB_ORIGIN (comma-separated)
const rawOrigins = process.env.WEB_ORIGIN || "";
const allowedOrigins = rawOrigins
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

/**
 * CORS middleware configuration for Express.
 * Allows only the origins listed in WEB_ORIGIN.
 */
export const corsMiddleware = cors({
  origin(origin, callback) {
    // Allow requests with no origin (e.g. curl, Postman)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Origin not allowed
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});
