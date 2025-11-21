// server/src/routes/index.js
import { Router } from "express";

import publicRoutes from "./public.routes.js";
import adminRoutes from "./admin.routes.js";        // keep existing admin routes
import webhookRoutes from "./webhook.routes.js";    // keep existing webhook routes

const router = Router();

// everything in public.routes.js becomes /api/*
router.use("/api", publicRoutes);

// keep your other mounts exactly as before
router.use("/admin", adminRoutes);
router.use("/webhooks", webhookRoutes);

// simple health check
router.get("/health", (_req, res) => res.json({ ok: true }));

export default router;
