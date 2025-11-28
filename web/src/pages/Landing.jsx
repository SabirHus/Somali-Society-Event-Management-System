import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

// --- Constants ---
const API_URL = import.meta.env.VITE_API_URL;

export default function Landing() {
  // --- React Hooks ---
  const navigate = useNavigate();
  
  // --- State Management ---
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Effects ---
  useEffect(() => {
    fetchEvents();
  }, []);

  // --- Data Fetching & Handling ---

  /** Fetches all active events with statistics from the public API. */
  async function fetchEvents() {
    try {
      const response = await fetch(`${API_URL}/api/events?activeOnly=true&includeStats=true`);
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- Utility Functions ---

  /** Formats date string to long locale format. */
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /** Converts price to GB currency string. */
  function formatPrice(price) {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price);
  }

  // --- Render Logic: Loading/Error States ---
  if (loading) {
    return (
      <div className="landing">
        <div className="container">
          <div className="loading">Loading events...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="landing">
        <div className="container">
          <div className="error">Error: {error}</div>
        </div>
      </div>
    );
  }

  // --- Render Logic: Main View ---
  return (
    <div className="landing">
      <header className="landing-header">
        <div className="container header-container">
          <h1>Somali Society Salford</h1>
          <p>Discover and register for upcoming events</p>
        </div>
        {/* Logo element (CSS handles positioning) */}
        <img 
          src="/logo.png" 
          alt="Somali Society Salford Logo"
          className="header-logo"
          // Fallback to a placeholder image if /logo.png fails to load
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://placehold.co/120x120/003B73/ffffff?text=LOGO";
          }}
        />
      </header>

      <div className="container">
        {events.length === 0 ? (
          <div className="no-events">
            <h2>No Events Available</h2>
            <p>Check back soon for upcoming events from Somali Society Salford!</p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((event) => (
              <div key={event.id} className="event-card">
                <div className="event-card-header">
                  <h2>{event.name}</h2>
                  {event.isFull && <span className="badge sold-out">Sold Out</span>}
                </div>
                
                <div className="event-details">
                  <div className="detail">
                    <span className="icon">📅</span>
                    <span>{formatDate(event.eventDate)}</span>
                  </div>
                  <div className="detail">
                    <span className="icon">🕐</span>
                    <span>{event.eventTime}</span>
                  </div>
                  <div className="detail">
                    <span className="icon">📍</span>
                    <span>{event.location}</span>
                  </div>
                  <div className="detail">
                    <span className="icon">💷</span>
                    <span>{formatPrice(event.price)}</span>
                  </div>
                </div>

                {event.description && (
                  <p className="event-description">{event.description}</p>
                )}

                <div className="event-capacity">
                  <div className="capacity-bar">
                    <div 
                      className="capacity-fill"
                      style={{ width: `${(event.attendeeCount / event.capacity) * 100}%` }}
                    />
                  </div>
                  <span className="capacity-text">
                    {event.remaining} / {event.capacity} tickets remaining
                  </span>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/event/${event.id}`)}
                  disabled={event.isFull}
                >
                  {event.isFull ? 'Sold Out' : 'Register Now'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

<footer className="landing-footer">
  <div className="container">
    <p>© 2025 Somali Society Salford. All rights reserved.</p>
    <div className="footer-links">
      <a href="https://www.instagram.com/uos.somsoc/" target="_blank" rel="noopener noreferrer" title="Instagram">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style={{ verticalAlign: 'middle', marginRight: '5px' }}>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
        Instagram
      </a>
      <span className="divider">|</span>
      <a href="https://chat.whatsapp.com/Ba1DrDXZpRo3N4aWrcV6rl" target="_blank" rel="noopener noreferrer" title="WhatsApp">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style={{ verticalAlign: 'middle', marginRight: '5px' }}>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        WhatsApp
      </a>
      <span className="divider">|</span>
      <a href="/admin">Admin</a>
      <span className="divider">|</span>
      <a href="/terms">Terms</a>
      <span className="divider">|</span>
      <a href="/privacy">Privacy</a>
    </div>
  </div>
</footer>
    </div>
  );
}