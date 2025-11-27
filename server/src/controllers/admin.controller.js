// server/src/controllers/admin.controller.js - Handlers for Admin-facing Operations

import {
  listAttendees,
  toggleCheckInByCode,
  summary,
} from "../services/attendee.service.js";

/**
 * Controller to list all attendees, supporting optional search queries.
 * Delegates actual logic to attendee.service.js.
 */
export async function adminList(req, res, next) {
  try {
    const q = req.query.q?.trim() || undefined;
    const rows = await listAttendees({ q });
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to toggle the check-in status of an attendee by code (used by the Scanner).
 * Code can be passed in body or params.
 */
export async function adminToggle(req, res, next) {
  try {
    const code = (req.body?.code || req.params?.code || "").trim();
    if (!code) {
      return res.status(400).json({ error: "code_required" });
    }

    const updated = await toggleCheckInByCode(code);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to fetch the event summary (total, checkedIn, capacity).
 */
export async function adminSummary(_req, res, next) {
  try {
    const data = await summary();
    res.json(data);
  } catch (err) {
    next(err);
  }
}