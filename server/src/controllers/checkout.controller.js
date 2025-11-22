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
    const { url } = await createCheckoutSession(data);
    return res.json({ url });
  } catch (err) {
    return next(err);
  }
}

export async function summary(req, res, next) {
  try {
    const { summary } = await import('../services/attendee.service.js');
    const counts = await summary();
    res.json(counts);
  } catch (err) {
    next(err);
  }
}

export async function checkoutSuccess(req, res, next) {
  try {
    const session_id = req.query.session_id;
    if (!session_id) return res.status(400).json({ error: 'session_id_required' });

    // Always fetch the Stripe session so we can use customer_details/email
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['customer_details'],
    });

    const customerEmail =
      session?.customer_details?.email ||
      session?.metadata?.email ||
      null;

    let attendee = null;

    // 1) Try to find the attendee by email (works with your current schema)
    if (customerEmail) {
      attendee = await prisma.attendee.findFirst({
        where: { email: customerEmail },
        orderBy: { createdAt: 'desc' },
      });
    }

    // 2) If not found yet, create now (idempotent – guarded by your P2002 try/catch)
    if (!attendee) {
      const created = await upsertAttendeeFromSession(session);
      attendee =
        created?.[0] ||
        (customerEmail
          ? await prisma.attendee.findFirst({
              where: { email: customerEmail },
              orderBy: { createdAt: 'desc' },
            })
          : null);
    }

    // 3) If still not there, ask client to retry shortly (Success.jsx keeps polling)
    if (!attendee) return res.sendStatus(425);

    // 4) Build the payload your Success.jsx expects
    const qrDataUrl = await QRCode.toDataURL(attendee.code, { margin: 1, width: 256 });

    const ics =
      `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Somali Society//Event//EN
BEGIN:VEVENT
SUMMARY:Somali Society Event
DTSTART:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DESCRIPTION=Ticket code: ${attendee.code}
END:VEVENT
END:VCALENDAR`.replace(/\n/g, '\r\n');

    const icsBase64 = Buffer.from(ics, 'utf8').toString('base64');
    const googleCalendarUrl =
      'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent('Somali Society Event') +
      '&details=' + encodeURIComponent(`Ticket code: ${attendee.code}`);

    return res.json({
      attendee,
      qrDataUrl,
      googleCalendarUrl,
      icsBase64,
    });
  } catch (err) {
    next(err);
  }
}

