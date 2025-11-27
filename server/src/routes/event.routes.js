// server/src/routes/event.routes.js - Routes for Event CRUD and Status

import { Router } from 'express';
import {
  createEventHandler,
  listEventsHandler,
  getEventHandler,
  updateEventHandler,
  deleteEventHandler,
  getEventSummaryHandler,
  getEventAttendeesHandler
} from '../controllers/event.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { adminRateLimiter } from '../middleware/rate-limit.js';
import { asyncHandler } from '../middleware/error-handler.js';

const router = Router();

// --- Public Access Routes ---

// GET /api/events/ - List all active events (public landing page view)
router.get('/', asyncHandler(listEventsHandler));

// GET /api/events/:id - Get specific event details
router.get('/:id', asyncHandler(getEventHandler));


// --- Protected Admin Routes (Require Auth and Rate Limiting) ---

// POST /api/events/ - Create new event
router.post(
  '/',
  requireAuth,
  adminRateLimiter,
  asyncHandler(createEventHandler)
);

// PUT /api/events/:id - Update existing event details
router.put(
  '/:id',
  requireAuth,
  adminRateLimiter,
  asyncHandler(updateEventHandler)
);

// DELETE /api/events/:id - Soft delete event (handled in controller logic)
// NOTE: Hard delete (with attendee removal) for admin UI is implemented in auth.routes.js
router.delete(
  '/:id',
  requireAuth,
  adminRateLimiter,
  asyncHandler(deleteEventHandler)
);

// GET /api/events/:id/summary - Get summary statistics for a single event
router.get(
  '/:id/summary',
  requireAuth,
  adminRateLimiter,
  asyncHandler(getEventSummaryHandler)
);

// GET /api/events/:id/attendees - List all attendees for a specific event
router.get(
  '/:id/attendees',
  requireAuth,
  adminRateLimiter,
  asyncHandler(getEventAttendeesHandler)
);

export default router;