import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getIncident, updateIncident, deleteIncident } from '../api/incidentsApi';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  INCIDENT_STATUS_OPTIONS,
  INCIDENT_SEVERITY_OPTIONS,
  INCIDENT_THREAT_TYPES,
  getIncidentStatusLabel,
  getIncidentSeverityLabel
} from '../utils/dictionaries';

const s = {
  hdr: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12, flexWrap: 'wrap' },
  title: { fontSize: 22, fontWeight: 700 },
  card: { background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 20 },
  row: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 },
  lbl: { fontSize: 12, color: '#888', marginBottom: 4 },
  val: { fontSize: 14, fontWeight: 500, whiteSpace: 'pre-wrap' },
  btn: color => ({ padding: '8px 18px', background: color, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, marginLeft: 8 }),
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  th: { padding: '10px 16px', background: '#f8f9fa', textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #eee' },
  td: { padding: '10px 16px', fontSize: 12, borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' },
  textarea: { width: '100%', minHeight: 100, padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' },
  hint: { fontSize: 12, color: '#888', marginTop: 6, lineHeight: 1.45 },
  sectionTitle: { fontWeight: 700, marginBottom: 12, fontSize: 16 },
  field: { marginBottom: 14 }
};

const STATUS_HINT = 'Новый — только добавлен; В работе — ведётся мониторинг; Закрытый — снят с наблюдения; Ложный — ошибочно добавлен';

export default function IncidentDetail() {
  const { id } = useParams();
  const [inc, setInc] = useState(null);
  const [form, setForm] = useState({
    address: '',
    house: '',
    floor: '',
    apartment: '',
    threattype: '',
    severity: 'low',
    status: 'new',
    responsible: '',
    description: ''
  });

  const showToast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const canEdit = ['admin', 'dispatcher'].includes(user?.role);
  const isAdmin = user?.role === 'admin';
  const isDispatcher = user?.role === 'dispatcher';

  useEffect(() => {
    getIncident(id)
      .then(data => {
        setInc(data);
        setForm({
          address: data.address || '',
          house: data.house || '',
          floor: data.floor ?? '',
          apartment: data.apartment || '',
          threattype: data.threattype || 'Пожар',
          severity: data.severity || 'low',
          status: data.status || 'new',
          responsible: data.responsible || '',
          description: data.description || ''
        });
      })
      .catch(err => showToast(err.response?.data?.message || 'Ошибка загрузки инцидента'));
  }, [id]);

  async function handleUpdate() {
    try {
      const payload = isDispatcher
        ? { status: form.status }
        : form;

      await updateIncident(id, payload);
      showToast('Инцидент обновлён', 'success');
      navigate('/incidents', { replace: true });
    } catch (err) {
      showToast(err.response?.data?.message || 'Ошибка обновления');
    }
  }

  async function handleDelete() {
    if (!window.confirm('Удалить инцидент?')) return;
    try {
      await deleteIncident(id);
      showToast('Инцидент удалён', 'success');
      navigate('/incidents');
    } catch (err) {
      showToast(err.response?.data?.message || 'Ошибка удаления');
    }
  }

  if (!inc) {
    return <div style={{ padding: 40 }}>Загрузка...</div>;
  }

  return (
    <div>
      <div style={s.hdr}>
        <div style={s.title}>Инцидент #{inc.id}</div>
        <div>
          {canEdit && (
            <button style={s.btn('#f39c12')} onClick={handleUpdate}>Сохранить</button>
          )}
          {isAdmin && (
            <button style={s.btn('#e74c3c')} onClick={handleDelete}>Удалить</button>
          )}
        </div>
      </div>

      <div style={s.card}>
        <div style={s.sectionTitle}>Основная информация</div>

        <div style={s.row}>
          <div>
            <div style={s.lbl}>Адрес</div>
            {isAdmin ? (
              <input
                style={s.input}
                value={form.address}
                onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
              />
            ) : (
              <div style={s.val}>{inc.address || '—'}</div>
            )}
          </div>

          <div>
            <div style={s.lbl}>Дом</div>
            {isAdmin ? (
              <input
                style={s.input}
                value={form.house}
                onChange={e => setForm(prev => ({ ...prev, house: e.target.value }))}
              />
            ) : (
              <div style={s.val}>{inc.house || '—'}</div>
            )}
          </div>

          <div>
            <div style={s.lbl}>Этаж</div>
            {isAdmin ? (
              <input
                style={s.input}
                type="number"
                min="1"
                value={form.floor}
                onChange={e => setForm(prev => ({ ...prev, floor: e.target.value }))}
              />
            ) : (
              <div style={s.val}>{inc.floor || '—'}</div>
            )}
          </div>

          <div>
            <div style={s.lbl}>Квартира</div>
            {isAdmin ? (
              <input
                style={s.input}
                value={form.apartment}
                onChange={e => setForm(prev => ({ ...prev, apartment: e.target.value }))}
              />
            ) : (
              <div style={s.val}>{inc.apartment || '—'}</div>
            )}
          </div>
        </div>

        <div style={s.row}>
          <div>
            <div style={s.lbl}>Тип угрозы</div>
            {isAdmin ? (
              <select
                style={s.input}
                value={form.threattype}
                onChange={e => setForm(prev => ({ ...prev, threattype: e.target.value }))}
              >
                {INCIDENT_THREAT_TYPES.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            ) : (
              <div style={s.val}>{inc.threattype || '—'}</div>
            )}
          </div>

          <div>
            <div style={s.lbl}>Уровень угрозы</div>
            {isAdmin ? (
              <select
                style={s.input}
                value={form.severity}
                onChange={e => setForm(prev => ({ ...prev, severity: e.target.value }))}
              >
                {INCIDENT_SEVERITY_OPTIONS.map(item => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            ) : (
              <div style={s.val}>{inc.severityLabel || getIncidentSeverityLabel(inc.severity)}</div>
            )}
          </div>

          <div>
            <div style={s.lbl}>Статус</div>
            {canEdit ? (
              <select
                style={s.input}
                value={form.status}
                onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
              >
                {INCIDENT_STATUS_OPTIONS.map(item => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            ) : (
              <div style={s.val}>{inc.statusLabel || getIncidentStatusLabel(inc.status)}</div>
            )}
            {canEdit ? <div style={s.hint}>{STATUS_HINT}</div> : null}
          </div>

          <div>
            <div style={s.lbl}>Ответственный</div>
            {isAdmin ? (
              <input
                style={s.input}
                value={form.responsible}
                onChange={e => setForm(prev => ({ ...prev, responsible: e.target.value }))}
              />
            ) : (
              <div style={s.val}>{inc.responsible || '—'}</div>
            )}
          </div>
        </div>

        <div style={s.field}>
          <div style={s.lbl}>Описание</div>
          {isAdmin ? (
            <textarea
              style={s.textarea}
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            />
          ) : (
            <div style={s.val}>{inc.description || '—'}</div>
          )}
        </div>

        <div style={s.row}>
          <div>
            <div style={s.lbl}>Отображение на карте</div>
            <div style={s.val}>
              {inc.latitude && inc.longitude ? 'Адрес отмечен на карте' : 'На карте не отображается'}
            </div>
          </div>
          <div>
            <div style={s.lbl}>Сообщение геокодирования</div>
            <div style={s.val}>{inc.geocodingmessage || '—'}</div>
          </div>
        </div>
      </div>

      <div style={s.card}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Журнал действий</div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Пользователь</th>
              <th style={s.th}>Действие</th>
              <th style={s.th}>Дата</th>
            </tr>
          </thead>
          <tbody>
            {(inc.logs || []).map(log => (
              <tr key={log.id}>
                <td style={s.td}>{log.fullname || '—'}</td>
                <td style={s.td}>{log.action}</td>
                <td style={s.td}>{log.createdat ? new Date(log.createdat).toLocaleString('ru-RU') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}