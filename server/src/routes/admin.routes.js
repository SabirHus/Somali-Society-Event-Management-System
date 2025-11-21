// server/src/routes/admin.routes.js
import { Router } from "express";
import { adminList, adminToggle, adminSummary } from "../controllers/admin.controller.js";
import { adminGuard } from "../middleware/admin.guard.js";

const router = Router();

router.use(adminGuard); // protect all admin endpoints

router.get("/summary", adminList);
router.get("/attendees", adminToggle);
router.post("/toggle-checkin", adminSummary);

export default router;
