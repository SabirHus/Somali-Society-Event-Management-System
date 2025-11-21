import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function Scan() {
  const [result, setResult] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    // Avoid double init during HMR
    if (scannerRef.current) return;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
    };

    const scanner = new Html5QrcodeScanner("qr-reader", config, false);
    scannerRef.current = scanner;

    scanner.render(
      (decodedText /*, decodedResult */) => {
        setResult(decodedText);
        // Optionally stop scanning after first success:
        scanner.clear().catch(() => {});
      },
      (errorMessage) => {
        // ignore continuous scan errors
        // console.debug(errorMessage);
      }
    );

    return () => {
      scanner.clear().catch(() => {});
      scannerRef.current = null;
    };
  }, []);

  return (
    <main className="card">
      <h1>Scan Ticket</h1>
      <div id="qr-reader" style={{ width: 320, maxWidth: "100%" }} />
      <div style={{ marginTop: 12 }}>
        {result ? (
          <>
            <strong>Last scan:</strong>
            <pre>{result}</pre>
          </>
        ) : (
          <em>Point your camera at the QR code…</em>
        )}
      </div>
    </main>
  );
}
