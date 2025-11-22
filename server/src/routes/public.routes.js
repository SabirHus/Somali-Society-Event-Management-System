// server/src/routes/public.routes.js
import { Router } from "express";
import { createSession, summary, checkoutSuccess  } from "../controllers/checkout.controller.js";
import { adminLogin } from "../controllers/admin.controller.js";

const router = Router();

// POST /api/checkout/session
router.post("/checkout/session", createSession);

// GET /api/summary
router.get("/summary", summary);

// GET /api/checkout/success
router.get('/checkout/success', checkoutSuccess);   // <-- add/ensure this line

router.post("/admin/login", adminLogin);

export default router;
