// server/src/services/event.service.js - Business Logic for Events

import { prisma } from '../models/prisma.js';
import logger from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../middleware/error-handler.js';

// --- Public Service Functions ---

/** Creates a new event record. */
export async function createEvent(eventData) {
  const { name, description, location, eventDate, eventTime, price, capacity, stripePriceId } = eventData;

  // Basic validation
  if (!name || !location || !eventDate || !eventTime || price === undefined || !capacity) {
    throw new ValidationError('Missing required fields', [
      'name, location, eventDate, eventTime, price, and capacity are required'
    ]);
  }

  try {
    const event = await prisma.event.create({
      data: {
        name,
        description: description || null,
        location,
        eventDate: new Date(eventDate),
        eventTime,
        price: parseFloat(price),
        capacity: parseInt(capacity),
        stripePriceId: stripePriceId || null,
        isActive: true
      }
    });

    logger.info('Event created', {
      eventId: event.id,
      name: event.name
    });

    return event;
  } catch (error) {
    logger.error('Failed to create event', {
      error: error.message,
      eventData
    });
    throw error;
  }
}

/** Lists events, supporting filtering by active status and inclusion of capacity stats. */
export async function listEvents({ activeOnly = false, includeStats = false } = {}) {
  try {
    const where = activeOnly ? { isActive: true } : {};

    if (includeStats) {
      // Fetch event counts for calculating remaining tickets
      const events = await prisma.event.findMany({
        where,
        include: {
          _count: {
            select: { attendees: true }
          }
        },
        orderBy: {
          eventDate: 'asc'
        }
      });

      // Map raw data to include computed stats
      return events.map(event => ({
        ...event,
        attendeeCount: event._count.attendees,
        remaining: event.capacity - event._count.attendees,
        isFull: event._count.attendees >= event.capacity
      }));
    } else {
      // Simple list fetch
      return await prisma.event.findMany({
        where,
        orderBy: {
          eventDate: 'asc'
        }
      });
    }
  } catch (error) {
    logger.error('Failed to list events', { error: error.message });
    throw error;
  }
}

/** Retrieves a single event by ID, optionally including capacity stats. */
export async function getEventById(eventId, includeStats = false) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: includeStats ? {
        _count: {
          select: { attendees: true }
        }
      } : undefined
    });

    if (!event) {
      throw new NotFoundError('Event');
    }

    if (includeStats) {
      // Include computed properties if stats requested
      return {
        ...event,
        attendeeCount: event._count.attendees,
        remaining: event.capacity - event._count.attendees,
        isFull: event._count.attendees >= event.capacity
      };
    }

    return event;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Failed to get event', {
      eventId,
      error: error.message
    });
    throw error;
  }
}

/** Updates fields of an existing event. */
export async function updateEvent(eventId, updates) {
  try {
    const existing = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!existing) {
      throw new NotFoundError('Event');
    }

    // Build the data object with optional updates, converting types as needed
    const data = {};
    if (updates.name !== undefined) data.name = updates.name;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.location !== undefined) data.location = updates.location;
    // Convert date string to Date object
    if (updates.eventDate !== undefined) data.eventDate = new Date(updates.eventDate); 
    if (updates.eventTime !== undefined) data.eventTime = updates.eventTime;
    if (updates.price !== undefined) data.price = parseFloat(updates.price);
    if (updates.capacity !== undefined) data.capacity = parseInt(updates.capacity);
    if (updates.stripePriceId !== undefined) data.stripePriceId = updates.stripePriceId;
    if (updates.isActive !== undefined) data.isActive = updates.isActive; // Used for soft deletion/deactivation

    const event = await prisma.event.update({
      where: { id: eventId },
      data
    });

    logger.info('Event updated', {
      eventId: event.id,
      updates: Object.keys(data)
    });

    return event;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Failed to update event', {
      eventId,
      error: error.message
    });
    throw error;
  }
}

/** * Deletes an event (soft delete by default, hard delete if specified).
 * Note: Hard deletion of events with attendees is handled in auth.routes.js 
 * for admin deletion requests. This soft deletion logic is available if needed.
 */
export async function deleteEvent(eventId, hardDelete = false) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { attendees: true }
        }
      }
    });

    if (!event) {
      throw new NotFoundError('Event');
    }

    if (event._count.attendees > 0 && hardDelete) {
      throw new ValidationError(
        'Cannot hard delete event with attendees',
        ['Use soft delete (isActive=false) instead or remove attendees first']
      );
    }

    if (hardDelete) {
      await prisma.event.delete({
        where: { id: eventId }
      });
      logger.info('Event hard deleted', { eventId });
    } else {
      await prisma.event.update({
        where: { id: eventId },
        data: { isActive: false }
      });
      logger.info('Event soft deleted', { eventId });
    }

    return { success: true };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
    logger.error('Failed to delete event', {
      eventId,
      error: error.message
    });
    throw error;
  }
}

/** Retrieves calculated statistics for a single event (used by admin attendee view). */
export async function getEventSummary(eventId) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        attendees: true
      }
    });

    if (!event) {
      throw new NotFoundError('Event');
    }

    const totalAttendees = event.attendees.length;
    const checkedIn = event.attendees.filter(a => a.checkedIn).length;
    const revenue = totalAttendees * event.price;

    return {
      eventId: event.id,
      name: event.name,
      capacity: event.capacity,
      totalAttendees,
      checkedIn,
      remaining: event.capacity - totalAttendees,
      isFull: totalAttendees >= event.capacity,
      revenue,
      pricePerTicket: event.price
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Failed to get event summary', {
      eventId,
      error: error.message
    });
    throw error;
  }
}