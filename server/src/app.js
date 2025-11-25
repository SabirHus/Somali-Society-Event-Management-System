// server/src/app.js - COMPLETE REPLACEMENT
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import Stripe from 'stripe';
import { prisma } from './models/prisma.js';
import { sendOrderEmail } from './services/email.service.js';
import { upsertAttendeeFromSession } from './services/attendee.service.js';
import publicRoutes from './routes/public.routes.js';
import authRoutes from './routes/auth.routes.js';
import { requireAuth } from './middleware/auth.middleware.js';
import { rateLimiter } from './middleware/rate-limit.js';
import { errorHandler } from './middleware/error-handler.js';
import logger from './utils/logger.js';

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const PORT = process.env.PORT || 4000;
const WEB_ORIGIN = process.env.WEB_ORIGIN || 'http://localhost:5173';

// ============================================
// WEBHOOK ROUTE (MUST BE BEFORE express.json())
// ============================================
app.post('/webhooks/stripe', 
  express.raw({ type: 'application/json' }), 
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
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
        
        const { name, email, phone, quantity } = session.metadata;
        
        if (!email || !name) {
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
        
        // Use service function to create attendees (handles duplicates automatically)
        const attendees = await upsertAttendeeFromSession(session);
        
        if (attendees.length === 0) {
          logger.warn('No attendees created (possibly duplicate webhook)', {
            sessionId: session.id
          });
          return res.json({ received: true, skipped: true, reason: 'duplicate' });
        }

        logger.info(`Created ${attendees.length} attendee(s)`, {
          sessionId: session.id,
          attendeeIds: attendees.map(a => a.id)
        });

        // Send confirmation email
        const primaryAttendee = attendees[0];
        await sendOrderEmail({
          email: primaryAttendee.email,
          name: primaryAttendee.name,
          code: primaryAttendee.code,
          quantity: attendees.length,
          amount: session.amount_total / 100
        });

        logger.info('Confirmation email sent', {
          email: primaryAttendee.email,
          code: primaryAttendee.code
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

// ============================================
// MIDDLEWARE (AFTER WEBHOOK)
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({ 
  origin: WEB_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Apply rate limiting to API routes
app.use('/api', rateLimiter);

// ============================================
// ROUTES
// ============================================
app.use('/api', publicRoutes);
app.use('/api/auth', requireAuth, authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'test' : 'live'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path 
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// ============================================
// SERVER START
// ============================================
const server = app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`Webhook endpoint: http://localhost:${PORT}/webhooks/stripe`);
  logger.info(`CORS enabled for: ${WEB_ORIGIN}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Stripe mode: ${process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'TEST' : 'LIVE'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    prisma.$disconnect();
    process.exit(0);
  });
});

export default app;