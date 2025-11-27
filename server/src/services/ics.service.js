// server/src/services/ics.service.js - iCalendar (.ics) Generation Utility

/**
 * Generates an iCalendar (.ics) file string for easy addition to digital calendars (Google, Outlook, Apple).
 * Follows RFC 5545 specifications.
 * @param {object} eventDetails - Details of the event.
 */
export function generateICS({ title, description = "", location = "", startUtc, endUtc, uid, url }) {
  
  /** Formats Date object to required ICS UTC format (YYYYMMDDTHHMMSSZ). */
  const dt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  
  /** Escapes special characters (commas, semicolons) as required by ICS spec. */
  const esc = (s) => s.replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
  
  const icsLines = [
    // --- VCALENDAR Start ---
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SomaliSoc//Event//EN", // Product Identifier
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    
    // --- VEVENT Start ---
    "BEGIN:VEVENT",
    `UID:${uid}`, // Unique identifier for the event
    `DTSTAMP:${dt(new Date())}`, // Timestamp of when the data was generated
    `DTSTART:${dt(startUtc)}`, // Start time (UTC format)
    `DTEND:${dt(endUtc)}`,     // End time (UTC format)
    
    `SUMMARY:${esc(title)}`,
    location ? `LOCATION:${esc(location)}` : "", 
    `URL:${url}`,
    `DESCRIPTION:${esc(description)}`,
    
    // --- VEVENT End ---
    "END:VEVENT",
    
    // --- VCALENDAR End ---
    "END:VCALENDAR"
  ];
  
  // Join the array, filtering out any empty strings (like optional location)
  return icsLines.filter(Boolean).join("\r\n");
}