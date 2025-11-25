// server/src/services/payment.service.js - COMPLETE REPLACEMENT
import Stripe from "stripe";
import logger from "../utils/logger.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Creates a Stripe Checkout Session
 * Apple Pay and Google Pay are automatically enabled
 */
export async function createCheckoutSession({ name, email, phone, quantity }) {
  if (!process.env.STRIPE_PRICE_ID) {
    throw new Error("Missing STRIPE_PRICE_ID");
  }

  const baseUrl = process.env.APP_URL || process.env.WEB_ORIGIN || 'http://localhost:5173';
  const successUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/?cancelled=true`; // ✅ BACK BUTTON FIX

  logger.info('Creating checkout session', {
    email,
    quantity,
    priceId: process.env.STRIPE_PRICE_ID
  });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"], // Apple Pay & Google Pay auto-enabled
      customer_email: email,
      success_url: successUrl,
      cancel_url: cancelUrl, // ✅ THIS FIXES THE BACK BUTTON
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
        quantity: String(quantity || "1"), 
      },
      billing_address_collection: 'auto',
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    });

    logger.info('Checkout session created', {
      sessionId: session.id,
      url: session.url
    });

    return { url: session.url, id: session.id };
  } catch (error) {
    logger.error('Failed to create checkout session', {
      error: error.message,
      email,
      quantity
    });
    throw error;
  }
}

/**
 * Retrieve a Checkout Session by id
 */
export async function getSession(sessionId) {
  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error) {
    logger.error('Failed to retrieve session', {
      sessionId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Verify and parse Stripe webhook event
 */
export function constructWebhookEvent(rawBody, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}