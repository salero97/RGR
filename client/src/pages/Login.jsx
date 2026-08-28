import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { login } from '../api/authApi'
import { setApiToken } from '../api/axios'

const s = {
  page: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f6fa' },
  card: { background: '#fff', padding: 40, borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', width: 360 },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 24, textAlign: 'center', color: '#c0392b' },
  label: { display: 'block', fontSize: 13, marginBottom: 4, color: '#555' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, marginBottom: 16, outline: 'none' },
  btn: { width: '100%', padding: 11, background: '#c0392b', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  link: { textAlign: 'center', marginTop: 16, fontSize: 13, color: '#888' }
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setToken, setUser } = useAuth()
  const showToast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const message = sessionStorage.getItem('sessionExpiredMessage')
    if (message) {
      showToast(message, 'warn')
      sessionStorage.removeItem('sessionExpiredMessage')
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const data = await login(email, password)
      setToken(data.accessToken)
      setApiToken(data.accessToken)
      setUser(data.user)
      navigate('/dashboard')
    } catch (err) {
      const status = err.response?.status
      const message = err.response?.data?.message

      if (message) {
        showToast(message, 'error')
      } else if (status) {
        showToast(`Ошибка ${status}`, 'error')
      } else {
        showToast('Не удалось выполнить вход', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.title}>Вход в систему</div>
        <form onSubmit={handleSubmit}>
          <label style={s.label}>Email</label>
          <input
            style={s.input}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <label style={s.label}>Пароль</label>
          <input
            style={s.input}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <div style={s.link}>
          Нет аккаунта? <Link to="/register" style={{ color: '#c0392b' }}>Зарегистрироваться</Link>
        </div>
      </div>
    </div>
  )
}