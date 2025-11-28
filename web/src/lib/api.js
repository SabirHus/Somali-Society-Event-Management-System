// web/src/lib/api.js
// This module provides a centralized, reusable client for all API interactions.

// Base origin for the API; prefer env, fall back to local server port
const ORIGIN = import.meta.env.VITE_API_URL;

// Standard API prefix
const API_BASE = `${ORIGIN}/api`;

/**
 * Universal request wrapper. Handles token inclusion, JSON serialization, and error checking.
 * * @param {string} path - API endpoint path (e.g., '/events' or '/auth/attendees')
 * @param {object} opts - Fetch options (method, body, headers)
 */
async function request(path, opts = {}) {
  // Retrieve admin token from localStorage
  const token = localStorage.getItem('adminToken');
  const headers = { 
    "Content-Type": "application/json", 
    ...(opts.headers || {}) 
  };
  
  // Conditionally add Authorization header for protected routes
  // All API paths starting with /auth or /events (if token exists) are considered protected.
  if (token && (path.startsWith('/auth') || path.includes('/events'))) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle JSON serialization for request body
  const body = opts.body && typeof opts.body !== "string"
    ? JSON.stringify(opts.body)
    : opts.body;

  const res = await fetch(`${API_BASE}${path}`, {
    headers: headers,
    credentials: "include",
    ...opts,
    body: body,
  });

  if (!res.ok) {
    const errorText = await res.text();
    // Throw error with status and text for handling in components
    throw new Error(res.statusText || `HTTP ${res.status}: ${errorText}`);
  }

  // Attempt to parse JSON response, fallback to text if necessary
  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : res.text();
}

/**
 * Exported API methods for use throughout the frontend.
 */
export const api = {
  get:    (p)        => request(p, { method: "GET" }),
  post:   (p, body)  => request(p, { method: "POST", body }),
  put:    (p, body)  => request(p, { method: "PUT", body }),
  delete: (p)        => request(p, { method: "DELETE" }),
}