import Stripe from 'stripe';
import { upsertAttendeeFromSession } from '../services/attendee.service.js';
import { sendOrderEmail } from '../services/mailer.service.js';

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
      const session = event.data.object; // Stripe.Checkout.Session
      // 1) Ensure attendee exists/updated from session
      const created = await upsertAttendeeFromSession(session);
      const attendee = created?.[0]; // your service returns array

      // 2) Email the ticket
      if (attendee?.email) {
        await sendOrderEmail({
          to: attendee.email,
          attendee,
          orderId: session.id,
          amount: session.amount_total || 0,
        });
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).send('webhook-handler-failed');
  }
}
