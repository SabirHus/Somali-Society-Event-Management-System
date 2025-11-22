// === web/src/pages/Admin.jsx ===
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchAdminAttendees,
  fetchAdminSummary,
  toggleCheckin,
} from "../lib/api.js";

async function verifyAdmin(pass) {
  const res = await fetch("/api/admin/summary", {
    headers: { "x-admin-password": pass || "" },
  });
  return res.ok;
}

export default function Admin() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ paid: 0, pending: 0 });

  const [hasAdmin, setHasAdmin] = useState(!!localStorage.getItem("ADMIN_PASSWORD"));
  const [adminErr, setAdminErr] = useState("");

  useEffect(() => {
    const pass = localStorage.getItem("ADMIN_PASSWORD");
    if (!pass) return;
    verifyAdmin(pass).then(ok => {
      setHasAdmin(ok);
      if (!ok) localStorage.removeItem("ADMIN_PASSWORD");
    });
  }, []);

  useEffect(() => {
    if (!hasAdmin) return;
    (async () => {
      try {
        const s = await fetchAdminSummary();
        setSummary(s);
      } catch {}
    })();
  }, [hasAdmin]);

  useEffect(() => {
    if (!hasAdmin) return;
    let stop = false;
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const list = await fetchAdminAttendees(q);
        if (!stop) setRows(list);
      } catch {} finally {
        if (!stop) setLoading(false);
      }
    }, 250);
    return () => { stop = true; clearTimeout(id); };
  }, [q, hasAdmin]);

  async function onToggle(code) {
    try {
      const updated = await toggleCheckin(code);
      setRows(prev => prev.map(r => (r.code === updated.code ? updated : r)));
    } catch {
      alert("Failed to toggle check-in");
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
      // refresh
      try {
        const s = await fetchAdminSummary();
        setSummary(s);
        const list = await fetchAdminAttendees(q);
        setRows(list);
      } catch {}
    } else {
      localStorage.removeItem("ADMIN_PASSWORD");
      setHasAdmin(false);
      setAdminErr("Incorrect password.");
    }
  }

  const count = useMemo(() => rows.length, [rows]);

  return (
    <main>
      <div className="card topbar">
        <div className="header-row">
          <h1 className="header-title">Somali Society — Admin</h1>
          <div className="header-actions">
            <form onSubmit={handleSaveKey} className="inline-form" aria-label="admin unlock">
              <input name="adminKey" type="password" placeholder="Admin password" autoComplete="off" />
              <button type="submit" className="button">Save</button>
            </form>
            {adminErr && <span className="note error">{adminErr}</span>}
            <div className="links-wrap">
              <a href="/" className="button">Tickets</a>
              {hasAdmin && (
                <>
                  <Link to="/admin" className="button">Admin</Link>
                  <Link to="/admin/scan" className="button">Scan</Link>
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
        {hasAdmin ? (
          <>
            <p>
              <strong>Paid:</strong> {summary.paid} &nbsp;|&nbsp;{" "}
              <strong>Pending:</strong> {summary.pending}
            </p>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input
                placeholder="Search name / email / code…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </>
        ) : (
          <em>Enter a valid admin password to access the admin tools.</em>
        )}
      </div>

      {hasAdmin && (
        <div className="card">
          <table width="100%">
            <thead>
              <tr>
                <th align="left">Name</th>
                <th align="left">Email</th>
                <th align="left">Phone</th>
                <th align="left">Code</th>
                <th align="left">Status</th>
                <th align="left">Checked-in</th>
                <th align="left"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.code}>
                  <td>{r.name}</td>
                  <td>{r.email}</td>
                  <td>{r.phone}</td>
                  <td><code>{r.code}</code></td>
                  <td>{r.status}</td>
                  <td>{r.checkedIn ? "Yes" : "No"}</td>
                  <td>
                    <button className="button" onClick={() => onToggle(r.code)}>
                      {r.checkedIn ? "Un-check" : "Check in"}
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length && !loading && (
                <tr>
                  <td colSpan={7}><em>No attendees found.</em></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}