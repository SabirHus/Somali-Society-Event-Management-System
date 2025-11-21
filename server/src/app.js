// server/src/app.js
import 'dotenv/config';
import express from 'express';
import { corsMiddleware } from './config/cors.js';
import { mountWebhook, mountPublic } from './routes/index.js';

const PORT = Number(process.env.PORT || 4000);
const WEB_ORIGIN = process.env.WEB_ORIGIN || 'http://localhost:5173';

const app = express();

// 1) CORS first
app.use(corsMiddleware());

// 2) Webhook routes BEFORE JSON parser (needs raw body)
mountWebhook(app);

// 3) JSON parser for normal routes
app.use(express.json());

// 4) Public routes (health, etc.)
mountPublic(app);

// 5) Boot
app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
  console.log(`CORS origin: ${WEB_ORIGIN}`);
});

export default app;
