// server/src/routes/public.routes.js - COMPLETE REPLACEMENT
import { Router } from "express";
import { 
  createSession, 
  summary, 
  checkoutSuccess 
} from "../controllers/checkout.controller.js";
import { checkoutRateLimiter } from "../middleware/rate-limit.js";
import { asyncHandler } from "../middleware/error-handler.js";

const router = Router();

// GET /api/summary - Get capacity info
router.get("/summary", asyncHandler(summary));

// POST /api/checkout/session - Create Stripe checkout
router.post(
  "/checkout/session", 
  checkoutRateLimiter, // Limit: 10 requests per hour
  asyncHandler(createSession)
);

// GET /api/checkout/success - Get attendee details after payment
router.get("/checkout/success", asyncHandler(checkoutSuccess));

export default router;