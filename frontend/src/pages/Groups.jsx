import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function Groups() {
  const [groups, setGroups] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [course, setCourse] = useState('')
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
const [filterCourse, setFilterCourse] = useState('')
  const navigate = useNavigate()

  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user'))
  const filteredGroups = groups.filter(group => {
  const matchSearch = group.name.toLowerCase().includes(search.toLowerCase())
  const matchCourse = filterCourse === '' || group.course.toLowerCase().includes(filterCourse.toLowerCase())
  return matchSearch && matchCourse
})

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/groups', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setGroups(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await axios.post('http://localhost:5000/api/groups',
        { name, description, course },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessage('Group created successfully!')
      setShowForm(false)
      setName(''); setDescription(''); setCourse('')
      fetchGroups()
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error creating group')
    }
  }

  const handleJoin = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/groups/${id}/join`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessage('Joined group!')
      fetchGroups()
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error joining group')
    }
  }

  const handleLeave = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/groups/${id}/leave`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessage('Left group!')
      fetchGroups()
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error leaving group')
    }
  }

  return (
    <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Navbar */}
      <div style={{ background: '#2E75B6', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: 'white', margin: 0 }}>📚 Study Group Finder</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => navigate('/dashboard')}
            style={{ padding: '8px 16px', background: 'transparent', color: 'white', border: '1px solid white', borderRadius: '4px', cursor: 'pointer' }}>
            Dashboard
          </button>
          <button onClick={() => { localStorage.clear(); navigate('/login') }}
            style={{ padding: '8px 16px', background: 'white', color: '#2E75B6', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, color: '#333' }}>Study Groups</h2>
          <button onClick={() => setShowForm(!showForm)}
            style={{ padding: '10px 20px', background: '#2E75B6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            {showForm ? 'Cancel' : '➕ Create Group'}
          </button>
        </div>

        {message && <p style={{ background: '#d4edda', color: '#155724', padding: '10px', borderRadius: '4px', marginBottom: '1rem' }}>{message}</p>}
        {/* Search & Filter */}
<div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
  <input
    type="text"
    placeholder="🔍 Search groups..."
    value={search}
    onChange={e => setSearch(e.target.value)}
    style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', minWidth: '200px' }}
  />
  <input
    type="text"
    placeholder="Filter by course..."
    value={filterCourse}
    onChange={e => setFilterCourse(e.target.value)}
    style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', minWidth: '200px' }}
  />
  {(search || filterCourse) && (
    <button onClick={() => { setSearch(''); setFilterCourse('') }}
      style={{ padding: '10px 16px', background: '#E74C3C', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
      Clear
    </button>
  )}
</div>

        {/* Create Group Form */}
        {showForm && (
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0 }}>Create New Study Group</h3>
            <form onSubmit={handleCreate}>
              <input type="text" placeholder="Group Name" value={name} onChange={e => setName(e.target.value)}
                style={{ width: '100%', padding: '10px', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} required />
              <input type="text" placeholder="Course (e.g. BSc IT)" value={course} onChange={e => setCourse(e.target.value)}
                style={{ width: '100%', padding: '10px', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} required />
              <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)}
                style={{ width: '100%', padding: '10px', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', height: '80px' }} />
              <button type="submit"
                style={{ padding: '10px 24px', background: '#27AE60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Create Group
              </button>
            </form>
          </div>
        )}

        {/* Groups List */}
        {filteredGroups.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '8px', padding: '3rem', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <p style={{ color: '#666', fontSize: '1.1rem' }}>No study groups yet. Be the first to create one!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredGroups.map(group => {
              const isMember = group.members.some(m => m._id === user._id)
              const isCreator = group.creator._id === user._id
              return (
                <div key={group._id} style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem', color: '#2E75B6' }}>{group.name}</h3>
                      <p style={{ margin: '0 0 0.5rem', color: '#666' }}>📚 {group.course}</p>
                      <p style={{ margin: '0 0 0.5rem', color: '#444' }}>{group.description}</p>
                      <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>
                        👥 {group.members.length}/{group.maxMembers} members • Created by {group.creator.name}
                      </p>
                    </div>
                    <div>
                      {isCreator || isMember ? (
  <button onClick={() => navigate(`/chat/${group._id}`)}
    style={{ padding: '8px 16px', background: '#2E75B6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}>
    💬 Chat
  </button>
) : null}
{isCreator ? (
  <span style={{ padding: '6px 12px', background: '#E8F4FD', color: '#2E75B6', borderRadius: '4px', fontSize: '0.85rem' }}>Your Group</span>
) : isMember ? (
                        <button onClick={() => handleLeave(group._id)}
                          style={{ padding: '8px 16px', background: '#E74C3C', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                          Leave
                        </button>
                      ) : (
                        <button onClick={() => handleJoin(group._id)}
                          style={{ padding: '8px 16px', background: '#27AE60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                          Join
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Groups