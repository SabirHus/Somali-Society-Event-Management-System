import Stripe from 'stripe';
import { upsertAttendeeFromSession } from '../services/attendee.service.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export async function handleStripeWebhook(req, res) {
  // Verify signature if you are listening via Stripe CLI
  let event;
  try {
    const sig = req.headers['stripe-signature'];
    if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
      event = stripe.webhooks.constructEvent(
        req.rawBody || req.body, // ensure raw body middleware if verifying
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      // Fallback: accept parsed JSON in dev without verification
      event = req.body;
    }
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object;
      await upsertAttendeeFromSession(session);
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'handler_error' });
  }
}
