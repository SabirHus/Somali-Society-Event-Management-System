import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Admin() {
  const navigate = useNavigate();
  
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  
  // View State
  const [view, setView] = useState('login'); // login, events, attendees, create-event
  
  // Data State
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [summary, setSummary] = useState(null);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Edit Event State
  const [editingEvent, setEditingEvent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    location: '',
    eventDate: '',
    eventTime: '',
    price: '',
    capacity: ''
  });

// Sorting State - ADD THIS WITH YOUR OTHER STATE
const [sortConfig, setSortConfig] = useState({
  key: null,
  direction: 'asc'
});

const [attendeeSortConfig, setAttendeeSortConfig] = useState({
  key: null,
  direction: 'asc'
});

  // Login Form State
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // Create Event Form State
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    location: '',
    eventDate: '',
    eventTime: '',
    price: '',
    capacity: '',
    stripePriceId: ''
  });

  // Check authentication on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
      setView('events');
      fetchEvents(savedToken);
    }
  }, []);

  // ============================================
  // AUTHENTICATION FUNCTIONS
  // ============================================

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('adminToken', data.token);
      setToken(data.token);
      setIsAuthenticated(true);
      setView('events');
      fetchEvents(data.token);
    } catch (err) {
      setError(err.message);
      setLoginForm({
      email: '',
      password: ''
      });
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    if (!window.confirm("Are you sure you want to log out of the Admin Dashboard?")) {
    return;
  }
    localStorage.removeItem('adminToken');
    setToken(null);
    setIsAuthenticated(false);
    setView('login');
    setEvents([]);
    setAttendees([]);
    setSelectedEvent(null);
  }

  // ============================================
  // EVENT FUNCTIONS
  // ============================================

  async function fetchEvents(authToken = token) {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/events?includeStats=true`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateEvent(e) {
    e.preventDefault();

    if (!window.confirm(`Are you sure you want to create the event: "${eventForm.name}"?`)) {
    return; // Stop execution if the user cancels
  }
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...eventForm,
          price: parseFloat(eventForm.price),
          capacity: parseInt(eventForm.capacity)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create event');
      }

      alert('Event created successfully!');
      setEventForm({
        name: '',
        description: '',
        location: '',
        eventDate: '',
        eventTime: '',
        price: '',
        capacity: '',
        stripePriceId: ''
      });
      setView('events');
      fetchEvents();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleEditFormChange(e) {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleUpdateEvent(e) {
    e.preventDefault();
    
    if (!token) {
      alert('Not authenticated');
      return;
    }

    if (!window.confirm(`Confirm save changes for event: "${editFormData.name}"?`)) {
    return; // Stop execution if the user cancels
  }

    try {
      const response = await fetch(`${API_URL}/api/auth/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editFormData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update event');
      }

      alert('Event updated successfully!');
      setEditingEvent(null);
      fetchEvents();
    } catch (error) {
      console.error('Update event error:', error);
      alert('Failed to update event: ' + error.message);
    }
  }

  async function handleDeleteEvent(eventId, eventName, attendeeCount) {
    let confirmMessage = `Are you sure you want to delete "${eventName}"?`;
    
    if (attendeeCount > 0) {
      confirmMessage = `⚠️ WARNING: "${eventName}" has ${attendeeCount} registered attendees!\n\nThis will permanently delete the event and all attendees.\n\nContinue?`;
    }
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete event');
      }

      alert(`Event "${eventName}" deleted successfully`);
      fetchEvents();
    } catch (error) {
      console.error('Delete event error:', error);
      alert('Failed to delete event: ' + error.message);
    }
  }

  async function toggleEventActive(eventId, currentStatus) {
    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (!response.ok) throw new Error('Failed to update event');
      
      fetchEvents();
    } catch (err) {
      setError(err.message);
    }
  }

// ============================================
// SORTING FUNCTIONS - ADD THIS SECTION
// ============================================

function handleSort(key) {
  let direction = 'asc';
  
  if (sortConfig.key === key && sortConfig.direction === 'asc') {
    direction = 'desc';
  }
  
  setSortConfig({ key, direction });
}

function handleAttendeeSort(key) {
  let direction = 'asc';
  
  if (attendeeSortConfig.key === key && attendeeSortConfig.direction === 'asc') {
    direction = 'desc';
  }
  
  setAttendeeSortConfig({ key, direction });
}

