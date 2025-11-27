import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

// --- Constants ---
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Success() {
  // --- React Hooks ---
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // --- State Management ---
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get query parameters
  const sessionId = searchParams.get('session_id');
  const eventId = searchParams.get('eventId');

  // --- Effects ---
  
  // Fetches session details on mount to verify payment
  useEffect(() => {
    if (sessionId) {
      fetchSession();
    } else {
      setError('No session ID provided');
      setLoading(false);
    }
  }, [sessionId]);

  // --- Data Fetching & Handling ---
  
  /** Calls API to retrieve and verify Stripe session details. */
  async function fetchSession() {
    try {
      const response = await fetch(`${API_URL}/api/checkout/success?session_id=${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch session details');
      const data = await response.json();
      setSession(data.session);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- Render Logic: Loading/Error States ---
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Back to Events</button>
      </div>
    );
  }

  // --- Render Logic: Success View ---
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #003B73 0%, #0074D9 50%, #7FDBFF 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '60px 40px',
        borderRadius: '16px',
        maxWidth: '600px',
        textAlign: 'center',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎉</div>
        <h1 style={{ color: '#003B73', marginBottom: '20px' }}>Payment Successful!</h1>
        <p style={{ fontSize: '1.1rem', color: '#495057', marginBottom: '30px' }}>
          Thank you for your registration. You will receive a confirmation email shortly with your ticket and QR code. <br></br> <br></br>(If you don't see it, please check your spam or junk folder.)
        </p>
        
        {session && (
          <div style={{
            background: '#F8FCFF',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '30px',
            textAlign: 'left'
          }}>
            <p><strong>Email:</strong> {session.customerEmail}</p>
            <p><strong>Status:</strong> <span style={{ color: '#28A745', fontWeight: 'bold' }}>Paid</span></p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          {/* Back to Events Button */}
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '14px 28px',
              background: 'linear-gradient(135deg, #0074D9 0%, #003B73 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Back to Events
          </button>
          
          {/* Buy More Tickets Button */}
          {eventId && (
            <button
              onClick={() => navigate(`/event/${eventId}`)}
              style={{
                padding: '14px 28px',
                background: '#6C757D',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Buy More Tickets
            </button>
          )}
        </div>
      </div>
    </div>
  );
}