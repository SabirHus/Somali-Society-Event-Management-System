import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Admin.css';

// --- Constants ---
const API_URL = import.meta.env.VITE_API_URL || 'https://somali-soc-backend.onrender.com';

export default function EditAttendee() {
  // --- React Hooks ---
  const { attendeeId } = useParams();
  const navigate = useNavigate();
  
  // --- State Management ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    checkedIn: false
  });
  const [eventName, setEventName] = useState('');

  // --- Effects ---

  // Fetches attendee details on component mount or ID change
  useEffect(() => {
    fetchAttendeeDetails();
  }, [attendeeId]);

  // --- Data Fetching & Handling ---

  /** Fetches specific attendee details using the stored admin token. */
  async function fetchAttendeeDetails() {
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      navigate('/admin');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/attendees/${attendeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch attendee');
      
      const attendee = await response.json();
      // Initialize form data with fetched values
      setFormData({
        name: attendee.name,
        email: attendee.email,
        phone: attendee.phone || '',
        checkedIn: attendee.checkedIn
      });
      setEventName(attendee.event?.name || 'Unknown Event');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /** Handles changes to form input fields (including checkbox). */
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  /** Handles form submission for updating the attendee. */
  async function handleSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      alert('Not authenticated');
      return;
    }

    // Mandatory confirmation check before sending the request
    if (!window.confirm(`Confirm save changes for attendee: "${formData.name}"?`)) {
      return; 
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/attendees/${attendeeId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update attendee');
      }

      alert('Attendee updated successfully!');
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
            <h1>Edit Attendee</h1>
            <button onClick={handleCancel} className="back-btn-inline">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="admin-content">
        {error && <div className="alert alert-error">{error}</div>}

        {loading && !formData.name ? (
          <div className="loading">Loading attendee...</div>
        ) : (
          <>
            <div className="edit-page-title">
              <h2>Editing: <span className="highlight-text">{formData.name}</span></h2>
              <div className="event-badge">
                <strong>EVENT:</strong> {eventName}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="event-form">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="checkedIn"
                    checked={formData.checkedIn}
                    onChange={handleChange}
                  />
                  <span>Checked In</span>
                </label>
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