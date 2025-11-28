import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Scan.css';

// --- Constants ---
const API_URL = import.meta.env.VITE_API_URL || 'https://somali-soc-backend.onrender.com';

export default function Scan() {
  // --- React Hooks & Refs ---
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // --- State Management ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [lastScannedCode, setLastScannedCode] = useState(null);
  const [attendee, setAttendee] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Effects ---

  // Check authentication on component mount
  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    const authTimestamp = localStorage.getItem('authTimestamp');
    const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours

    if (savedToken) {
      // Check if session is still valid
      if (authTimestamp && Date.now() - parseInt(authTimestamp) > SESSION_TIMEOUT) {
        console.warn("Session expired");
        localStorage.removeItem('adminToken');
        localStorage.removeItem('authTimestamp');
        setIsAuthenticated(false);
        setToken(null);
      } else {
        setToken(savedToken);
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Controls camera lifecycle based on 'scanning' state
  useEffect(() => {
    if (scanning) {
      startCamera();
    } else {
      stopCamera();
    }

    // Cleanup function runs on unmount or dependency change
    return () => stopCamera();
  }, [scanning]);

  // --- Utility Functions (Audio Feedback) ---
  function playSound(type) {
    // Uses AudioContext for low-latency sound feedback
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
      case 'success':
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.3;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
      case 'error':
        oscillator.frequency.value = 200;
        gainNode.gain.value = 0.3;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
      case 'warning':
        oscillator.frequency.value = 400;
        gainNode.gain.value = 0.3;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.15);
        break;
      case 'scan':
        oscillator.frequency.value = 600;
        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.05);
        break;
      default:
        break;
    }
  }

  /** Sets a temporary message alert. */
  function showMessage(type, text) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  // --- Camera/Scanning Logic ---

  /** Attempts to start the device camera and QR scanning interval. */
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Start scanning for QR codes every 500ms
        scanIntervalRef.current = setInterval(scanQRCode, 500);
      }
    } catch (err) {
      showMessage('error', 'Failed to access camera: ' + err.message);
      setScanning(false);
    }
  }

  /** Stops the camera stream and clears the scanning interval. */
  function stopCamera() {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
  }

  /** Captures frame from video and attempts to decode QR code using jsQR. */
  async function scanQRCode() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      try {
        const code = window.jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code && code.data) {
          const scannedCode = code.data.trim();
          
          // Only process if it's a new, valid code format
          if (scannedCode !== lastScannedCode && scannedCode.startsWith('SS-')) {
            setLastScannedCode(scannedCode);
            await handleCheckIn(scannedCode);
          }
        }
      } catch (err) {
        console.error('QR scanning error:', err);
      }
    }
  }

  // --- API Handlers ---
  
  /** Checks in attendee by booking code (check-in only, no toggle). */
  async function handleCheckIn(code) {
    if (!token) {
      showMessage('error', 'Not authenticated');
      return;
    }

    setLoading(true);
    playSound('scan');

    try {
      const response = await fetch(`${API_URL}/api/auth/attendees/${code}/checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Check-in failed');
      }

      // Extract attendee from response
      const attendeeData = data.attendee || data;  
      setAttendee(attendeeData);

      // Check if already checked in
      if (attendeeData.alreadyCheckedIn) {
        showMessage('warning', `⚠️ ${attendeeData.name} is already checked in!`);
        playSound('warning');
      } else {
        showMessage('success', `✅ ${attendeeData.name} checked in successfully!`);
        playSound('success');
      }

      // Clear attendee card after 5 seconds
      setTimeout(() => {
        setAttendee(null);
        setLastScannedCode(null);
      }, 5000);

    } catch (err) {
      showMessage('error', err.message);
      playSound('error');
      setAttendee(null);
      
      // Allow retry after 2 seconds
      setTimeout(() => {
        setLastScannedCode(null);
      }, 2000);
    } finally {
      setLoading(false);
    }
  }

  /** Handles check-in via manual code entry. */
  async function handleManualCheckIn(e) {
    e.preventDefault();
    if (manualCode.trim()) {
      await handleCheckIn(manualCode.trim().toUpperCase());
      setManualCode('');
    }
  }

  // --- Render ---

  // Render Login Prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="scan-container">
        <div className="scan-login">
          <h1>Scanner Access</h1>
          <p>You must be logged in as admin</p>
          <button onClick={() => navigate('/admin')} className="btn btn-primary">
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  // Render Scanner Dashboard
  return (
    <div className="scan-container">
      <div className="scan-header">
        <button onClick={() => navigate('/admin')} className="back-btn">
          ← Back to Dashboard
        </button>
        <h1>QR Code Scanner</h1>
      </div>

      {message && (
        <div className={`scan-message scan-message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="scan-content">
        {/* Left Column: Scanner and Manual Entry */}
        <div className="scanner-section">
          <div className="scanner-controls">
            <button
              onClick={() => setScanning(!scanning)}
              className={`btn ${scanning ? 'btn-danger' : 'btn-primary'}`}
            >
              {scanning ? '⏹ Stop Scanner' : '📷 Start Scanner'}
            </button>
          </div>

          {scanning && (
            <div className="camera-container">
              <video ref={videoRef} className="camera-video" playsInline />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div className="scanner-overlay">
                <div className="scanner-box"></div>
              </div>
              <p className="scanner-hint">Position QR code in the box</p>
            </div>
          )}

          <div className="manual-entry">
            <h3>Manual Entry</h3>
            <form onSubmit={handleManualCheckIn}>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter booking code (e.g., SS-ABC12345)"
                disabled={loading}
              />
              <button type="submit" className="btn btn-secondary" disabled={loading}>
                Check In
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Attendee Card Display */}
        {attendee && (
          <div className="attendee-card checked-in">
            <div className="attendee-status">
              <span className="status-icon">✅</span>
              <h2>Checked In</h2>
            </div>
            
            <div className="attendee-details">
              <div className="detail-row">
                <span className="label">Name:</span>
                <span className="value">{attendee.name}</span>
              </div>
              <div className="detail-row">
                <span className="label">Code:</span>
                <span className="value"><code>{attendee.code}</code></span>
              </div>
              <div className="detail-row">
                <span className="label">Email:</span>
                <span className="value">{attendee.email}</span>
              </div>
              {attendee.event && (
                <div className="detail-row">
                  <span className="label">Event:</span>
                  <span className="value">{attendee.event.name}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Script for QR code reading library (Must remain in the JSX output) */}
      <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>
    </div>
  );
}