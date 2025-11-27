// server/src/routes/public.routes.js - Public (Unprotected) API Routes

import { Router } from "express";
import { 
  createSession, 
  summary, 
  checkoutSuccess 
} from "../controllers/checkout.controller.js";
import { checkoutRateLimiter, rateLimiter } from "../middleware/rate-limit.js";
import { asyncHandler } from "../middleware/error-handler.js";

const router = Router();

// GET /api/summary - Get general capacity info (for landing page)
router.get(
  "/summary", 
  rateLimiter, // Use general rate limiter as this is a high-traffic public endpoint
  asyncHandler(summary)
);

// POST /api/checkout/session - Create Stripe checkout session
router.post(
  "/checkout/session", 
  checkoutRateLimiter, // Use dedicated checkout limiter
  asyncHandler(createSession)
);

// GET /api/checkout/success - Verify Stripe session after successful payment redirect
router.get("/checkout/success", asyncHandler(checkoutSuccess));

export default router;