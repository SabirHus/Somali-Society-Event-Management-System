// server/src/controllers/checkout.controller.js
import { z } from "zod";
import { createCheckoutSession } from "../services/payment.service.js";

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
  // optional: if you already have a different summary, keep yours
  try {
    // lazy import to avoid cycle
    const { getCounts } = await import("../services/attendee.service.js");
    const counts = await getCounts();
    res.json(counts);
  } catch (err) {
    next(err);
  }
}
