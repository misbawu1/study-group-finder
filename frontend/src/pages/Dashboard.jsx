import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) {
      navigate('/login')
    } else {
      setUser(JSON.parse(stored))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (!user) return null

  return (
    <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Navbar */}
      <div style={{ background: '#2E75B6', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: 'white', margin: 0 }}>📚 Study Group Finder</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'white' }}>👋 {user.name}</span>
          <button onClick={handleLogout}
            style={{ padding: '8px 16px', background: 'white', color: '#2E75B6', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Welcome Card */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#2E75B6', marginTop: 0 }}>Welcome back, {user.name}! 🎉</h2>
          <p style={{ color: '#666', margin: 0 }}>Course: <strong>{user.course || 'Not set'}</strong></p>
          <p style={{ color: '#666', margin: '0.5rem 0 0' }}>Email: <strong>{user.email}</strong></p>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'My Groups', value: '0', icon: '👥' },
            { label: 'Active Sessions', value: '0', icon: '📅' },
            { label: 'Messages', value: '0', icon: '💬' },
          ].map((stat, i) => (
            <div key={i} style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '2rem' }}>{stat.icon}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2E75B6' }}>{stat.value}</div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#2E75B6', marginTop: 0 }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[
  { label: '➕ Create Study Group', bg: '#2E75B6', action: () => navigate('/groups') },
  { label: '🔍 Find a Group', bg: '#27AE60', action: () => navigate('/groups') },
  { label: '👤 Edit Profile', bg: '#E67E22', action: () => {} },
].map((btn, i) => (
  <button key={i} onClick={btn.action}
    style={{ padding: '12px 20px', background: btn.bg, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
    {btn.label}
  </button>
))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard