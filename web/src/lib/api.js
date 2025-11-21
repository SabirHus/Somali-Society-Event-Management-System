const base = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function get(path) {
  const r = await fetch(base + path, { credentials: "include" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function post(path, body) {
  const r = await fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body || {})
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
