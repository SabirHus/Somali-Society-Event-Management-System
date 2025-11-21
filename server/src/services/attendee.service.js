// server/src/services/attendee.service.js
import { prisma } from "../models/prisma.js";

/**
 * Idempotently upsert attendee when session completes.
 */
export async function upsertAttendeeFromSession(session) {
  const q = Number(session?.amount_total ? 1 : session?.metadata?.quantity || 1); // quantity on line_items, fallback 1
  const email = session?.customer_details?.email || session?.customer_email || session?.metadata?.email || "";
  const name = session?.metadata?.name || session?.customer_details?.name || "";
  const phone = session?.metadata?.phone || "";

  return prisma.attendee.upsert({
    where: { stripeSessionId: session.id },
    update: {
      status: "paid",
      name,
      email,
      phone,
      quantity: q,
    },
    create: {
      name,
      email,
      phone,
      quantity: q,
      status: "paid",
      code: makeCode(),
      stripeSessionId: session.id,
    },
  });
}

/**
 * For the public summary widget.
 */
export async function getCounts() {
  const paid = await prisma.attendee.count({ where: { status: "paid" } });
  const pending = await prisma.attendee.count({ where: { status: "pending" } });
  return { paid, pending };
}

function makeCode() {
  // brief, human-friendly code
  return "SS-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}
