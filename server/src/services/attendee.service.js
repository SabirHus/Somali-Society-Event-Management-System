// server/src/services/attendee.service.js - Business Logic for Attendees

import { prisma } from "../models/prisma.js";
import { customAlphabet } from "nanoid";
import logger from "../utils/logger.js";

// Custom alphabet for generating unique, readable booking codes (excluding ambiguous chars)
const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

// --- Internal Helpers ---

/** Generates a unique, non-colliding booking code (e.g., SS-ABC12345). */
async function generateUniqueCode(tx) {
  // Accept optional transaction context so code generation is safe inside transactions
  const client = tx || prisma;
  let code;
  let exists = true;

  while (exists) {
    code = `SS-${nanoid()}`;
    const found = await client.attendee.findUnique({ where: { code } });
    exists = !!found;
  }

  return code;
}

// --- Public Service Functions ---

/**
 * Creates attendee records based on a successful Stripe session webhook event.
 * Uses a database transaction with a row-level lock to prevent overselling
 * when many people purchase simultaneously.
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
  // This fast check outside the transaction avoids unnecessary locking
  const existing = await prisma.attendee.findFirst({
    where: { stripeSessionId: session.id },
  });

  if (existing) {
    logger.warn('Session already processed (duplicate webhook)', {
      sessionId: session.id,
      attendeeId: existing.id
    });

    // Return all attendees created during the original process
    const allAttendees = await prisma.attendee.findMany({
      where: { stripeSessionId: session.id },
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

  // 2. Use a transaction with row-level lock to prevent race conditions.
  // If two webhooks arrive at exactly the same time, only one will proceed —
  // the other will wait for the lock to release, then see the duplicate check above.
  const attendees = await prisma.$transaction(async (tx) => {

    // Lock the event row so no other transaction can read/write it simultaneously.
    // This prevents the overselling race condition.
    const lockedEvent = await tx.$queryRaw`
      SELECT e.id, e.capacity, e.name,
             COUNT(a.id)::int AS current_count
      FROM events e
      LEFT JOIN attendees a ON a."eventId" = e.id
      WHERE e.id = ${eventId}
      GROUP BY e.id, e.capacity, e.name
      FOR UPDATE
    `;

    if (!lockedEvent[0]) {
      throw new Error(`Event ${eventId} not found`);
    }

    const event = lockedEvent[0];
    const currentCount = parseInt(event.current_count) || 0;
    const requestedQty = parseInt(quantity) || 1;
    const remaining = event.capacity - currentCount;

    if (remaining < requestedQty) {
      throw new Error(
        `Not enough capacity. Requested: ${requestedQty}, Available: ${remaining}`
      );
    }

    // 3. Double-check for duplicate inside the transaction (belt and braces)
    const duplicateCheck = await tx.attendee.findFirst({
      where: { stripeSessionId: session.id }
    });

    if (duplicateCheck) {
      logger.warn('Duplicate detected inside transaction', { sessionId: session.id });
      // Return empty array — caller will handle this gracefully
      return [];
    }

    // 4. Create all attendee records inside the same transaction
    const created = [];

    for (let i = 0; i < requestedQty; i++) {
      // Generate unique code inside the transaction to avoid conflicts
      const code = await generateUniqueCode(tx);

      const attendee = await tx.attendee.create({
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

      created.push(attendee);

      logger.info(`Created attendee ${i + 1}/${requestedQty}`, {
        code: attendee.code,
        name: attendee.name,
        hasSessionId: !!attendee.stripeSessionId
      });
    }

    return created;
  });

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

/** Provides overall summary statistics across all active events. */
export async function summary() {
  const events = await prisma.event.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { attendees: true }
      }
    }
  });

  const totalCapacity = events.reduce((sum, e) => sum + e.capacity, 0);
  const totalAttendees = events.reduce((sum, e) => sum + e._count.attendees, 0);

  return {
    paid: totalAttendees,
    pending: 0,
    capacity: totalCapacity,
    remaining: totalCapacity - totalAttendees,
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