import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIncidents, createIncident, deleteIncident } from '../api/incidentsApi';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import useInfiniteScroll from '../hooks/useInfiniteScroll';
import ExportButton from '../components/ExportButton';
import {
  INCIDENT_STATUS_OPTIONS,
  INCIDENT_SEVERITY_OPTIONS,
  INCIDENT_THREAT_TYPES,
  getIncidentSeverityLabel,
  getIncidentStatusLabel
} from '../utils/dictionaries';

const s = {
  hdr: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' },
  title: { fontSize: 22, fontWeight: 700 },
  btn: { padding: '8px 18px', background: '#c0392b', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 },
  filters: { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  select: { padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, minWidth: 180 },
  search: { padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, minWidth: 220 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  th: { padding: '12px 16px', background: '#f8f9fa', textAlign: 'left', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #eee', whiteSpace: 'nowrap' },
  td: { padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #f0f0f0', cursor: 'pointer', verticalAlign: 'top' },
  empty: { background: '#fff', borderRadius: 10, padding: 24, color: '#666', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  sentinel: { padding: 16, textAlign: 'center', color: '#888', fontSize: 13 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 16 },
  modal: { background: '#fff', padding: 28, borderRadius: 12, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' },
  mTitle: { fontSize: 18, fontWeight: 700, marginBottom: 6 },
  mDesc: { fontSize: 12, color: '#888', marginBottom: 16, lineHeight: 1.5 },
  label: { display: 'block', fontSize: 13, marginBottom: 4, color: '#555', fontWeight: 600 },
  hint: { fontSize: 11, color: '#888', marginTop: -8, marginBottom: 10, lineHeight: 1.45 },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, marginBottom: 14, boxSizing: 'border-box' },
  mBtns: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 },
  mBtn: primary => ({
    padding: '8px 20px', border: 'none', borderRadius: 6, cursor: 'pointer',
    background: primary ? '#c0392b' : '#eee', color: primary ? '#fff' : '#333',
    fontSize: 13, fontWeight: 600
  }),
  err: { color: '#e74c3c', fontSize: 12, marginBottom: 10 }
};

const STATUS_HINT = 'Новый — только добавлен; В работе — ведётся мониторинг; Закрытый — снят с наблюдения; Ложный — ошибочно добавлен';

export default function Incidents() {
  const [filters, setFilters] = useState({ status: '', severity: '' });
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    address: '', house: '', floor: '', apartment: '',
    threattype: 'Пожар', severity: 'low', status: 'new', responsible: '', description: ''
  });

  const showToast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const canCreate = ['admin', 'dispatcher'].includes(user?.role);

  const fetchPage = useCallback(async (page, limit) => {
    return getIncidents({ ...filters, search, page, limit });
  }, [filters, search]);

  const { items, loading, hasMore, sentinelRef, reload } = useInfiniteScroll(fetchPage, {
    limit: 20,
    deps: [filters, search]
  });

  function handleFilter(e) {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function resetForm() {
    setForm({
      address: '', house: '', floor: '', apartment: '',
      threattype: 'Пожар', severity: 'low', status: 'new', responsible: '', description: ''
    });
    setFormError('');
  }

  function openCreate() {
    resetForm();
    setShowModal(true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');

    if (!form.address.trim()) { setFormError('Укажите адрес'); showToast('Укажите адрес'); return; }
    if (!form.house.trim()) { setFormError('Укажите дом'); showToast('Укажите дом'); return; }
    if (!form.floor || Number(form.floor) < 1) { setFormError('Укажите корректный этаж'); showToast('Укажите корректный этаж'); return; }
    if (!form.threattype.trim()) { setFormError('Укажите тип угрозы'); showToast('Укажите тип угрозы'); return; }
    if (!form.responsible.trim()) { setFormError('Укажите ответственного'); showToast('Укажите ответственного'); return; }

    try {
      await createIncident(form);
      showToast('Инцидент создан', 'success');
      setShowModal(false);
      resetForm();
      reload(); // <-- Обновляем список
    } catch (err) {
      const msg = err.response?.data?.message || 'Ошибка создания инцидента';
      setFormError(msg);
      showToast(msg);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Удалить инцидент?')) return;
    try {
      await deleteIncident(id);
      showToast('Инцидент удалён', 'success');
      reload(); // <-- Обновляем список
    } catch (err) {
      showToast(err.response?.data?.message || 'Ошибка удаления');
    }
  }

  return (
    <div>
      <div style={s.hdr}>
        <div style={s.title}>Инциденты</div>
        <div>
          <ExportButton endpoint="/incidents/export" params={{ ...filters, search }} fileName="incidents.csv" />
          {canCreate && (
            <button style={{ ...s.btn, marginLeft: 8 }} onClick={openCreate}>Создать инцидент</button>
          )}
        </div>
      </div>

      <div style={s.filters}>
        <input
          style={s.search}
          placeholder="Поиск по адресу, дому, типу угрозы..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select style={s.select} name="status" value={filters.status} onChange={handleFilter}>
          <option value="">Все статусы</option>
          {INCIDENT_STATUS_OPTIONS.map(item => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <select style={s.select} name="severity" value={filters.severity} onChange={handleFilter}>
          <option value="">Все уровни угрозы</option>
          {INCIDENT_SEVERITY_OPTIONS.map(item => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>

      {items.length === 0 && !loading ? (
        <div style={s.empty}>Инциденты не найдены.</div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>ID</th>
                <th style={s.th}>Адрес</th>
                <th style={s.th}>Тип угрозы</th>
                <th style={s.th}>Уровень угрозы</th>
                <th style={s.th}>Статус</th>
                <th style={s.th}>Ответственный</th>
                <th style={s.th}>Дата</th>
              </tr>
            </thead>
            <tbody>
              {items.map(inc => (
                <tr key={inc.id} onClick={() => navigate(`/incidents/${inc.id}`)}>
                  <td style={s.td}>{inc.id}</td>
                  <td style={s.td}>{inc.address}{inc.house ? `, д. ${inc.house}` : ''}</td>
                  <td style={s.td}>{inc.threattype || '—'}</td>
                  <td style={s.td}>{inc.severityLabel || getIncidentSeverityLabel(inc.severity)}</td>
                  <td style={s.td}>{inc.statusLabel || getIncidentStatusLabel(inc.status)}</td>
                  <td style={s.td}>{inc.responsible || '—'}</td>
                  <td style={s.td}>{inc.createdat ? new Date(inc.createdat).toLocaleString('ru-RU') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div ref={sentinelRef} style={s.sentinel}>
        {loading ? 'Загрузка...' : hasMore ? '' : items.length > 0 ? 'Все данные загружены' : ''}
      </div>

      {showModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.mTitle}>Создание инцидента</div>
            <div style={s.mDesc}>
              Заполни адрес и дом. Система попробует найти точку на карте по связке адрес + дом.
            </div>

            <form onSubmit={handleCreate}>
              <label style={s.label}>Адрес *</label>
              <input style={s.input} value={form.address} onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))} required />

              <label style={s.label}>Дом *</label>
              <input style={s.input} value={form.house} onChange={e => setForm(prev => ({ ...prev, house: e.target.value }))} required />

              <label style={s.label}>Этаж *</label>
              <input style={s.input} type="number" min="1" value={form.floor} onChange={e => setForm(prev => ({ ...prev, floor: e.target.value }))} required />

              <label style={s.label}>Квартира <span style={{ color: '#888' }}>(необязательно)</span></label>
              <input style={s.input} value={form.apartment} onChange={e => setForm(prev => ({ ...prev, apartment: e.target.value }))} />

              <label style={s.label}>Тип угрозы *</label>
              <select style={s.input} value={form.threattype} onChange={e => setForm(prev => ({ ...prev, threattype: e.target.value }))} required>
                {INCIDENT_THREAT_TYPES.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>

              <label style={s.label}>Уровень угрозы *</label>
              <select style={s.input} value={form.severity} onChange={e => setForm(prev => ({ ...prev, severity: e.target.value }))} required>
                {INCIDENT_SEVERITY_OPTIONS.map(item => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>

              <label style={s.label}>Статус *</label>
              <select style={s.input} value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))} required>
                {INCIDENT_STATUS_OPTIONS.map(item => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <div style={s.hint}>{STATUS_HINT}</div>

              <label style={s.label}>Ответственный *</label>
              <input style={s.input} value={form.responsible} onChange={e => setForm(prev => ({ ...prev, responsible: e.target.value }))} required />

              <label style={s.label}>Описание <span style={{ color: '#888' }}>(необязательно)</span></label>
              <textarea
                style={{ ...s.input, minHeight: 90, resize: 'vertical' }}
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              />

              {formError ? <div style={s.err}>{formError}</div> : null}

              <div style={s.mBtns}>
                <button type="button" style={s.mBtn(false)} onClick={() => setShowModal(false)}>Отмена</button>
                <button type="submit" style={s.mBtn(true)}>Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}