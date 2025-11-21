// server/src/routes/public.routes.js
import { Router } from "express";
import { createSession, summary } from "../controllers/checkout.controller.js";

const router = Router();

/**
 * POST /api/checkout/session
 * Body: { name, email, phone?, quantity }
 */
router.post("/checkout/session", createSession);

/**
 * GET /api/summary
 * Returns { paid, pending }
 */
router.get("/summary", summary);

export default router;
