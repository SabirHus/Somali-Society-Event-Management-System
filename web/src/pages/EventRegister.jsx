import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import './EventRegister.css';

// --- Constants ---
const API_URL = import.meta.env.VITE_API_URL;

export default function EventRegister() {
  // --- React Hooks ---
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const cancelled = searchParams.get('cancelled');

  // --- State Management ---
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    quantity: 1,
    acceptTerms: false
  });

  // --- Effects ---

  // Fetches event details on component mount or eventId change
  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  // --- Data Fetching & Handling ---

  /** Fetches specific event details and capacity statistics from the public API. */
  async function fetchEvent() {
    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}?includeStats=true`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Event not found');
        }
        throw new Error('Failed to fetch event');
      }
      const data = await response.json();
      
      if (!data.isActive) {
        throw new Error('This event is no longer accepting registrations');
      }
      
      setEvent(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /** Handles changes to form input fields. */
  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }

  /** Handles form submission for creating a Stripe checkout session. */
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // API call to create Stripe session
      const response = await fetch(`${API_URL}/api/checkout/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          eventId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create checkout session');
      }

      // Redirect user to Stripe checkout URL
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
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

  // --- Computed Data ---
  
  if (loading) {
    return (
      <div className="event-register">
        <div className="container">
          <div className="loading">Loading event...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-register">
        <div className="container">
          <div className="error-box">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/')} className="btn btn-secondary">
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalPrice = event.price * formData.quantity;
  // Limit max quantity to 10 or remaining tickets, whichever is lower
  const maxQuantity = Math.min(10, event.remaining);

  // --- Render ---
  return (
    <div className="event-register">
      <div className="container">
        <button onClick={() => navigate('/')} className="back-link">
          ← Back to Events
        </button>

        {cancelled && (
          <div className="alert alert-warning">
            Payment cancelled. You can try again below.
          </div>
        )}

        <div className="register-layout">
          <div className="event-info">
            <h1>{event.name}</h1>
            
            {event.description && (
              <p className="event-description">{event.description}</p>
            )}

            <div className="info-grid">
              {/* Date */}
              <div className="info-item">
                <span className="info-icon">📅</span>
                <div>
                  <div className="info-label">Date</div>
                  <div className="info-value">{formatDate(event.eventDate)}</div>
                </div>
              </div>

              {/* Time */}
              <div className="info-item">
                <span className="info-icon">🕐</span>
                <div>
                  <div className="info-label">Time</div>
                  <div className="info-value">{event.eventTime}</div>
                </div>
              </div>

              {/* Location */}
              <div className="info-item">
                <span className="info-icon">📍</span>
                <div>
                  <div className="info-label">Location</div>
                  <div className="info-value">{event.location}</div>
                </div>
              </div>

              {/* Price */}
              <div className="info-item">
                <span className="info-icon">💷</span>
                <div>
                  <div className="info-label">Price</div>
                  <div className="info-value">{formatPrice(event.price)} per ticket</div>
                </div>
              </div>
            </div>

            {/* Capacity Bar */}
            <div className="capacity-info">
              <div className="capacity-bar">
                <div 
                  className="capacity-fill"
                  style={{ width: `${(event.attendeeCount / event.capacity) * 100}%` }}
                />
              </div>
              <div className="capacity-text">
                {event.remaining} of {event.capacity} tickets remaining
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <div className="register-form-container">
            <h2>Register for Event</h2>

            {event.isFull ? (
              <div className="sold-out-message">
                <h3>Sorry, this event is sold out!</h3>
                <p>All tickets have been claimed.</p>
                <button onClick={() => navigate('/')} className="btn btn-secondary">
                  View Other Events
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="register-form">
                {error && (
                  <div className="alert alert-error">{error}</div>
                )}

                {/* Name Input */}
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={submitting}
                    placeholder="John Smith"
                  />
                </div>

                {/* Email Input */}
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={submitting}
                    placeholder="john@example.com"
                  />
                </div>

                {/* Phone Input */}
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={submitting}
                    placeholder="+44 7700 900000"
                  />
                </div>

                {/* Quantity Select */}
                <div className="form-group">
                  <label htmlFor="quantity">Number of Tickets *</label>
                  <select
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    disabled={submitting}
                  >
                    {[...Array(maxQuantity)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} {i === 0 ? 'ticket' : 'tickets'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Terms Checkbox */}
                <div className="form-group form-group-checkbox">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                      required
                      disabled={submitting}
                    />
                    <span>
                      I accept the{' '}
                      <a href="/terms" target="_blank" rel="noopener noreferrer">
                        Terms & Conditions
                      </a>
                      {' '}and{' '}
                      <a href="/privacy" target="_blank" rel="noopener noreferrer">
                        Privacy Policy
                      </a>
                      {' '}*
                    </span>
                  </label>
                </div>

                {/* Price Summary */}
                <div className="price-summary">
                  <div className="price-row">
                    <span>Ticket Price:</span>
                    <span>{formatPrice(event.price)}</span>
                  </div>
                  <div className="price-row">
                    <span>Quantity:</span>
                    <span>×{formData.quantity}</span>
                  </div>
                  <div className="price-row total">
                    <span>Total:</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                </div>

                {/* Payment Button */}
                <button
                  type="submit"
                  className="btn btn-primary btn-large"
                  disabled={submitting || !formData.acceptTerms}
                >
                  {submitting ? 'Processing...' : `Pay ${formatPrice(totalPrice)}`}
                </button>

                <p className="payment-note">
                  💳 Secure payment powered by Stripe
                  <br />
                  🍎 Apple Pay & Google Pay supported
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}