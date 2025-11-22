// server/src/routes/public.routes.js
import { Router } from "express";
import { createSession, summary, checkoutSuccess  } from "../controllers/checkout.controller.js";

const router = Router();

// POST /api/checkout/session
router.post("/checkout/session", createSession);

// GET /api/summary
router.get("/summary", summary);

// GET /api/checkout/success
router.get('/checkout/success', checkoutSuccess);   // <-- add/ensure this line

export default router;
