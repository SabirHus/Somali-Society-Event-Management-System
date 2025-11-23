// === web/src/pages/Register.jsx ===
import React, { useEffect, useState } from "react";
import { api } from "../lib/api";


// same API as elsewhere
async function fetchSummary() {
  return api.get("/summary");
}

async function verifyAdmin(pass) {
  const res = await fetch("/api/admin/summary", {
    headers: { "x-admin-password": pass || "" },
  });
  return res.ok;
}

export default function Register() {
const [loading, setLoading] = useState(false);
  const [capacity, setCapacity] = useState(null);
  const [remaining, setRemaining] = useState(null);


  const [hasAdmin, setHasAdmin] = useState(!!localStorage.getItem("ADMIN_PASSWORD"));
  const [adminErr, setAdminErr] = useState("");

 useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const s = await fetchSummary(); // {paid,pending,capacity,remaining}
        if (!alive) return;
        setCapacity(s.capacity);
        setRemaining(s.remaining);
      } catch {}
    };

    load();

        // optional: auto-refresh every 10s so the number drops while page is open
    const id = setInterval(load, 10000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);


  useEffect(() => {
    const pass = localStorage.getItem("ADMIN_PASSWORD");
    if (!pass) return;
    verifyAdmin(pass).then(ok => {
      setHasAdmin(ok);
      if (!ok) localStorage.removeItem("ADMIN_PASSWORD");
    });
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    payload.quantity = Number(payload.quantity || 1);
    if (Number.isNaN(payload.quantity) || payload.quantity < 1) {
      alert("Please choose at least 1 ticket.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/checkout/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.message || data?.error || `HTTP ${res.status} ${res.statusText}`;
        alert(`Failed to start payment: ${msg}`);
        return;
      }
      if (!data?.url) {
        alert("Failed to start payment: No checkout URL.");
        return;
      }
      window.location.assign(data.url);
    } catch (err) {
      alert(`Failed to start payment: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveKey(e) {
    e.preventDefault();
    setAdminErr("");
    const form = e.currentTarget;
    const v = form.adminKey.value.trim();
    form.reset();
    if (!v) {
      setHasAdmin(false);
      localStorage.removeItem("ADMIN_PASSWORD");
      setAdminErr("Please enter a password.");
      return;
    }
    const ok = await verifyAdmin(v);
    if (ok) {
      localStorage.setItem("ADMIN_PASSWORD", v);
      setHasAdmin(true);
      setAdminErr(""); // no success text
    } else {
      localStorage.removeItem("ADMIN_PASSWORD");
      setHasAdmin(false);
      setAdminErr("Incorrect password.");
    }
  }

  return (
    <main>
      {/* Header card with logo at top-right */}
      <div className="card topbar">
        <div className="header-row">
          <h1 className="header-title">Somali Society — Event Registration</h1>
          
          <div className="header-actions">
            <form onSubmit={handleSaveKey} className="inline-form" aria-label="admin unlock">
              <input
                name="adminKey"
                type="password"
                placeholder="Admin password"
                autoComplete="off"
              />
              <button type="submit" className="button">Save</button>
            </form>
            {adminErr && <span className="note error">{adminErr}</span>}
            
            <div className="links-wrap">
              <a href="/" className="button">Tickets</a>
              {hasAdmin && (
                <>
                  <a href="/admin" className="button">Admin</a>
                  <a href="/scan" className="button">Scan</a>
                </>
              )}
            </div>

            {/* Logo on the far right */}
            <div className="logo-wrap">
              <img className="corner-logo" src="/logo.png" alt="Somali Society logo" />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        {remaining !== null && (
          <p><strong>Spaces remaining:</strong> {remaining}/{capacity}</p>
        )}
        <p>Secure payment; QR ticket on success.</p>
      </div>

      <form className="card" onSubmit={onSubmit}>
        <label>Name<br /><input name="name" required placeholder="Ayaan Ali" /></label><br />
        <label>Email<br /><input name="email" required type="email" placeholder="ayaan@example.com" /></label><br />
        <label>Phone (optional)<br /><input name="phone" placeholder="+44…" /></label><br />
        <label>Tickets<br /><input name="quantity" type="number" min="1" max="10" defaultValue="1" /></label><br />
        <button disabled={loading} className="button">{loading ? "Redirecting…" : "Pay with Stripe"}</button>
      </form>
    </main>
  );
}