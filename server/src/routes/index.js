// server/src/routes/index.js
import { Router, json } from "express";
import publicRoutes from "./public.routes.js";
import webhookRoutes from "./webhook.routes.js";

const router = Router();

// normal JSON for app APIs
router.use(json());
router.use("/", publicRoutes);

// mount webhook under /webhooks (raw body handled inside webhook.routes.js)
router.use("/webhooks", webhookRoutes);

export default router;
