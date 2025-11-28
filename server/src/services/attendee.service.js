// server/src/services/attendee.service.js - Business Logic for Attendees

import { prisma } from "../models/prisma.js";
import { customAlphabet } from "nanoid";
import logger from "../utils/logger.js";

// Custom alphabet for generating unique, readable booking codes (excluding ambiguous chars)
const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

// --- Internal Helpers ---

/** Generates a unique, non-colliding booking code (e.g., SS-ABC12345). */
async function generateUniqueCode() {
  let code;
  let exists = true;

  while (exists) {
    code = `SS-${nanoid()}`;
    const found = await prisma.attendee.findUnique({ where: { code } });
    exists = !!found;
  }

  return code;
}

// --- Public Service Functions ---

/** * Creates attendee records based on a successful Stripe session webhook event.
 * Handles single or multiple tickets (guests).
 */
export async function upsertAttendeeFromSession(session) {
  const { name, email, phone, quantity, eventId } = session.metadata;

  if (!eventId) {
    throw new Error('Event ID is required in session metadata');
  }

  logger.info('Creating attendees from session', {
    sessionId: session.id,
    eventId,
    quantity
  });

  // 1. Check if session was already processed (CRITICAL for webhooks)
  const existing = await prisma.attendee.findFirst({
    where: { 
      stripeSessionId: session.id 
    },
  });

  if (existing) {
    logger.warn('Session already processed (duplicate webhook)', {
      sessionId: session.id,
      attendeeId: existing.id
    });
    
    // Attempt to return all attendees created during the original process
    const allAttendees = await prisma.attendee.findMany({
      where: {
        // Use the original session ID for lookup
        stripeSessionId: session.id
      },
      include: { 
        event: {
          select: {
            id: true,
            name: true,
            eventDate: true,
            eventTime: true,
            location: true
          }
        }
      }
    });
    
    return allAttendees;
  }

  // 2. Verify capacity
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      _count: {
        select: { attendees: true }
      }
    }
  });

  if (!event) {
    throw new Error(`Event ${eventId} not found`);
  }

  const currentAttendees = event._count.attendees;
  const requestedQuantity = parseInt(quantity) || 1;
  const remaining = event.capacity - currentAttendees;

  if (remaining < requestedQuantity) {
    throw new Error(`Not enough capacity. Requested: ${requestedQuantity}, Available: ${remaining}`);
  }

  // 3. Create all attendee records
  const qty = parseInt(quantity) || 1;
  const attendees = [];

  for (let i = 0; i < qty; i++) {
    const code = await generateUniqueCode();
    
    const attendee = await prisma.attendee.create({
      data: {
        // Name first ticket holder normally, subsequent tickets as guests
        name: i === 0 ? name : `${name} (Guest ${i})`,
        email,
        phone: phone || null,
        code,
        // Only link the Stripe session ID to the primary ticket holder
        stripeSessionId: i === 0 ? session.id : null, 
        eventId,
        checkedIn: false
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            eventDate: true,
            eventTime: true,
            location: true
          }
        }
      }
    });
    
    attendees.push(attendee);
    
    logger.info(`Created attendee ${i + 1}/${qty}`, {
      code: attendee.code,
      name: attendee.name,
      hasSessionId: !!attendee.stripeSessionId
    });
  }

  logger.info('All attendees created successfully', {
    sessionId: session.id,
    eventId,
    count: attendees.length,
    codes: attendees.map(a => a.code)
  });

  return attendees;
}

/** Lists attendees, optionally filtered by search query or event ID. */
export async function listAttendees({ q, eventId } = {}) {
  const where = {};

  if (eventId) {
    where.eventId = eventId;
  }

  if (q && q.trim()) {
    const search = q.trim().toLowerCase();
    // Allow search by name, email, or code (case insensitive mode)
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
    ];
  }

  return await prisma.attendee.findMany({
    where,
    include: {
      event: {
        select: {
          id: true,
          name: true,
          eventDate: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Checks in an attendee (does not toggle - only sets to true). */
export async function toggleCheckInByCode(code) {
  const attendee = await prisma.attendee.findUnique({
    where: { code },
    include: {
      event: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!attendee) {
    throw new Error("Attendee not found");
  }

  // If already checked in, return without changing
  if (attendee.checkedIn) {
    logger.info('Attendee already checked in', {
      code,
      eventId: attendee.eventId,
      eventName: attendee.event.name
    });
    
    // Return attendee with special flag
    return {
      ...attendee,
      alreadyCheckedIn: true
    };
  }

  // Check in the attendee (set to true)
  const updated = await prisma.attendee.update({
    where: { code },
    data: { checkedIn: true },
    include: {
      event: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  logger.info('Attendee checked in', {
    code,
    eventId: updated.eventId,
    eventName: updated.event.name
  });

  return {
    ...updated,
    alreadyCheckedIn: false
  };
}

/** Provides overall summary statistics for all events/attendees (global view). */
export async function summary() {
  // Fetch overall capacity from environment variable (if defined)
  const capacity = parseInt(process.env.CAPACITY || "100"); 
  const totalAttendees = await prisma.attendee.count();
  
  // Note: Only attendees linked to a stripeSessionId are considered "paid" 
  // (Assuming non-null stripeSessionId implies payment success)
  const paidAttendees = await prisma.attendee.count({
    where: { stripeSessionId: { not: null } }
  });

  return {
    paid: paidAttendees,
    pending: totalAttendees - paidAttendees,
    capacity,
    remaining: capacity - totalAttendees,
  };
}

/** Retrieves an attendee record by their Stripe session ID. */
export async function getAttendeeBySessionId(sessionId) {
  return await prisma.attendee.findFirst({
    where: { stripeSessionId: sessionId },
    include: {
      event: true
    }
  });
}