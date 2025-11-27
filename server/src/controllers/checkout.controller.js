// server/src/controllers/checkout.controller.js - Handlers for Public Checkout Flow

import { createCheckoutSession, getSession } from "../services/payment.service.js";
import { summary } from "../services/attendee.service.js";
import { getEventById } from "../services/event.service.js";
import logger from "../utils/logger.js";

/**
 * Handles POST request to create a new Stripe checkout session.
 */
export async function createSession(req, res, next) {
  try {
    const { name, email, phone, quantity, eventId } = req.body;

    // Basic Validation
    if (!name || !email || !eventId) {
      return res.status(400).json({
        error: "validation_error",
        message: "Name, email, and eventId are required",
      });
    }

    // Fetch event details with stats to check active status and capacity
    const event = await getEventById(eventId, true);
    
    if (!event.isActive) {
      return res.status(400).json({
        error: "event_inactive",
        message: "This event is no longer accepting registrations",
      });
    }

    const requestedQuantity = parseInt(quantity) || 1;
    
    // Check capacity before creating session
    if (event.remaining < requestedQuantity) {
      return res.status(400).json({
        error: "capacity_exceeded",
        message: `Not enough tickets available. Requested: ${requestedQuantity}, Available: ${event.remaining}`,
        available: event.remaining
      });
    }

    if (!event.stripePriceId) {
      return res.status(400).json({
        error: "no_stripe_price",
        message: "This event is not configured for online payments",
      });
    }

    logger.info('Creating checkout session for event', {
      eventId,
      eventName: event.name,
      email,
      quantity: requestedQuantity
    });

    // Delegate to Payment Service
    const result = await createCheckoutSession({
      name,
      email,
      phone,
      quantity: requestedQuantity,
      eventId,
      stripePriceId: event.stripePriceId
    });

    res.json(result);
  } catch (err) {
    logger.error('Checkout session creation failed', {
      error: err.message,
      body: req.body
    });
    next(err); // Pass error to centralized error handler
  }
}

/**
 * Handles GET request to verify a successful Stripe session via query parameter.
 */
export async function checkoutSuccess(req, res, next) {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({
        error: "session_id_required",
        message: "Stripe session_id is required",
      });
    }

    // Delegate to Payment Service
    const session = await getSession(session_id);
    
    // Return relevant session data to the client
    res.json({
      success: true,
      session: {
        id: session.id,
        status: session.payment_status,
        customerEmail: session.customer_email,
        metadata: session.metadata
      }
    });
  } catch (err) {
    next(err);
  }
}

// Export summary function for use in public routes
export { summary };