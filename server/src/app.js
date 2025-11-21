// web/src/lib/api.js

// Where your API lives (falls back to 4000 in dev)
export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000";

// Small fetch helpers with JSON + credentials by default
async function jsonFetch(url, init = {}) {
  const res = await fetch(url, {
    credentials: "include",
    ...init,
  });
  // Non-2xx still try to parse JSON so UI can show a message
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(data?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  get(path, init = {}) {
    return jsonFetch(`${API_URL}${path}`, init);
  },
  post(path, body = {}, init = {}) {
    return jsonFetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
      body: JSON.stringify(body),
      ...init,
    });
  },
  del(path, init = {}) {
    return jsonFetch(`${API_URL}${path}`, {
      method: "DELETE",
      ...init,
    });
  },
};

// Also offer a default export for flexibility
export default api;
