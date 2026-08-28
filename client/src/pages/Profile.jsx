import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'

const s = {
  title: { fontSize: 22, fontWeight: 700, marginBottom: 20 },
  card: { background: '#fff', borderRadius: 10, padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', maxWidth: 420 },
  row: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0', fontSize: 14 },
  lbl: { color: '#888' },
  badge: { display: 'inline-block', padding: '2px 12px', borderRadius: 12, background: '#fde8e8', color: '#c0392b', fontSize: 12, fontWeight: 600 }
}

export default function Profile() {
  const [user, setUser] = useState(null)
  const showToast = useToast()

  useEffect(() => {
    api.get('/users/me')
      .then(r => setUser(r.data))
      .catch(() => showToast('Ошибка загрузки профиля'))
  }, [])

  if (!user) {
    return <div style={{ padding: 40 }}>Загрузка...</div>
  }

  return (
    <div>
      <div style={s.title}>Профиль</div>
      <div style={s.card}>
        <div style={s.row}><span style={s.lbl}>Полное имя</span><span>{user.full_name}</span></div>
        <div style={s.row}><span style={s.lbl}>Email</span><span>{user.email}</span></div>
        <div style={s.row}><span style={s.lbl}>Роль</span><span style={s.badge}>{user.role}</span></div>
        <div style={s.row}><span style={s.lbl}>Дата регистрации</span><span>{user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : ''}</span></div>
      </div>
    </div>
  )
}