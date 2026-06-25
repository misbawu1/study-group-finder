import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'

function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [course, setCourse] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', { name, email, password, course })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto', padding: '2rem', boxShadow: '0 0 10px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Study Group Finder</h2>
      <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>Create Account</h3>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      <form onSubmit={handleRegister}>
        <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} required />
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} required />
        <input type="text" placeholder="Course (e.g. BSc IT)" value={course} onChange={e => setCourse(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        <button type="submit"
          style={{ width: '100%', padding: '10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>
          Register
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '1rem' }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  )
}

export default Register