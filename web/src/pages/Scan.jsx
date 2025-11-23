import React, { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Scan() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scannerMode, setScannerMode] = useState('manual'); // 'manual' or 'camera'
  const [cameraError, setCameraError] = useState('');
  
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  // Initialize QR scanner
  useEffect(() => {
    if (scannerMode === 'camera') {
      startScanner();
    }
    
    return () => {
      stopScanner();
    };
  }, [scannerMode]);

  const startScanner = async () => {
    try {
      setCameraError('');
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      const videoInputDevices = await codeReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        setCameraError('No camera found on this device');
        return;
      }

      // Prefer back camera on mobile
      const selectedDevice = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back')
      ) || videoInputDevices[0];

      await codeReader.decodeFromVideoDevice(
        selectedDevice.deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const scannedCode = result.getText();
            console.log('QR Code scanned:', scannedCode);
            handleCheckIn(scannedCode);
          }
          if (error && error.name !== 'NotFoundException') {
            console.error('Scanner error:', error);
          }
        }
      );
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setCameraError('Failed to access camera. Please enable camera permissions.');
    }
  };

  const stopScanner = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
  };

  const handleCheckIn = async (ticketCode) => {
    if (loading || !ticketCode.trim()) return;
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        setResult({
          status: 'error',
          message: '❌ Not authenticated. Please login.'
        });
        setTimeout(() => {
          window.location.href = '/admin';
        }, 2000);
        return;
      }

      const response = await fetch(`${API_URL}/api/admin/toggle-checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: ticketCode.trim() })
      });

      if (!response.ok) {
        throw new Error('Invalid code or payment pending');
      }

      const attendee = await response.json();
      
      setResult({
        status: attendee.checkedIn ? 'success' : 'already',
        message: attendee.checkedIn 
          ? `✅ ${attendee.name} checked in!`
          : `⚠️ ${attendee.name} already checked in`,
        attendee
      });
      
      setCode('');
      
      // Auto-reset after 3 seconds
      setTimeout(() => {
        setResult(null);
      }, 3000);
      
    } catch (err) {
      setResult({
        status: 'error',
        message: '❌ Invalid ticket code or payment pending'
      });
      
      setTimeout(() => {
        setResult(null);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    handleCheckIn(code);
  };

  const toggleMode = () => {
    setScannerMode(prev => prev === 'manual' ? 'camera' : 'manual');
    setResult(null);
    setCode('');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>🎫 Check-In</h1>
      
      {/* Mode Toggle */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '30px',
        justifyContent: 'center'
      }}>
        <button
          onClick={() => setScannerMode('manual')}
          style={{
            padding: '10px 20px',
            background: scannerMode === 'manual' ? '#1a73e8' : '#e0e0e0',
            color: scannerMode === 'manual' ? 'white' : '#333',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          ⌨️ Manual Entry
        </button>
        <button
          onClick={() => setScannerMode('camera')}
          style={{
            padding: '10px 20px',
            background: scannerMode === 'camera' ? '#1a73e8' : '#e0e0e0',
            color: scannerMode === 'camera' ? 'white' : '#333',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          📷 Scan QR
        </button>
      </div>

      {/* Manual Entry Mode */}
      {scannerMode === 'manual' && (
        <form onSubmit={handleManualSubmit} style={{ marginBottom: '30px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Enter Ticket Code:
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="SS-..."
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                boxSizing: 'border-box',
                textTransform: 'uppercase'
              }}
              disabled={loading}
              autoFocus
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || !code.trim()}
            style={{
              width: '100%',
              padding: '14px',
              background: (loading || !code.trim()) ? '#ccc' : '#1a73e8',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: (loading || !code.trim()) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Checking...' : 'Check In'}
          </button>
        </form>
      )}

      {/* Camera Scanner Mode */}
      {scannerMode === 'camera' && (
        <div style={{ marginBottom: '30px' }}>
          {cameraError ? (
            <div style={{
              padding: '20px',
              background: '#ffe6e6',
              borderRadius: '8px',
              color: '#d32f2f',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              {cameraError}
            </div>
          ) : (
            <>
              <div style={{ 
                position: 'relative',
                width: '100%',
                maxWidth: '500px',
                margin: '0 auto 20px',
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#000'
              }}>
                <video
                  ref={videoRef}
                  style={{ 
                    width: '100%',
                    height: 'auto',
                    display: 'block'
                  }}
                />
                
                {/* Scanning overlay */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '80%',
                  height: '80%',
                  border: '3px solid #4caf50',
                  borderRadius: '12px',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                  pointerEvents: 'none'
                }} />
              </div>
              
              <div style={{
                padding: '15px',
                background: '#e3f2fd',
                borderRadius: '8px',
                textAlign: 'center',
                fontSize: '14px',
                color: '#1565c0'
              }}>
                📱 <strong>Position QR code within the frame</strong>
                <br />
                Scanning will happen automatically
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Result Display */}
      {result && (
        <div style={{
          padding: '40px 20px',
          borderRadius: '12px',
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          marginBottom: '20px',
          background: result.status === 'success' ? '#4caf50' :
                     result.status === 'already' ? '#ff9800' : '#f44336',
          color: 'white',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
        }}>
          {result.message}
          {result.attendee && (
            <div style={{ marginTop: '20px', fontSize: '16px', fontWeight: 'normal' }}>
              <p style={{ margin: '8px 0' }}>📧 {result.attendee.email}</p>
              <p style={{ margin: '8px 0' }}>🎟️ Tickets: {result.attendee.quantity}</p>
            </div>
          )}
        </div>
      )}
      
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <a 
          href="/admin" 
          style={{ 
            color: '#1a73e8', 
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          ← Back to Admin Dashboard
        </a>
      </div>
    </div>
  );
}