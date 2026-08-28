import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'

const ROLES = ['user', 'dispatcher', 'admin']

const s = {
  title: { fontSize: 22, fontWeight: 700, marginBottom: 20 },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  th: { padding: '12px 16px', background: '#f8f9fa', textAlign: 'left', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #eee' },
  td: { padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #f0f0f0' },
  select: { padding: '5px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 },
  delBtn: { padding: '5px 12px', background: '#fde8e8', color: '#c0392b', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }
}

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const { user: me } = useAuth()
  const showToast = useToast()

  function load() {
    api.get('/users')
      .then((r) => setUsers(r.data))
      .catch((err) => showToast(err.response?.data?.message || 'Ошибка загрузки пользователей', 'error'))
  }

  useEffect(() => {
    load()
  }, [])

  async function handleRoleChange(id, role) {
    try {
      await api.patch(`/users/${id}/role`, { role })
      showToast('Роль обновлена', 'success')
      load()
    } catch (err) {
      showToast(err.response?.data?.message || 'Ошибка обновления роли', 'error')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Удалить пользователя?')) return
    try {
      await api.delete(`/users/${id}`)
      showToast('Пользователь удалён', 'success')
      load()
    } catch (err) {
      showToast(err.response?.data?.message || 'Ошибка удаления пользователя', 'error')
    }
  }

  return (
    <div>
      <div style={s.title}>Пользователи</div>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Полное имя</th>
            <th style={s.th}>Email</th>
            <th style={s.th}>Роль</th>
            <th style={s.th}>Дата создания</th>
            <th style={s.th}></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td style={s.td}>{u.full_name}</td>
              <td style={s.td}>{u.email}</td>
              <td style={s.td}>
                {u.id === me?.id ? (
                  <span style={{ fontWeight: 600 }}>{u.role}</span>
                ) : (
                  <select
                    style={s.select}
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                )}
              </td>
              <td style={s.td}>{u.created_at ? new Date(u.created_at).toLocaleDateString('ru-RU') : ''}</td>
              <td style={s.td}>
                {u.id !== me?.id && (
                  <button style={s.delBtn} onClick={() => handleDelete(u.id)}>
                    Удалить
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}