// server/src/services/payment.service.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Creates a Stripe Checkout Session.
 * Returns { url } for client redirect.
 */
export async function createCheckoutSession({ name, email, phone, quantity }) {
  if (!process.env.STRIPE_PRICE_ID) {
    throw new Error("Missing STRIPE_PRICE_ID");
  }
  const successUrl = `${process.env.APP_URL || process.env.WEB_ORIGIN}/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${process.env.APP_URL || process.env.WEB_ORIGIN}/register?cancelled=1`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: email,
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: Number(quantity || 1),
      },
    ],
    metadata: {
      name: String(name || ""),
      email: String(email || ""),
      phone: String(phone || ""),
    },
  });

  return { url: session.url, id: session.id };
}

/**
 * Retrieve a Checkout Session by id (for debug or admin).
 */
export async function getSession(sessionId) {
  return stripe.checkout.sessions.retrieve(sessionId);
}

/**
 * Verify and parse Stripe webhook event.
 */
export function constructWebhookEvent(rawBody, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}
