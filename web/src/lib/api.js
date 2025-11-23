// web/src/lib/api.js

// Base origin for the API; prefer env, fall back to local server port
const ORIGIN = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Add /api prefix so client calls /api/*
const API_BASE = `${ORIGIN}/api`;

// Minimal axios-like wrapper on top of fetch
async function request(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    credentials: "include",
    ...opts,
    body:
      opts.body && typeof opts.body !== "string"
        ? JSON.stringify(opts.body)
        : opts.body,
  });

  if (!res.ok) throw new Error(await res.text());

  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

export const api = {
  get:  (p)        => request(p, { method: "GET" }),
  post: (p, body)  => request(p, { method: "POST", body }),
}

// Helper: build headers with admin password if we have it
export async function fetchAdminAttendees(password, q = '') {
  const res = await fetch(`/api/admin/attendees${q ? `?q=${encodeURIComponent(q)}` : ''}`, {
    headers: adminHeaders(password),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchAdminSummary(password) {
  const res = await fetch(`/api/admin/summary`, {
    headers: adminHeaders(password),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function toggleCheckin(password, code) {
  const res = await fetch(`/api/admin/checkin/${encodeURIComponent(code)}`, {
    method: 'POST',
    headers: adminHeaders(password),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};