function getSortArrow(columnKey, config) {
  if (!config || config.key !== columnKey) {
    return '⇅';
  }
  return config.direction === 'asc' ? '↑' : '↓';
}

// Sort events
const sortedEvents = [...events].sort((a, b) => {
  if (!sortConfig.key) return 0;
  
  let aValue = a[sortConfig.key];
  let bValue = b[sortConfig.key];
  
  // Handle different data types
  if (sortConfig.key === 'eventDate') {
    aValue = new Date(aValue);
    bValue = new Date(bValue);
  } else if (sortConfig.key === 'price' || sortConfig.key === 'capacity' || sortConfig.key === 'attendeeCount') {
    aValue = parseFloat(aValue);
    bValue = parseFloat(bValue);
  } else if (sortConfig.key === 'isActive') {
    aValue = a.isActive ? 1 : 0;
    bValue = b.isActive ? 1 : 0;
  } else if (typeof aValue === 'string') {
    aValue = aValue.toLowerCase();
    bValue = bValue.toLowerCase();
  }
  
  if (aValue < bValue) {
    return sortConfig.direction === 'asc' ? -1 : 1;
  }
  if (aValue > bValue) {
    return sortConfig.direction === 'asc' ? 1 : -1;
  }
  return 0;
});

  const filteredAttendees = attendees.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

