// server/src/config/cors.js

import cors from 'cors';

// Read from env: "https://somsocsal.com,https://www.somsocsal.com"
const rawOrigins = process.env.WEB_ORIGIN || '';

export const allowedOrigins = rawOrigins
  .split(',')
  .map(o => o.trim())
  .filter(Boolean); // removes empty strings

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow non-browser tools (Postman, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

export default corsMiddleware;
