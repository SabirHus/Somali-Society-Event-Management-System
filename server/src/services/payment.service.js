// server/src/services/payment.service.js - Interface with Stripe API

import Stripe from "stripe";
import logger from "../utils/logger.js";

// Initialize Stripe client using the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Creates a Stripe Checkout Session for payment processing.
 * @param {object} bookingDetails - User and event data needed for the session.
 */
export async function createCheckoutSession({ name, email, phone, quantity, eventId, stripePriceId }) {
  if (!stripePriceId) {
    throw new Error("Missing stripePriceId for event");
  }

  if (!eventId) {
    throw new Error("Missing eventId");
  }

  // Determine dynamic URLs for redirection after payment completion/cancellation
  const baseUrl = process.env.APP_URL || process.env.WEB_ORIGIN || 'https://somsoc-frontend.onrender.com';
  const successUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&eventId=${eventId}`;
  const cancelUrl = `${baseUrl}/event/${eventId}?cancelled=true`;

  logger.info('Creating checkout session', {
    email,
    quantity,
    eventId,
    stripePriceId
  });

  try {
    // Create the session object
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email, // Pre-populates email for customer
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          price: stripePriceId,
          quantity: Number(quantity || 1),
        },
      ],
      // Store necessary data to link payment back to attendee records via webhook
      metadata: {
        name: String(name || ""),
        email: String(email || ""),
        phone: String(phone || ""),
        quantity: String(quantity || "1"),
        eventId: String(eventId)
      },
      billing_address_collection: 'auto',
      // Session expires in 30 minutes
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), 
    });

    logger.info('Checkout session created', {
      sessionId: session.id,
      eventId,
      url: session.url
    });

    return { url: session.url, id: session.id };
  } catch (error) {
    logger.error('Failed to create checkout session', {
      error: error.message,
      email,
      eventId,
      quantity
    });
    // Re-throw Stripe error for error handler
    throw error; 
  }
}

/** Retrieves details of a Stripe Checkout Session by ID. */
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

/** Utility function to verify the authenticity of a Stripe webhook event. */
export function constructWebhookEvent(rawBody, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    // Critical security check
    throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  }
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}