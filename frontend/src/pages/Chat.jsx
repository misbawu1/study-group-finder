import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { io } from 'socket.io-client'

const socket = io('https://study-group-api-014n.onrender.com')

function Chat() {
  const { groupId } = useParams()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [groupName, setGroupName] = useState('')
  const navigate = useNavigate()
  const bottomRef = useRef(null)

  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user'))

  useEffect(() => {
    if (!token) { navigate('/login'); return }

    socket.emit('joinGroup', groupId)

    axios.get(`https://study-group-api-014n.onrender.com/api/messages/${groupId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setMessages(res.data))

    axios.get('https://study-group-api-014n.onrender.com/api/groups', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      const g = res.data.find(g => g._id === groupId)
      if (g) setGroupName(g.name)
    })

    socket.on('receiveMessage', (data) => {
      setMessages(prev => [...prev, data])
    })

    return () => socket.off('receiveMessage')
  }, [groupId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    const data = {
      groupId,
      senderId: user._id,
      senderName: user.name,
      text,
    }
    socket.emit('sendMessage', data)
    setText('')
  }

  return (
    <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f0f2f5', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#2E75B6', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: 'white', margin: 0 }}>💬 {groupName || 'Group Chat'}</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
  <button onClick={() => navigate('/dashboard')}
    style={{ padding: '8px 16px', background: 'transparent', color: 'white', border: '1px solid white', borderRadius: '4px', cursor: 'pointer' }}>
    Dashboard
  </button>
  <button onClick={() => navigate('/groups')}
    style={{ padding: '8px 16px', background: 'white', color: '#2E75B6', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
    Back to Groups
  </button>
</div>
      </div>

      <div style={{ flex: 1, padding: '1.5rem', maxWidth: '800px', margin: '0 auto', width: '100%', overflowY: 'auto' }}>
        {messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#888' }}>No messages yet. Say hello! 👋</p>
        ) : (
          messages.map((msg, i) => {
            const isMine = msg.senderId === user._id || msg.sender === user._id
            return (
              <div key={i} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{
                  maxWidth: '70%', padding: '10px 14px', borderRadius: '12px',
                  background: isMine ? '#2E75B6' : 'white', color: isMine ? 'white' : '#333',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  {!isMine && <p style={{ margin: '0 0 4px', fontWeight: 'bold', fontSize: '0.8rem', color: '#2E75B6' }}>{msg.senderName}</p>}
            <p style={{ margin: 0 }}>{msg.text}</p>
             {msg.createdAt && (
            <p style={{ margin: '4px 0 0', fontSize: '0.7rem', opacity: 0.7 }}>
             {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
  </p>
)}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.5rem', padding: '1rem', maxWidth: '800px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..."
          style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }} />
        <button type="submit"
          style={{ padding: '12px 24px', background: '#27AE60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          Send
        </button>
      </form>
    </div>
  )
}

export default Chat
