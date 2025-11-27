// server/src/controllers/event.controller.js - Handlers for Event Management

import {
  createEvent,
  listEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventSummary
} from '../services/event.service.js';

/** Handles POST request to create a new event. */
export async function createEventHandler(req, res, next) {
  try {
    const event = await createEvent(req.body);
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
}

/** Handles GET request to list all events (public/admin view). */
export async function listEventsHandler(req, res, next) {
  try {
    // Parse query parameters for filtering and stats inclusion
    const activeOnly = req.query.activeOnly === 'true';
    const includeStats = req.query.includeStats === 'true';
    
    const events = await listEvents({ activeOnly, includeStats });
    res.json(events);
  } catch (err) {
    next(err);
  }
}

/** Handles GET request for a specific event by ID. */
export async function getEventHandler(req, res, next) {
  try {
    const includeStats = req.query.includeStats === 'true';
    const event = await getEventById(req.params.id, includeStats);
    res.json(event);
  } catch (err) {
    next(err);
  }
}

/** Handles PUT request to update an existing event. */
export async function updateEventHandler(req, res, next) {
  try {
    const event = await updateEvent(req.params.id, req.body);
    res.json(event);
  } catch (err) {
    next(err);
  }
}

/** Handles DELETE request to delete an event. */
export async function deleteEventHandler(req, res, next) {
  try {
    // Note: The logic in auth.routes.js overrides this to force hard deletion 
    // and attendee cleanup for admin-side DELETE requests.
    const hardDelete = req.query.hard === 'true'; 
    const result = await deleteEvent(req.params.id, hardDelete);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/** Handles GET request for event summary (capacity, revenue). */
export async function getEventSummaryHandler(req, res, next) {
  try {
    const summary = await getEventSummary(req.params.id);
    res.json(summary);
  } catch (err) {
    next(err);
  }
}

/** Handles GET request for attendees registered for a specific event. */
export async function getEventAttendeesHandler(req, res, next) {
  try {
    const { listAttendees } = await import('../services/attendee.service.js');
    const attendees = await listAttendees({ eventId: req.params.id });
    res.json(attendees);
  } catch (err) {
    next(err);
  }
}