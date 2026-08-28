import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { register } from '../api/authApi'

const s = {
  page: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f6fa' },
  card: { background: '#fff', padding: 40, borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', width: 380 },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 12, textAlign: 'center', color: '#c0392b' },
  subtitle: { fontSize: 12, color: '#777', textAlign: 'center', marginBottom: 20, lineHeight: 1.5 },
  label: { display: 'block', fontSize: 13, marginBottom: 4, color: '#555' },
  hint: { fontSize: 11, color: '#888', marginTop: -10, marginBottom: 10, lineHeight: 1.45 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, marginBottom: 16, outline: 'none', boxSizing: 'border-box' },
  btn: { width: '100%', padding: 11, background: '#c0392b', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  link: { textAlign: 'center', marginTop: 16, fontSize: 13, color: '#888' },
  err: { color: '#e74c3c', fontSize: 12, marginBottom: 10 }
}

export default function Register() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirm: '',
    fullname: ''
  })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const showToast = useToast()
  const navigate = useNavigate()

  function handleChange(e) {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErr('')

    if (!form.fullname.trim()) {
      const message = 'Укажите ФИО полностью'
      setErr(message)
      showToast(message, 'error')
      return
    }

    if (form.fullname.trim().length < 5) {
      const message = 'ФИО должно содержать минимум 5 символов'
      setErr(message)
      showToast(message, 'error')
      return
    }

    if (!form.email.trim()) {
      const message = 'Укажите email'
      setErr(message)
      showToast(message, 'error')
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      const message = 'Введите корректный email'
      setErr(message)
      showToast(message, 'error')
      return
    }

    if (!form.password) {
      const message = 'Укажите пароль'
      setErr(message)
      showToast(message, 'error')
      return
    }

    if (form.password.length < 6) {
      const message = 'Пароль должен содержать минимум 6 символов'
      setErr(message)
      showToast(message, 'error')
      return
    }

    if (form.password !== form.confirm) {
      const message = 'Пароли не совпадают'
      setErr(message)
      showToast(message, 'error')
      return
    }

    setLoading(true)

    try {
      await register(form.email.trim(), form.password, form.fullname.trim())
      showToast('Регистрация успешна. Теперь войдите в систему.', 'success')
      navigate('/login')
    } catch (e) {
      const message = e.response?.data?.message || 'Ошибка регистрации'
      setErr(message)
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.title}>Регистрация</div>
        <div style={s.subtitle}>Создайте аккаунт для доступа к системе мониторинга пожарной безопасности</div>
        <form onSubmit={handleSubmit}>
          <label style={s.label}>ФИО *</label>
          <input
            style={s.input}
            name="fullname"
            value={form.fullname}
            onChange={handleChange}
            placeholder="Иванов Иван Иванович"
            required
          />
          <div style={s.hint}>Укажите реальные фамилию, имя и отчество или полное имя сотрудника.</div>

          <label style={s.label}>Email *</label>
          <input
            style={s.input}
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="user@example.com"
            required
          />
          <div style={s.hint}>Этот email будет использоваться для входа в систему.</div>

          <label style={s.label}>Пароль *</label>
          <input
            style={s.input}
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Минимум 6 символов"
            required
          />
          <div style={s.hint}>Используйте не менее 6 символов. Лучше добавить буквы и цифры.</div>

          <label style={s.label}>Подтвердите пароль *</label>
          <input
            style={s.input}
            type="password"
            name="confirm"
            value={form.confirm}
            onChange={handleChange}
            placeholder="Повторите пароль"
            required
          />
          <div style={s.hint}>Повторите пароль точно так же, как в предыдущем поле.</div>

          {err ? <div style={s.err}>{err}</div> : null}

          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div style={s.link}>
          Уже есть аккаунт? <Link to="/login" style={{ color: '#c0392b' }}>Войти</Link>
        </div>
      </div>
    </div>
  );
}