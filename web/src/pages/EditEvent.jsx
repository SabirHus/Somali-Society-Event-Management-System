import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Admin.css';

// --- Constants ---
const API_URL = import.meta.env.VITE_API_URL;

export default function EditEvent() {
  // --- React Hooks ---
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  // --- State Management ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    eventDate: '',
    eventTime: '',
    price: '',
    capacity: ''
  });

  // --- Effects ---

  // Fetches event details on component mount or eventId change
  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  // --- Data Fetching & Handling ---

  /** Fetches specific event details using the stored admin token. */
  async function fetchEventDetails() {
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      navigate('/admin');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch event');
      
      const event = await response.json();
      // Initialize form data with fetched values
      setFormData({
        name: event.name,
        description: event.description || '',
        location: event.location,
        eventDate: event.eventDate.split('T')[0], // Format date for input type="date"
        eventTime: event.eventTime,
        price: event.price,
        capacity: event.capacity
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /** Handles changes to form input fields. */
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  /** Handles form submission for updating the event. */
  async function handleSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      alert('Not authenticated');
      return;
    }

    // Mandatory confirmation check before sending the request
    if (!window.confirm(`Confirm save changes for event: "${formData.name}"?`)) {
      return; 
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update event');
      }

      alert('Event updated successfully!');
      navigate('/admin'); // Redirect back to dashboard on success
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /** Handles the Cancel button click with mandatory confirmation. */
  const handleCancel = () => {
    // Show confirmation regardless of whether changes were made
    if (window.confirm('Are you sure you want to cancel editing? Any unsaved changes will be lost.')) {
      navigate('/admin');
    }
  };

  // --- Render ---
  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Edit Event</h1>
            <button onClick={handleCancel} className="back-btn-inline">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="admin-content">
        {error && <div className="alert alert-error">{error}</div>}

        {loading && !formData.name ? (
          <div className="loading">Loading event...</div>
        ) : (
          <>
            <div className="edit-page-title">
              <h2>Editing: <span className="highlight-text">{formData.name}</span></h2>
            </div>

            <form onSubmit={handleSubmit} className="event-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Event Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Event Date *</label>
                  <input
                    type="date"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Event Time *</label>
                  <input
                    type="text"
                    name="eventTime"
                    value={formData.eventTime}
                    onChange={handleChange}
                    placeholder="e.g., 19:00-23:00"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (£) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Capacity *</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}