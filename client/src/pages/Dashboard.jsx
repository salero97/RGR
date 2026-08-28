import React, { useEffect, useState } from 'react';
import { getIncidents } from '../api/incidentsApi';
import { useToast } from '../context/ToastContext';
import { getIncidentSeverityLabel, getIncidentStatusLabel } from '../utils/dictionaries';

const s = {
  title: { fontSize: 22, fontWeight: 700, marginBottom: 24 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 },
  card: color => ({ background: '#fff', borderRadius: 10, padding: 20, borderLeft: `5px solid ${color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }),
  num: { fontSize: 36, fontWeight: 700 },
  lbl: { fontSize: 13, color: '#888', marginTop: 4 },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  th: { padding: '12px 16px', background: '#f8f9fa', textAlign: 'left', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #eee' },
  td: { padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #f0f0f0' }
};

const COLORS = {
  new: '#e74c3c',
  inprogress: '#f39c12',
  resolved: '#27ae60',
  falsealarm: '#95a5a6'
};

export default function Dashboard() {
  const [data, setData] = useState({ data: [], meta: { total: 0 } });
  const showToast = useToast();

  useEffect(() => {
    getIncidents({ limit: 100 })
      .then(setData)
      .catch(err => showToast(err.response?.data?.message || 'Ошибка загрузки дашборда'));
  }, []);

  const counts = { new: 0, inprogress: 0, resolved: 0, falsealarm: 0 };

  data.data.forEach(i => {
    if (counts[i.status] !== undefined) counts[i.status] += 1;
  });

  return (
    <div>
      <div style={s.title}>Панель мониторинга</div>

      <div style={s.grid}>
        <div style={s.card(COLORS.new)}>
          <div style={s.num}>{counts.new}</div>
          <div style={s.lbl}>Новых</div>
        </div>
        <div style={s.card(COLORS.inprogress)}>
          <div style={s.num}>{counts.inprogress}</div>
          <div style={s.lbl}>В работе</div>
        </div>
        <div style={s.card(COLORS.resolved)}>
          <div style={s.num}>{counts.resolved}</div>
          <div style={s.lbl}>Закрытых</div>
        </div>
        <div style={s.card(COLORS.falsealarm)}>
          <div style={s.num}>{counts.falsealarm}</div>
          <div style={s.lbl}>Ложных</div>
        </div>
      </div>

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>ID</th>
            <th style={s.th}>Адрес</th>
            <th style={s.th}>Угроза</th>
            <th style={s.th}>Уровень</th>
            <th style={s.th}>Статус</th>
            <th style={s.th}>Дата</th>
          </tr>
        </thead>
        <tbody>
          {data.data.slice(0, 10).map(inc => (
            <tr key={inc.id}>
              <td style={s.td}>{inc.id}</td>
              <td style={s.td}>{inc.address}{inc.house ? `, д. ${inc.house}` : ''}</td>
              <td style={s.td}>{inc.threattype || '—'}</td>
              <td style={s.td}>{inc.severityLabel || getIncidentSeverityLabel(inc.severity)}</td>
              <td style={s.td}>
                <span style={{ color: COLORS[inc.status] || '#333', fontWeight: 600 }}>
                  {inc.statusLabel || getIncidentStatusLabel(inc.status)}
                </span>
              </td>
              <td style={s.td}>{inc.createdat ? new Date(inc.createdat).toLocaleString('ru-RU') : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}