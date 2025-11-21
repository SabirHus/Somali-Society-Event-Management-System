// server/src/controllers/webhook.controller.js
import { constructWebhookEvent } from "../services/payment.service.js";
import { upsertAttendeeFromSession } from "../services/attendee.service.js";

export async function handleStripeWebhook(req, res) {
  try {
    const signature = req.headers["stripe-signature"];
    const event = constructWebhookEvent(req.rawBody, signature);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await upsertAttendeeFromSession(session);
    }

    // You can log or handle additional events here
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
