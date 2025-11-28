// server/src/app.js - Main Express Application Entry Point

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import Stripe from 'stripe';
import { prisma } from './models/prisma.js';
import { sendOrderEmail } from './services/email.service.js';
import { upsertAttendeeFromSession } from './services/attendee.service.js';

// --- Route Imports ---
import publicRoutes from './routes/public.routes.js';
import authRoutes from './routes/auth.routes.js';
import eventRoutes from './routes/event.routes.js';

// --- Middleware Imports ---
import { rateLimiter } from './middleware/rate-limit.js';
import { errorHandler } from './middleware/error-handler.js';
import logger from './utils/logger.js';

// --- Initialization ---
const app = express();
// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// CRITICAL: Prioritize the port provided by the hosting environment (Render, Vercel)
const PORT = process.env.PORT || 4000; 
const WEB_ORIGIN = process.env.WEB_ORIGIN || 'https://somsoc-frontend.onrender.com';

// CORS Configuration
app.use(cors({ 
  origin: WEB_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// --- Webhook Handler (MUST run before express.json middleware) ---

app.post('/webhooks/stripe', 
  express.raw({ type: 'application/json' }), // Use raw body parser for signature verification
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // Verify webhook signature for authenticity
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      logger.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    logger.info(`Webhook received: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      try {
        logger.info('Processing checkout session:', {
          sessionId: session.id,
          metadata: session.metadata
        });
        
        const { name, email, eventId } = session.metadata;
        
        if (!email || !name || !eventId) {
          logger.error('Missing required metadata in webhook', {
            sessionId: session.id,
            metadata: session.metadata
          });
          return res.json({ 
            received: true, 
            skipped: true, 
            reason: 'missing_metadata' 
          });
        }
        
        // Business Logic: Create attendee records
        const attendees = await upsertAttendeeFromSession(session);
        
        if (attendees.length === 0) {
          logger.warn('No attendees created (possibly duplicate webhook)', {
            sessionId: session.id
          });
          return res.json({ received: true, skipped: true, reason: 'duplicate' });
        }

        logger.info(`Created ${attendees.length} attendee(s)`, {
          sessionId: session.id,
          eventId,
          attendeeIds: attendees.map(a => a.id)
        });

        // Email Confirmation: Get primary attendee for email details
        const primaryAttendee = attendees[0];
        await sendOrderEmail({
          email: primaryAttendee.email,
          name: primaryAttendee.name,
          code: primaryAttendee.code,
          quantity: attendees.length,
          amount: session.amount_total / 100,
          location: primaryAttendee.event.location,
          eventName: primaryAttendee.event.name,
          eventDate: primaryAttendee.event.eventDate,
          eventTime: primaryAttendee.event.eventTime,
        });

        logger.info('Confirmation email sent', {
          email: primaryAttendee.email,
          code: primaryAttendee.code,
          eventId
        });
        
      } catch (err) {
        logger.error('Error processing webhook:', {
          error: err.message,
          stack: err.stack,
          sessionId: session.id
        });
        return res.status(500).json({ error: 'Failed to process payment' });
      }
    }

    res.json({ received: true });
});

// --- General Middleware ---

// Body Parsers (for application/json and form data)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security Middleware (Helmet)
app.use(helmet({
  // CSP disabled in dev to allow hot-reloading scripts
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false, 
  crossOriginEmbedderPolicy: false
}));

// Global Rate Limiter
app.use('/api', rateLimiter);

// --- Route Mounting ---
app.use('/api', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);

// --- Health Check Endpoint ---
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'test' : 'live'
  });
});

// --- Final Error Handling (MUST be last) ---

// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path 
  });
});

// Centralized Error Handler
app.use(errorHandler);

// --- Server Start and Shutdown Logic ---
const server = app.listen(PORT, () => {
  // ⭐ FIX: Log the actual port being used by the host, removing the misleading 'localhost' prefix
  logger.info(`Server successfully bound to port: ${PORT}`);
  logger.info(`Webhook endpoint should be configured to: ${process.env.APP_URL}/webhooks/stripe`);
  logger.info(`CORS enabled for: ${WEB_ORIGIN}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Stripe mode: ${process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'TEST' : 'LIVE'}`);
});

// Graceful shutdown on termination signals
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    prisma.$disconnect();
    process.exit(0);
  });
});

export default app;