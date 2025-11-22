// server/src/controllers/admin.controller.js
import {
  listAttendees,
  toggleCheckInByCode,
  summary,
} from "../services/attendee.service.js";

export async function adminList(req, res, next) {
  try {
    const q = req.query.q?.trim() || undefined;
    const rows = await listAttendees({ q });
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function adminToggle(req, res, next) {
  try {
    const code = (req.body?.code || req.params?.code || "").trim();
    if (!code) return res.status(400).json({ error: "code_required" });

    const updated = await toggleCheckInByCode(code);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function adminSummary(_req, res, next) {
  try {
    const data = await summary();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function adminLogin(req, res) {
  try {
    const password = (req.body && req.body.password) || "";
    if (!password) return res.status(400).json({ error: "missing_password" });

    if (password === process.env.ADMIN_PASSWORD) {
      // Client will stash this in localStorage and attach as a header to admin calls.
      return res.json({ ok: true });
    }
    return res.status(401).json({ error: "invalid_password" });
  } catch (e) {
    return res.status(500).json({ error: "server_error" });
  }
}

