// server/src/controllers/checkout.controller.js
import { z } from "zod";
import { createCheckoutSession } from "../services/payment.service.js";
import QRCode from 'qrcode';
import { prisma } from '../models/prisma.js';
import Stripe from 'stripe';                       
import { upsertAttendeeFromSession } from '../services/attendee.service.js'; 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' }); 

const payloadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  quantity: z.union([z.string(), z.number()]).transform((v) => Number(v || 1)).pipe(z.number().int().min(1).max(10)),
});

export async function createSession(req, res, next) {
  try {
    const data = payloadSchema.parse(req.body || {});
    const paid = await prisma.attendee.count({ where: { status: "PAID" } });
    const pending = await prisma.attendee.count({ where: { status: "PENDING" } });
    const capacity = Number(process.env.CAPACITY || 100);
    const remaining = Math.max(capacity - (paid + pending), 0);

    // why: avoid overselling when multiple users buy at once
    if (data.quantity > remaining) {
      return res.status(409).json({ message: `Only ${remaining} ticket(s) remaining.` });
    }

    const { url } = await createCheckoutSession(data);
    return res.json({ url });
  } catch (err) {
    return next(err);
  }
}

export async function summary(req, res, next) {
  try {
    const paid = await prisma.attendee.count({ where: { status: "PAID" } });
    const pending = await prisma.attendee.count({ where: { status: "PENDING" } });
    const capacity = Number(process.env.CAPACITY || 100);
    const remaining = Math.max(capacity - (paid + pending), 0);
    res.json({ paid, pending, capacity, remaining });
  } catch (err) {
    next(err);
  }
}
export async function checkoutSuccess(req, res, next) {
  try {
    const session_id = req.query.session_id;
    if (!session_id) return res.status(400).json({ error: "session_id_required" });

    const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ["customer_details"] });
    const customerEmail = session?.customer_details?.email || session?.metadata?.email || null;

    let attendee = null;
    if (customerEmail) {
      attendee = await prisma.attendee.findFirst({
        where: { email: customerEmail },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!attendee) {
      const created = await upsertAttendeeFromSession(session);
      attendee =
        created?.[0] ||
        (customerEmail
          ? await prisma.attendee.findFirst({
              where: { email: customerEmail },
              orderBy: { createdAt: "desc" },
            })
          : null);
    }

    if (!attendee) return res.sendStatus(425);

    const qrDataUrl = await QRCode.toDataURL(attendee.code, { margin: 1, width: 256 });

    const ics =
      `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Somali Society//Event//EN
BEGIN:VEVENT
SUMMARY:Somali Society Event
DTSTART:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTEND:${new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DESCRIPTION=Ticket code: ${attendee.code}
END:VEVENT
END:VCALENDAR`.replace(/\n/g, "\r\n");
    const icsBase64 = Buffer.from(ics, "utf8").toString("base64");
    const googleCalendarUrl =
      "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" +
      encodeURIComponent("Somali Society Event") +
      "&details=" +
      encodeURIComponent(`Ticket code: ${attendee.code}`);

    return res.json({ attendee, qrDataUrl, googleCalendarUrl, icsBase64 });
  } catch (err) {
    next(err);
  }
}

