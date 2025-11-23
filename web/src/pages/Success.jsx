import React,{useEffect,useState} from "react";
import { api } from "../lib/api";

export default function Success(){
  const [data,setData]=useState(null);
  const session_id=new URLSearchParams(window.location.search).get("session_id");

useEffect(() => {
  if (!session_id) return;

  let cancelled = false;

  // poll /checkout/success until the webhook has created the attendee
  (async () => {
    const maxTries = 10;         // ~7–8s total
    let delay = 400;             // ms, grows a bit each time

    for (let i = 1; i <= maxTries && !cancelled; i++) {
      try {
        const r = await api.get(
          `/checkout/success?session_id=${encodeURIComponent(session_id)}`

        );
        if (!cancelled) setData(r);         // { attendee, qrDataUrl, ... }
        return;                                   // ✅ done
      } catch (err) {
        // If server says "not ready yet", wait and try again.
        // Treat 404/409/425/503 as "keep waiting".
        const status = err?.status || err?.response?.status;
        if (![404, 409, 425, 503].includes(status)) break;

        await new Promise(res => setTimeout(res, delay));
        delay = Math.min(1500, Math.round(delay * 1.35));
      }
    }
  })();

  return () => { cancelled = true; };
}, [session_id]);

  // ✅ the two guards you previously had, plus defining `a`
  if (!session_id) return <main><h1>Missing session</h1></main>;
  if (!data)       return <main><h1>Confirming payment…</h1></main>;
  const a = data.attendee;

  return (
    <main>
      <div className="card topbar">
        <div className="header-row">
          <h1 className="header-title">Thank you for your Payment 🎟️</h1>
          
          <div className="header-actions">
            <div className="links-wrap">
              <a href="/" className="button">Tickets</a>
            </div>

            {/* Logo on the far right */}
            <div className="logo-wrap">
              <img className="corner-logo" src="/logo.png" alt="Somali Society logo" />
            </div>

          </div>
        </div>
      </div>

      <div className="card">
        <p><strong>Name:</strong> {a.name}</p>
        <p><strong>Email:</strong> {a.email}</p>
        <p><strong>Tickets:</strong> {a.quantity}</p>
        <p><strong>Status:</strong> Paid</p>
      </div>

      <div className="card">
        <h3>Your QR Ticket</h3>
        <img src={data.qrDataUrl} width="256" height="256" alt="QR"/>
        <p>Show this at the door. Code: <code>{a.code}</code></p>
        <a download={`ticket-${a.code}.png`} href={data.qrDataUrl}><button>Download QR</button></a>
      </div>

      <div className="card">
        <h3>Add to calendar</h3>
        <a href={data.googleCalendarUrl} target="_blank">Google Calendar</a><br/>
        <a href={`data:text/calendar;base64,${data.icsBase64}`} download="somali-society.ics">Download iCal</a>
      </div>

      <div className="card"><p><strong>Refund policy:</strong> Tickets are non-refundable and non-transferable</p>
      </div>
    </main>
  );
}
