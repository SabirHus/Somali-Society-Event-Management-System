import { prisma } from "../models/prisma.js";
import { customAlphabet } from "nanoid";
import logger from "../utils/logger.js";

const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

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

  // Check if session already processed (look for the primary attendee)
  const existing = await prisma.attendee.findFirst({
    where: { 
      stripeSessionId: session.id 
    },
  });

  if (existing) {
    logger.warn('Session already processed', {
      sessionId: session.id,
      attendeeId: existing.id
    });
    
    // Return all attendees for this purchase (same email + event + similar time)
    const allAttendees = await prisma.attendee.findMany({
      where: {
        email: email,
        eventId: eventId,
        createdAt: {
          gte: new Date(existing.createdAt.getTime() - 10000),
          lte: new Date(existing.createdAt.getTime() + 10000)
        }
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

  // Verify event exists and has capacity
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

  const qty = parseInt(quantity) || 1;
  const attendees = [];

  // Create all attendees
  for (let i = 0; i < qty; i++) {
    const code = await generateUniqueCode();
    
    try {
      const attendee = await prisma.attendee.create({
        data: {
          name: i === 0 ? name : `${name} (Guest ${i})`,
          email,
          phone: phone || null,
          code,
          stripeSessionId: i === 0 ? session.id : null,
          eventId,
          checkedIn: false
          // DON'T set createdAt/updatedAt - let Prisma handle them!
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
      
    } catch (error) {
      logger.error(`Failed to create attendee ${i + 1}/${qty}`, {
        error: error.message,
        code: error.code,
        name: i === 0 ? name : `${name} (Guest ${i})`
      });
      
      // If we fail partway through, log what we created
      if (attendees.length > 0) {
        logger.error('Partial creation - created attendees:', {
          count: attendees.length,
          codes: attendees.map(a => a.code)
        });
      }
      
      throw error;
    }
  }

  logger.info('All attendees created successfully', {
    sessionId: session.id,
    eventId,
    count: attendees.length,
    codes: attendees.map(a => a.code)
  });

  return attendees;
}

export async function listAttendees({ q, eventId } = {}) {
  const where = {};

  if (eventId) {
    where.eventId = eventId;
  }

  if (q && q.trim()) {
    const search = q.trim().toLowerCase();
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

  const updated = await prisma.attendee.update({
    where: { code },
    data: { checkedIn: !attendee.checkedIn },
    include: {
      event: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  logger.info('Check-in toggled', {
    code,
    checkedIn: updated.checkedIn,
    eventId: updated.eventId,
    eventName: updated.event.name
  });

  return updated;
}

export async function summary() {
  const capacity = parseInt(process.env.CAPACITY || "100");
  const totalAttendees = await prisma.attendee.count();
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

export async function getAttendeeBySessionId(sessionId) {
  return await prisma.attendee.findFirst({
    where: { stripeSessionId: sessionId },
    include: {
      event: true
    }
  });
}