// Sort attendees
const sortedAttendees = [...filteredAttendees].sort((a, b) => {
  if (!attendeeSortConfig.key) return 0;
  
  let aValue = a[attendeeSortConfig.key];
  let bValue = b[attendeeSortConfig.key];
  
  // Handle different data types
  if (attendeeSortConfig.key === 'createdAt') {
    aValue = new Date(aValue);
    bValue = new Date(bValue);
  } else if (attendeeSortConfig.key === 'checkedIn') {
    aValue = a.checkedIn ? 1 : 0;
    bValue = b.checkedIn ? 1 : 0;
  } else if (typeof aValue === 'string') {
    aValue = aValue.toLowerCase();
    bValue = bValue.toLowerCase();
  }
  
  if (aValue < bValue) {
    return attendeeSortConfig.direction === 'asc' ? -1 : 1;
  }
  if (aValue > bValue) {
    return attendeeSortConfig.direction === 'asc' ? 1 : -1;
  }
  return 0;
});

  // ============================================
  // ATTENDEE FUNCTIONS
  // ============================================

  async function fetchEventAttendees(eventId) {
    setLoading(true);
    try {
      const [attendeesRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/api/events/${eventId}/attendees`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/events/${eventId}/summary`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!attendeesRes.ok || !summaryRes.ok) throw new Error('Failed to fetch data');

      const attendeesData = await attendeesRes.json();
      const summaryData = await summaryRes.json();

      setAttendees(attendeesData);
      setSummary(summaryData);
      setSelectedEvent(events.find(e => e.id === eventId));
      setView('attendees');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleCheckIn(code) {
    try {
      const response = await fetch(`${API_URL}/api/auth/attendees/${code}/checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to toggle check-in');
      }

      const data = await response.json();
      const updatedAttendee = data.attendee || data;
      
      setAttendees(prevAttendees => 
        prevAttendees.map(att => 
          att.code === code 
            ? { ...att, checkedIn: updatedAttendee.checkedIn }
            : att
        )
      );
    } catch (error) {
      console.error('Toggle check-in error:', error);
      alert('Failed to toggle check-in: ' + error.message);
    }
  }

  async function handleDeleteAttendee(attendeeId, attendeeName) {
    if (!confirm(`Are you sure you want to delete ${attendeeName}? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/attendees/${attendeeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete attendee');
      }

      alert(`${attendeeName} deleted successfully`);
      
      // Refresh attendee list
      if (selectedEvent) {
        fetchEventAttendees(selectedEvent.id);
      }
    } catch (error) {
      console.error('Delete attendee error:', error);
      alert('Failed to delete attendee: ' + error.message);
    }
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  function formatPrice(price) {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price);
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // ============================================
  // RENDER: LOGIN VIEW
  // ============================================

  if (!isAuthenticated) {
    return (
      <div className="admin-container">
        <div className="admin-login">
          <h1>Admin Login</h1>
          <p>Somali Society Salford</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ marginTop: '20px' }}>
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: MAIN ADMIN VIEW
  // ============================================

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-nav">
          <button onClick={() => navigate('/')} className="btn-backMain">
            ← Back to Main Page
          </button>
          <button onClick={() => setView('events')} className={view === 'events' ? 'active' : ''}>
            Events
          </button>
          <button onClick={() => setView('create-event')} className={view === 'create-event' ? 'active' : ''}>
            Create Event
          </button>
          <button onClick={() => navigate('/scan')} className="btn-scan">
            Scanner
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* EVENTS LIST VIEW */}
      {view === 'events' && (
        <div className="admin-content">
          <h2>All Events</h2>
          {loading ? (
            <div className="loading">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="empty-state">
              <p>No events created yet.</p>
              <button onClick={() => setView('create-event')} className="btn btn-primary">
                Create First Event
              </button>
            </div>
          ) : (
            <div className="events-table">
              <table>
                <thead>
  <tr>
    <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
      EVENT NAME {getSortArrow('name', sortConfig)}
    </th>
    <th onClick={() => handleSort('eventDate')} style={{ cursor: 'pointer' }}>
      DATE {getSortArrow('eventDate', sortConfig)}
    </th>
    <th onClick={() => handleSort('location')} style={{ cursor: 'pointer' }}>
      LOCATION {getSortArrow('location', sortConfig)}
    </th>
    <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>
      PRICE {getSortArrow('price', sortConfig)}
    </th>
    <th onClick={() => handleSort('attendeeCount')} style={{ cursor: 'pointer' }}>
      SOLD {getSortArrow('attendeeCount', sortConfig)}
    </th>
    <th>REVENUE</th>
    <th onClick={() => handleSort('isActive')} style={{ cursor: 'pointer' }}>
      STATUS {getSortArrow('isActive', sortConfig)}
    </th>
    <th>ACTIONS</th>
  </tr>
</thead>
                <tbody>
                  {sortedEvents.map(event => (
                    <tr key={event.id}>
                      <td><strong>{event.name}</strong></td>
                      <td>{formatDate(event.eventDate)}</td>
                      <td>{event.location}</td>
                      <td>{formatPrice(event.price)}</td>
                      <td>{event.attendeeCount} / {event.capacity}</td>
                      <td>{formatPrice(event.attendeeCount * event.price)}</td>
                      <td>
                        <span className={`badge ${event.isActive ? 'badge-active' : 'badge-inactive'}`}>
                          {event.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="event-actions">
                          <button
                            onClick={() => fetchEventAttendees(event.id)}
                            className="btn btn-small"
                          >
                            View Attendees
                          </button>
                          <button
                            onClick={() => navigate(`/admin/events/${event.id}/edit`)}
                            className="btn btn-small"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleEventActive(event.id, event.isActive)}
                            className="btn btn-small"
                          >
                            {event.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id, event.name, event.attendeeCount)}
                            className="btn btn-delete"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE EVENT VIEW */}
      {view === 'create-event' && (
        <div className="admin-content">
          <h2>Create New Event</h2>
          <form onSubmit={handleCreateEvent} className="event-form">
            <div className="form-row">
              <div className="form-group">
                <label>Event Name *</label>
                <input
                  type="text"
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  required
                  placeholder="Somali Cultural Night"
                />
              </div>

              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  required
                  placeholder="Salford Community Centre"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Brief description of the event..."
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={eventForm.eventDate}
                  onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Time *</label>
                <input
                  type="text"
                  value={eventForm.eventTime}
                  onChange={(e) => setEventForm({ ...eventForm, eventTime: e.target.value })}
                  required
                  placeholder="7:00 PM - 11:00 PM"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Price (£) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={eventForm.price}
                  onChange={(e) => setEventForm({ ...eventForm, price: e.target.value })}
                  required
                  placeholder="20.00"
                />
              </div>

              <div className="form-group">
                <label>Capacity *</label>
                <input
                  type="number"
                  value={eventForm.capacity}
                  onChange={(e) => setEventForm({ ...eventForm, capacity: e.target.value })}
                  required
                  placeholder="100"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Stripe Price ID *</label>
              <input
                type="text"
                value={eventForm.stripePriceId}
                onChange={(e) => setEventForm({ ...eventForm, stripePriceId: e.target.value })}
                required
                placeholder="price_1234567890abcdef"
              />
              <small>Get this from your Stripe Dashboard → Products</small>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Event'}
              </button>
              <button
                type="button"
                onClick={() => setView('events')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ATTENDEES VIEW */}
      {view === 'attendees' && selectedEvent && (
        <div className="admin-content">
          <button onClick={() => setView('events')} className="back-btn">
            ← Back to Events
          </button>

          <h2>{selectedEvent.name} - Attendees</h2>

          {summary && (
            <div className="summary-cards">
              <div className="summary-card">
                <div className="summary-value">{summary.totalAttendees}</div>
                <div className="summary-label">Total Attendees</div>
              </div>
              <div className="summary-card">
                <div className="summary-value">{summary.checkedIn}</div>
                <div className="summary-label">Checked In</div>
              </div>
              <div className="summary-card">
                <div className="summary-value">{summary.remaining}</div>
                <div className="summary-label">Tickets Left</div>
              </div>
              <div className="summary-card">
                <div className="summary-value">{formatPrice(summary.revenue)}</div>
                <div className="summary-label">Total Revenue</div>
              </div>
            </div>
          )}

          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name, email, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="attendees-table">
            <table>
<thead>
  <tr>
    <th onClick={() => handleAttendeeSort('name')} style={{ cursor: 'pointer' }}>
      NAME {getSortArrow('name', attendeeSortConfig)}
    </th>
    <th onClick={() => handleAttendeeSort('email')} style={{ cursor: 'pointer' }}>
      EMAIL {getSortArrow('email', attendeeSortConfig)}
    </th>
    <th onClick={() => handleAttendeeSort('phone')} style={{ cursor: 'pointer' }}>
      PHONE {getSortArrow('phone', attendeeSortConfig)}
    </th>
    <th onClick={() => handleAttendeeSort('code')} style={{ cursor: 'pointer' }}>
      CODE {getSortArrow('code', attendeeSortConfig)}
    </th>
    <th onClick={() => handleAttendeeSort('checkedIn')} style={{ cursor: 'pointer' }}>
      CHECKED IN {getSortArrow('checkedIn', attendeeSortConfig)}
    </th>
    <th onClick={() => handleAttendeeSort('createdAt')} style={{ cursor: 'pointer' }}>
      REGISTERED {getSortArrow('createdAt', attendeeSortConfig)}
    </th>
    <th>Edit</th>
    <th>Delete</th>
  </tr>
</thead>
              <tbody>
                {filteredAttendees.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                      No attendees found
                    </td>
                  </tr>
                ) : (
                  sortedAttendees.map(attendee => (
                    <tr key={attendee.id}>
                      <td>{attendee.name}</td>
                      <td>{attendee.email}</td>
                      <td>{attendee.phone || 'N/A'}</td>
                      <td><code>{attendee.code}</code></td>
                      <td>
                        <button
                          onClick={() => handleToggleCheckIn(attendee.code)}
                          className={`badge ${attendee.checkedIn ? 'badge-success' : 'badge-pending'}`}
                          style={{ cursor: 'pointer', border: 'none' }}
                        >
                          {attendee.checkedIn ? 'YES' : 'NO'}
                        </button>
                      </td>
                      <td>{new Date(attendee.createdAt).toLocaleDateString()}</td>
                      <td>
  <button
    onClick={() => navigate(`/admin/attendees/${attendee.id}/edit`)}
    className="btn-edit"
  >
    Edit
  </button>
</td>
<td>
  <button
    onClick={() => handleDeleteAttendee(attendee.id, attendee.name)}
    className="btn-delete"
  >
    Delete
  </button>
</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT EVENT MODAL */}
      {editingEvent && (
        <div className="modal-overlay" onClick={() => setEditingEvent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Event</h2>
              <button onClick={() => setEditingEvent(null)} className="close-btn">×</button>
            </div>
            
            <form onSubmit={handleUpdateEvent} className="edit-form">
              <div className="form-group">
                <label>Event Name *</label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditFormChange}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  name="location"
                  value={editFormData.location}
                  onChange={handleEditFormChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Event Date *</label>
                  <input
                    type="date"
                    name="eventDate"
                    value={editFormData.eventDate}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Event Time *</label>
                  <input
                    type="text"
                    name="eventTime"
                    value={editFormData.eventTime}
                    onChange={handleEditFormChange}
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
                    value={editFormData.price}
                    onChange={handleEditFormChange}
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
                    value={editFormData.capacity}
                    onChange={handleEditFormChange}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setEditingEvent(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}