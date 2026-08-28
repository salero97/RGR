import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getAuditLogs } from '../api/auditApi';
import { getUsers } from '../api/usersApi';
import useInfiniteScroll from '../hooks/useInfiniteScroll';

const s = {
  title: { fontSize: 22, fontWeight: 700, marginBottom: 20 },
  filters: { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' },
  input: { padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, minWidth: 180 },
  select: { padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, minWidth: 180 },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  th: { padding: '12px 16px', background: '#f8f9fa', textAlign: 'left', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #eee' },
  td: { padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' },
  sentinel: { padding: 16, textAlign: 'center', color: '#888', fontSize: 13 },
  empty: { background: '#fff', borderRadius: 10, padding: 24, color: '#666', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  badge: { display: 'inline-block', padding: '2px 10px', borderRadius: 12, background: '#eef2f7', fontSize: 12, fontWeight: 600 }
};

const ACTION_LABELS = {
  LOGIN_SUCCESS: 'Вход успешен',
  LOGIN_FAILED: 'Вход неудачен',
  LOGIN_BLOCKED: 'IP заблокирован',
  LOGOUT_SUCCESS: 'Выход',
  REGISTER_SUCCESS: 'Регистрация',
  CREATE_INCIDENT: 'Создание инцидента',
  UPDATE_INCIDENT: 'Обновление инцидента',
  DELETE_INCIDENT: 'Удаление инцидента',
  CREATE_BUILDING: 'Создание здания',
  UPDATE_BUILDING: 'Обновление здания',
  DELETE_BUILDING: 'Удаление здания',
  CREATE_SENSOR: 'Создание датчика',
  UPDATE_SENSOR: 'Обновление датчика',
  DELETE_SENSOR: 'Удаление датчика',
  CREATE_INCIDENT_SIMULATE: 'Симуляция датчика',
  EXPORT_INCIDENTS_CSV: 'Экспорт инцидентов CSV',
  EXPORT_BUILDINGS_CSV: 'Экспорт зданий CSV',
  UPDATE_USER_ROLE: 'Изменение роли',
  DELETE_USER: 'Удаление пользователя',
  AUTH_FAILED: 'Ошибка аутентификации',
  ACCESS_DENIED: 'Отказ в доступе'
};

function formatAction(action) {
  return ACTION_LABELS[action] || action;
}

export default function AuditPage() {
  const [filters, setFilters] = useState({ userId: '', action: '', dateFrom: '', dateTo: '' });
  const [userList, setUserList] = useState([]);
  const { user } = useAuth();
  const showToast = useToast();

  useEffect(() => {
    if (user?.role === 'admin') {
      getUsers().then(setUserList).catch(() => {});
    }
  }, [user]);

  const fetchPage = useCallback(async (page, limit) => {
    const params = { ...filters, page, limit };
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === undefined) delete params[k];
    });
    return getAuditLogs(params);
  }, [filters]);

  const { items: logs, loading, hasMore, sentinelRef, reload } = useInfiniteScroll(fetchPage, {
    limit: 50,
    deps: [filters]
  });

  function handleFilter(e) {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function getUserName(userId) {
    const found = userList.find(u => u.id === userId);
    return found ? found.full_name || found.email : userId || 'Система';
  }

  return (
    <div>
      <div style={s.title}>Аудит действий</div>

      <div style={s.filters}>
        <select style={s.select} name="action" value={filters.action} onChange={handleFilter}>
          <option value="">Все действия</option>
          {Object.entries(ACTION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <input
          style={s.input}
          type="date"
          name="dateFrom"
          value={filters.dateFrom}
          onChange={handleFilter}
          placeholder="С даты"
        />
        <input
          style={s.input}
          type="date"
          name="dateTo"
          value={filters.dateTo}
          onChange={handleFilter}
          placeholder="По дату"
        />

        <select style={s.select} name="userId" value={filters.userId} onChange={handleFilter}>
          <option value="">Все пользователи</option>
          {userList.map(u => (
            <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
          ))}
        </select>

        <button style={{ padding: '8px 18px', background: '#2c3e50', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }} onClick={reload}>
          Обновить
        </button>
      </div>

      {logs.length === 0 && !loading ? (
        <div style={s.empty}>Записи аудита не найдены.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>ID</th>
                <th style={s.th}>Пользователь</th>
                <th style={s.th}>Действие</th>
                <th style={s.th}>Объект</th>
                <th style={s.th}>Детали</th>
                <th style={s.th}>IP</th>
                <th style={s.th}>Дата</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td style={s.td}>{log.id}</td>
                  <td style={s.td}>{getUserName(log.user_id)}</td>
                  <td style={s.td}>
                    <span style={s.badge}>{formatAction(log.action)}</span>
                  </td>
                  <td style={s.td}>{log.object_type || '—'}{log.object_id ? ` #${log.object_id}` : ''}</td>
                  <td style={s.td}>
                    {log.details ? (
                      <pre style={{ margin: 0, fontSize: 11, maxWidth: 300, whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    ) : '—'}
                  </td>
                  <td style={s.td}>{log.ip_address || '—'}</td>
                  <td style={s.td}>{log.created_at ? new Date(log.created_at).toLocaleString('ru-RU') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div ref={sentinelRef} style={s.sentinel}>
        {loading ? 'Загрузка...' : hasMore ? '' : logs.length > 0 ? 'Все данные загружены' : ''}
      </div>
    </div>
  );
}
