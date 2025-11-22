// === web/src/pages/Scan.jsx ===
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

async function verifyAdmin(pass) {
  const res = await fetch("/api/admin/summary", {
    headers: { "x-admin-password": pass || "" },
  });
  return res.ok;
}

export default function Scan() {
  const [hasAdmin, setHasAdmin] = useState(!!localStorage.getItem("ADMIN_PASSWORD"));
  const [adminErr, setAdminErr] = useState("");

  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const scannerRef = useRef(null);

  useEffect(() => {
    const pass = localStorage.getItem("ADMIN_PASSWORD");
    if (!pass) return;
    verifyAdmin(pass).then(ok => {
      setHasAdmin(ok);
      if (!ok) localStorage.removeItem("ADMIN_PASSWORD");
    });
  }, []);

  const startScanner = useCallback(() => {
    if (!hasAdmin) return;
    if (scannerRef.current) return;

    const config = { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true };
    const scanner = new Html5QrcodeScanner("qr-reader", config, false);
    scannerRef.current = scanner;

    scanner.render(
      async (decodedText) => {
        try { await scanner.clear(); } catch {}
        scannerRef.current = null;

        const code = (decodedText || "").trim();
        setResult(code);

        try {
          const pass = localStorage.getItem("ADMIN_PASSWORD") || "";
          const res = await fetch(`/api/admin/checkin/${encodeURIComponent(code)}`, {
            method: "POST",
            headers: { "x-admin-password": pass },
          });

          if (res.status === 401) {
            setStatus("error");
            setMessage("Not authorized. Enter the correct admin password first.");
            return;
          }
          if (!res.ok) {
            setStatus("error");
            setMessage(`Server error (${res.status}).`);
            return;
          }

          const json = await res.json();
          if (json.checkedIn) {
            setStatus("success");
            setMessage(`Checked in: ${json.name ?? ""} (${json.code})`);
          } else {
            setStatus("already");
            setMessage(`Already checked / undo: ${json.name ?? ""} (${json.code})`);
          }
        } catch {
          setStatus("error");
          setMessage("Network error while calling check-in.");
        }
      },
      () => {}
    );
  }, [hasAdmin]);

  useEffect(() => {
    if (hasAdmin) startScanner();
    return () => { try { scannerRef.current?.clear(); } catch {} scannerRef.current = null; };
  }, [hasAdmin, startScanner]);

  async function handleRescan() {
    setResult(null);
    setStatus("idle");
    setMessage("");
    startScanner();
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
      setTimeout(startScanner, 0);
    } else {
      localStorage.removeItem("ADMIN_PASSWORD");
      setHasAdmin(false);
      setAdminErr("Incorrect password.");
    }
  }

  const bg =
    status === "success" ? "#e6ffed" :
    status === "already" ? "#fff8db" :
    status === "error"   ? "#ffe6e6" :
                           "#f5f5f5";

  return (
    <main>
      <div className="card topbar">
        <div className="header-row">
          <h1 className="header-title">Somali Society — Scan</h1>
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
                  <a href="/admin" className="button">Admin</a>
                  <a href="/admin/scan" className="button">Scan</a>
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
        {!hasAdmin && <em>Enter a valid admin password to enable the scanner.</em>}
        <div id="qr-reader" style={{ width: 320, maxWidth: "100%" }} />
        <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: bg }}>
          {result ? (
            <>
              <div style={{ marginBottom: 6 }}>
                <strong>Last scan:</strong>
                <pre style={{ margin: 0 }}>{result}</pre>
              </div>
              <div>{message || "Processed."}</div>
              <div style={{ marginTop: 8 }}>
                <button onClick={handleRescan} className="button">Rescan</button>
              </div>
            </>
          ) : (
            <em>Point your camera at the QR code…</em>
          )}
        </div>
      </div>
    </main>
  );
}