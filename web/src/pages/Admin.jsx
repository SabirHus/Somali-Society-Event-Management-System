import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setAuthed(true);
      fetchAttendees();
    }
  }, []);

  useEffect(() => {
    if (authed) {
      fetchAttendees();
    }
  }, [searchQuery]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem('adminToken', data.token);
        setAuthed(true);
        await fetchAttendees();
      } else {
        alert('Invalid credentials');
      }
    } catch (err) {
      alert('Login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('adminToken');
    setAuthed(false);
    setEmail('');
    setPassword('');
    setRows([]);
  }

  async function fetchAttendees() {
    try {
      const token = localStorage.getItem('adminToken');
      const url = `${API_URL}/api/admin/attendees${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRows(data);
      } else if (response.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error('Failed to fetch attendees:', err);
    }
  }

  async function handleToggleCheckIn(code) {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/toggle-checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });

      if (response.ok) {
        const updated = await response.json();
        setRows(prev => prev.map(r => r.code === code ? updated : r));
      }
    } catch (err) {
      console.error('Toggle check-in failed:', err);
      alert('Failed to update check-in status');
    }
  }

  // Login Form
  if (!authed) {
    return (
      <div style={{ maxWidth: '400px', margin: '100px auto', padding: '40px', background: '#f5f5f5', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{textAlign: 'center' }}>
        <a 
          href="/" 
          style={{ 
            color: '#1a73e8', 
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: '500'
          }}
        >
          ← Back to Ticket Form
        </a>
      </div>
        <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#1a73e8' }}>🔐 Admin Login</h1>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '6px', 
                border: '1px solid #ddd',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '6px', 
                border: '1px solid #ddd',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '14px', 
              background: loading ? '#ccc' : '#1a73e8', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    );
  }

  // Admin Dashboard
  const paidCount = rows.filter(r => r.status === 'PAID').length;
  const checkedInCount = rows.filter(r => r.checkedIn).length;
  const totalTickets = rows.reduce((sum, r) => sum + r.quantity, 0);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0 }}>📊 Admin Dashboard</h1>
        <div>
          <a href="/" className="button">Tickets</a>
          <a href="/scan" style={{ marginRight: '20px', color: '#1a73e8', textDecoration: 'none', fontWeight: '500' }}>
            📱 Scanner
          </a>
          <button 
            onClick={handleLogout} 
            style={{ 
              padding: '10px 20px', 
              background: '#f44336', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: '#e3f2fd', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1a73e8' }}>{paidCount}</div>
          <div style={{ color: '#666', marginTop: '5px' }}>Paid Registrations</div>
        </div>
        <div style={{ background: '#e8f5e9', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4caf50' }}>{checkedInCount}</div>
          <div style={{ color: '#666', marginTop: '5px' }}>Checked In</div>
        </div>
        <div style={{ background: '#fff3e0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff9800' }}>{totalTickets}</div>
          <div style={{ color: '#666', marginTop: '5px' }}>Total Tickets</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Attendee List */}
      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Phone</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Tickets</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Check-In</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  No attendees found
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{row.name}</td>
                  <td style={{ padding: '12px' }}>{row.email}</td>
                  <td style={{ padding: '12px' }}>{row.phone || '-'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{row.quantity}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: row.status === 'PAID' ? '#e8f5e9' : '#fff3e0',
                      color: row.status === 'PAID' ? '#4caf50' : '#ff9800'
                    }}>
                      {row.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleToggleCheckIn(row.code)}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        fontWeight: '500',
                        cursor: 'pointer',
                        background: row.checkedIn ? '#4caf50' : '#e0e0e0',
                        color: row.checkedIn ? 'white' : '#333'
                      }}
                    >
                      {row.checkedIn ? '✓ Checked In' : 'Check In'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}