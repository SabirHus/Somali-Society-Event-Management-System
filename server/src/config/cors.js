// server/src/config/cors.js - Cross-Origin Resource Sharing (CORS) Configuration

import cors from 'cors';

// Allowed origin is pulled from environment variables, defaulting to local dev port
const allowedOrigin = process.env.WEB_ORIGIN || "";

/**
 * CORS middleware configuration for Express.
 */
export const corsMiddleware = cors({
  origin: allowedOrigin, // Allow requests only from the specified origin (frontend URL)
  credentials: true,     // Allow cookies and authorization headers
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});