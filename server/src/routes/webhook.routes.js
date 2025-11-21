// server/src/routes/webhook.routes.js
import { Router, raw } from "express";
import { handleStripeWebhook } from "../controllers/webhook.controller.js";

/**
 * Stripe requires the raw body on the webhook route only.
 */
const router = Router();
router.post("/stripe", raw({ type: "application/json" }), keepRawBody, handleStripeWebhook);
export default router;

// Preserve raw body for signature verification
function keepRawBody(req, _res, next) {
  if (req.body && Buffer.isBuffer(req.body)) {
    req.rawBody = req.body;
  } else if (req._readableState && req._readableState.buffer && req._readableState.buffer.head) {
    // fallback for some Node streams
    const chunks = [];
    let n = req._readableState.buffer.head;
    while (n) {
      chunks.push(n.data);
      n = n.next;
    }
    req.rawBody = Buffer.concat(chunks);
  } else {
    req.rawBody = Buffer.from([]);
  }
  next();
}
