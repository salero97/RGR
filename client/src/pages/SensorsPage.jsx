import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSensors, createSensor, updateSensor, deleteSensor, simulateSensor } from '../api/sensorsApi';
import { getBuildings } from '../api/buildingsApi';
import useInfiniteScroll from '../hooks/useInfiniteScroll';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Активен' },
  { value: 'inactive', label: 'Отключён' },
  { value: 'maintenance', label: 'На обслуживании' }
];

const TYPE_OPTIONS = ['Дымовой', 'Тепловой', 'Газовый', 'Извещатель ручной'];

const s = {
  hdr: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' },
  title: { fontSize: 22, fontWeight: 700 },
  btn: { padding: '8px 18px', background: '#c0392b', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 },
  filters: { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  select: { padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, minWidth: 180 },
  search: { padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, minWidth: 220 },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  th: { padding: '12px 16px', background: '#f8f9fa', textAlign: 'left', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #eee' },
  td: { padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #f0f0f0' },
  empty: { background: '#fff', borderRadius: 10, padding: 24, color: '#666', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  sentinel: { padding: 16, textAlign: 'center', color: '#888', fontSize: 13 },
  actionBtn: { padding: '5px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600, marginRight: 8 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 16 },
  modal: { background: '#fff', padding: 28, borderRadius: 12, width: '100%', maxWidth: 480, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' },
  mTitle: { fontSize: 18, fontWeight: 700, marginBottom: 16 },
  label: { display: 'block', fontSize: 13, marginBottom: 4, color: '#555', fontWeight: 600 },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, marginBottom: 14, boxSizing: 'border-box' },
  mBtns: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 },
  mBtn: primary => ({
    padding: '8px 20px', border: 'none', borderRadius: 6, cursor: 'pointer',
    background: primary ? '#c0392b' : '#eee', color: primary ? '#fff' : '#333',
    fontSize: 13, fontWeight: 600
  }),
  err: { color: '#e74c3c', fontSize: 12, marginBottom: 10 }
};

export default function SensorsPage() {
  const [buildings, setBuildings] = useState([]);
  const [filterBuilding, setFilterBuilding] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ building_id: '', type: TYPE_OPTIONS[0], location: '', floor: '', status: 'active' });

  const { user } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const canManage = user?.role === 'admin';
  const canSimulate = ['admin', 'dispatcher'].includes(user?.role);

  useEffect(() => {
    getBuildings()
      .then(setBuildings)
      .catch(err => showToast(err.response?.data?.message || 'Ошибка загрузки зданий'));
  }, []);

  const fetchPage = useCallback(async (page, limit) => {
    const params = { page, limit, search };
    if (filterBuilding) params.building_id = filterBuilding;
    return getSensors(params);
  }, [filterBuilding, search]);

  const { items: sensors, loading, hasMore, sentinelRef, reload } = useInfiniteScroll(fetchPage, {
    limit: 20,
    deps: [filterBuilding, search]
  });

  function buildingName(id) {
    const b = buildings.find(x => String(x.id) === String(id));
    return b ? b.name : '—';
  }

  function statusLabel(value) {
    const item = STATUS_OPTIONS.find(o => o.value === value);
    return item ? item.label : value;
  }

  function openCreate() {
    setEditing(null);
    setForm({ building_id: buildings[0]?.id || '', type: TYPE_OPTIONS[0], location: '', floor: '', status: 'active' });
    setFormError('');
    setShowModal(true);
  }

  function openEdit(sensor) {
    setEditing(sensor);
    setForm({
      building_id: sensor.building_id,
      type: sensor.type,
      location: sensor.location || '',
      floor: sensor.floor ?? '',
      status: sensor.status
    });
    setFormError('');
    setShowModal(true);
  }

  function handleApiError(err, fallbackMessage) {
    const status = err.response?.status;
    const message = err.response?.data?.message;

    if (status === 429) {
      showToast(message || 'Слишком много запросов. Попробуйте позже.', 'warn');
      return;
    }

    setFormError(message || fallbackMessage);
    showToast(message || fallbackMessage);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!editing && !form.building_id) {
      setFormError('Выберите здание');
      return;
    }
    if (!form.type.trim()) {
      setFormError('Укажите тип датчика');
      return;
    }
    if (form.floor && !Number.isInteger(Number(form.floor)) || (form.floor && Number(form.floor) < 1)) {
      setFormError('Этаж должен быть положительным целым числом');
      return;
    }

    try {
      if (editing) {
        await updateSensor(editing.id, {
          type: form.type,
          location: form.location,
          status: form.status,
          floor: form.floor || null
        });
        showToast('Датчик обновлён', 'success');
      } else {
        await createSensor(form);
        showToast('Датчик добавлен', 'success');
      }
      setShowModal(false);
      reload();
    } catch (err) {
      handleApiError(err, 'Ошибка сохранения датчика');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Удалить датчик?')) return;
    try {
      await deleteSensor(id);
      showToast('Датчик удалён', 'success');
      reload();
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message;

      if (status === 429) {
        showToast(message || 'Слишком много запросов. Попробуйте позже.', 'warn');
        return;
      }

      showToast(message || 'Ошибка удаления датчика');
    }
  }

  async function handleSimulate(id) {
    if (!window.confirm('Создать инцидент по срабатыванию датчика?')) return;
    try {
      const incident = await simulateSensor(id);
      showToast(`Инцидент #${incident.id} создан по симуляции датчика`, 'success');
      reload();
      // можно перейти на страницу инцидента
      // navigate(`/incidents/${incident.id}`);
    } catch (err) {
      const message = err.response?.data?.message || 'Ошибка симуляции датчика';
      showToast(message, 'error');
    }
  }

  return (
    <div>
      <div style={s.hdr}>
        <div style={s.title}>Датчики</div>
        {canManage && (
          <button style={s.btn} onClick={openCreate}>
            Добавить датчик
          </button>
        )}
      </div>

      <div style={s.filters}>
        <input
          style={s.search}
          placeholder="Поиск по типу или расположению..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select style={s.select} value={filterBuilding} onChange={e => setFilterBuilding(e.target.value)}>
          <option value="">Все здания</option>
          {buildings.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {sensors.length === 0 && !loading ? (
        <div style={s.empty}>Датчики не найдены.</div>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>ID</th>
              <th style={s.th}>Здание</th>
              <th style={s.th}>Тип</th>
              <th style={s.th}>Этаж</th>
              <th style={s.th}>Расположение</th>
              <th style={s.th}>Статус</th>
              {canManage && <th style={s.th}></th>}
              {canSimulate && <th style={s.th}></th>}
            </tr>
          </thead>
          <tbody>
            {sensors.map(sensor => (
              <tr key={sensor.id}>
                <td style={s.td}>{sensor.id}</td>
                <td style={s.td}>{buildingName(sensor.building_id)}</td>
                <td style={s.td}>{sensor.type}</td>
                <td style={s.td}>{sensor.floor ?? '—'}</td>
                <td style={s.td}>{sensor.location || '—'}</td>
                <td style={s.td}>{statusLabel(sensor.status)}</td>
                {canManage && (
                  <td style={s.td}>
                    <button
                      style={{ ...s.actionBtn, background: '#fff3cd', color: '#856404' }}
                      onClick={() => openEdit(sensor)}
                    >
                      Изменить
                    </button>
                    <button
                      style={{ ...s.actionBtn, background: '#fde8e8', color: '#c0392b' }}
                      onClick={() => handleDelete(sensor.id)}
                    >
                      Удалить
                    </button>
                  </td>
                )}
                {canSimulate && (
                  <td style={s.td}>
                    <button
                      style={{ ...s.actionBtn, background: '#d4edda', color: '#155724' }}
                      onClick={() => handleSimulate(sensor.id)}
                    >
                      Симуляция
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div ref={sentinelRef} style={s.sentinel}>
        {loading ? 'Загрузка...' : hasMore ? '' : sensors.length > 0 ? 'Все данные загружены' : ''}
      </div>

      {showModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.mTitle}>{editing ? 'Редактирование датчика' : 'Новый датчик'}</div>

            <form onSubmit={handleSubmit}>
              {!editing && (
                <>
                  <label style={s.label}>Здание *</label>
                  <select
                    style={s.input}
                    value={form.building_id}
                    onChange={e => setForm(prev => ({ ...prev, building_id: e.target.value }))}
                    required
                  >
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </>
              )}

              <label style={s.label}>Тип датчика *</label>
              <select
                style={s.input}
                value={form.type}
                onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                required
              >
                {TYPE_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <label style={s.label}>Этаж <span style={{ color: '#888' }}>(необязательно)</span></label>
              <input
                style={s.input}
                type="number"
                min="1"
                value={form.floor}
                onChange={e => setForm(prev => ({ ...prev, floor: e.target.value }))}
                placeholder="Например: 3"
              />

              <label style={s.label}>Расположение <span style={{ color: '#888' }}>(необязательно)</span></label>
              <input
                style={s.input}
                value={form.location}
                onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Например: коридор, комната 205"
              />

              <label style={s.label}>Статус</label>
              <select
                style={s.input}
                value={form.status}
                onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              {formError ? <div style={s.err}>{formError}</div> : null}

              <div style={s.mBtns}>
                <button type="button" style={s.mBtn(false)} onClick={() => setShowModal(false)}>
                  Отмена
                </button>
                <button type="submit" style={s.mBtn(true)}>
                  {editing ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
