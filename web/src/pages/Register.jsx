// === web/src/pages/Register.jsx ===
import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

// --- Constants ---
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// --- Data Fetching Helper ---
/** Fetches the overall event capacity summary. */
async function fetchSummary() {
  return api.get("/summary");
}

export default function Register() {
  // --- State Management ---
  const [loading, setLoading] = useState(false);
  const [capacity, setCapacity] = useState(null);
  const [remaining, setRemaining] = useState(null);

  // --- Effects ---
  
  // Loads event summary data and sets up auto-refresh
  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        // Fetches summary: {paid, pending, capacity, remaining}
        const summaryData = await fetchSummary(); 
        if (!alive) return;
        setCapacity(summaryData.capacity);
        setRemaining(summaryData.remaining);
      } catch (err) {
        // Silently fail on summary load if necessary
        console.error("Failed to fetch summary:", err);
      }
    };

    load();

    // Auto-refresh every 10s to update available tickets
    const id = setInterval(load, 10000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // --- Handlers ---
  
  /** Handles the form submission to initiate the Stripe checkout session. */
  async function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    
    // Validate ticket quantity
    payload.quantity = Number(payload.quantity || 1);
    if (Number.isNaN(payload.quantity) || payload.quantity < 1) {
      alert("Please choose at least 1 ticket.");
      return;
    }

    setLoading(true);
    try {
      // Note: This form is hardcoded to EventRegister's API endpoint, 
      // but lacks the eventId field in the form itself. 
      // Assuming this page is meant for a specific event defined server-side 
      // based on the original file context (if this page serves all events).
      const res = await fetch(`${API_URL}/api/checkout/session`, {
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
      
      // Redirect to Stripe checkout page
      window.location.assign(data.url);
    } catch (err) {
      alert(`Failed to start payment: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }

  // --- Render ---
  return (
    <main>
      {/* Header card with navigation links */}
      <div className="card topbar">
        <div className="header-row">
          <h1 className="header-title">Somali Society — Event Registration</h1>
          
          <div className="header-actions">
            <div className="links-wrap">
              <a href="/" className="button">Tickets</a>
              <a href="/admin" className="button">Admin</a>
              <a href="/scan" className="button">Scan</a>
            </div>

            {/* Logo on the far right (using the component's CSS class) */}
            <div className="logo-wrap">
              {/* Assuming logo.png is accessible from the public folder */}
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

      {/* Registration Form */}
      <form className="card" onSubmit={onSubmit}>
        <label>Name<br /><input name="name" required placeholder="Ayaan Ali" /></label><br />
        <label>Email<br /><input name="email" required type="email" placeholder="ayaan@example.com" /></label><br />
        <label>Phone (optional)<br /><input name="phone" placeholder="+44…" /></label><br />
        
        {/* Note: This page currently lacks eventId context, relying on a hardcoded general summary or implied single event */}
        <label>Tickets<br /><input name="quantity" type="number" min="1" max="10" defaultValue="1" /></label><br />
        
        <button disabled={loading} className="button">{loading ? "Redirecting…" : "Pay with Stripe"}</button>
      </form>
    </main>
  );
}