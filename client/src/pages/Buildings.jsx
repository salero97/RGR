import React, { useState, useCallback } from 'react';
import { getBuildingsPaged, createBuilding, updateBuilding, deleteBuilding } from '../api/buildingsApi';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import useInfiniteScroll from '../hooks/useInfiniteScroll';
import ExportButton from '../components/ExportButton';
import {
  BUILDING_STATUS_UI_OPTIONS,
  BUILDING_RISKLEVEL_OPTIONS,
  getBuildingStatusLabel,
  getRiskLevelLabel
} from '../utils/dictionaries';

const s = {
  titleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' },
  title: { fontSize: 22, fontWeight: 700 },
  addBtn: { padding: '8px 18px', background: '#c0392b', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 },
  search: { padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, minWidth: 240, marginBottom: 16 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
  card: { background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  name: { fontSize: 16, fontWeight: 700, marginBottom: 8 },
  row: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#555', marginBottom: 8, gap: 12 },
  badge: { display: 'inline-block', padding: '2px 10px', borderRadius: 12, background: '#eef2f7', color: '#333', fontSize: 12, fontWeight: 600 },
  actions: { display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  btn: color => ({ padding: '7px 12px', background: color, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }),
  sentinel: { padding: 16, textAlign: 'center', color: '#888', fontSize: 13 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 16 },
  modal: { background: '#fff', padding: 32, borderRadius: 12, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' },
  mTitle: { fontSize: 18, fontWeight: 700, marginBottom: 6 },
  mDesc: { fontSize: 12, color: '#888', marginBottom: 18, lineHeight: 1.5 },
  label: { display: 'block', fontSize: 13, marginBottom: 4, color: '#555', fontWeight: 600 },
  hint: { fontSize: 12, color: '#888', marginBottom: 12, lineHeight: 1.45 },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, marginBottom: 6, boxSizing: 'border-box' },
  mBtns: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 },
  mBtn: primary => ({
    padding: '8px 20px', border: 'none', borderRadius: 6, cursor: 'pointer',
    background: primary ? '#c0392b' : '#eee', color: primary ? '#fff' : '#333',
    fontSize: 13, fontWeight: 600
  }),
  err: { color: '#e74c3c', fontSize: 12, marginBottom: 10 }
};

const STATUS_HINT = 'Новый — только добавлен; В работе — ведётся мониторинг; Закрытый — снят с наблюдения; Ложный — ошибочно добавлен';

export default function Buildings() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    name: '', address: '', house: '', floors: '', risklevel: 'medium', status: 'new', description: ''
  });

  const showToast = useToast();
  const { user } = useAuth();

  const canCreate = ['admin', 'dispatcher'].includes(user?.role);
  const canEdit = ['admin', 'dispatcher'].includes(user?.role);
  const canDelete = user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  const isDispatcher = user?.role === 'dispatcher';

  const fetchPage = useCallback(async (page, limit) => {
    return getBuildingsPaged({ search, page, limit });
  }, [search]);

  const { items, loading, hasMore, sentinelRef, reload } = useInfiniteScroll(fetchPage, {
    limit: 20,
    deps: [search]
  });

  function openCreate() {
    setEditing(null);
    setForm({ name: '', address: '', house: '', floors: '', risklevel: 'medium', status: 'new', description: '' });
    setFormError('');
    setShowModal(true);
  }

  function openEdit(building) {
    setEditing(building);
    setForm({
      name: building.name || '',
      address: building.address || '',
      house: building.house || '',
      floors: building.floors ?? '',
      risklevel: building.risklevel || 'medium',
      status: building.status || 'new',
      description: building.description || ''
    });
    setFormError('');
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim()) { setFormError('Заполните название объекта'); showToast('Заполните название объекта'); return; }

    if (!editing || isAdmin) {
      if (!form.address.trim()) { setFormError('Заполните адрес объекта'); showToast('Заполните адрес объекта'); return; }
      if (!form.house.trim()) { setFormError('Заполните дом'); showToast('Заполните дом'); return; }
      if (!form.risklevel) { setFormError('Выберите уровень угрозы'); showToast('Выберите уровень угрозы'); return; }
    }

    if (!form.floors || Number(form.floors) < 1) { setFormError('Укажите корректное количество этажей'); showToast('Укажите корректное количество этажей'); return; }
    if (!form.status) { setFormError('Выберите статус объекта'); showToast('Выберите статус объекта'); return; }

    try {
      if (editing) {
        const payload = isDispatcher
          ? { name: form.name, floors: form.floors, status: form.status, description: form.description }
          : form;

        await updateBuilding(editing.id, payload);
        showToast('Объект обновлён', 'success');
      } else {
        await createBuilding(form);
        showToast('Объект создан', 'success');
      }

      setShowModal(false);
      reload(); // <-- Обновляем список
    } catch (err) {
      const message = err.response?.data?.message || 'Ошибка сохранения объекта';
      setFormError(message);
      showToast(message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Удалить объект?')) return;

    try {
      await deleteBuilding(id);
      showToast('Объект удалён', 'success');
      reload(); // <-- Обновляем список
    } catch (err) {
      showToast(err.response?.data?.message || 'Ошибка удаления объекта');
    }
  }

  return (
    <div>
      <div style={s.titleRow}>
        <div style={s.title}>Объекты</div>
        <div>
          <ExportButton endpoint="/buildings/export" params={{ search }} fileName="buildings.csv" />
          {canCreate && (
            <button style={{ ...s.addBtn, marginLeft: 8 }} onClick={openCreate}>Создать объект</button>
          )}
        </div>
      </div>

      <input
        style={s.search}
        placeholder="Поиск по названию, адресу, дому..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div style={s.grid}>
        {items.map(b => (
          <div key={b.id} style={s.card}>
            <div style={s.name}>{b.name}</div>
            <div style={s.row}><span>Адрес</span><span>{b.address}{b.house ? `, д. ${b.house}` : ''}</span></div>
            <div style={s.row}><span>Этажей</span><span>{b.floors ?? '—'}</span></div>
            <div style={s.row}><span>Уровень угрозы</span><span style={s.badge}>{b.riskLevelLabel || getRiskLevelLabel(b.risklevel)}</span></div>
            <div style={s.row}><span>Статус</span><span style={s.badge}>{b.statusLabel || getBuildingStatusLabel(b.status)}</span></div>
            <div style={s.row}><span>На карте</span><span>{b.latitude && b.longitude ? 'Да' : 'Нет'}</span></div>

            {(canEdit || canDelete) && (
              <div style={s.actions}>
                {canEdit && <button style={s.btn('#f39c12')} onClick={() => openEdit(b)}>Изменить</button>}
                {canDelete && <button style={s.btn('#e74c3c')} onClick={() => handleDelete(b.id)}>Удалить</button>}
              </div>
            )}
          </div>
        ))}
      </div>

      <div ref={sentinelRef} style={s.sentinel}>
        {loading ? 'Загрузка...' : hasMore ? '' : items.length > 0 ? 'Все данные загружены' : 'Объекты не найдены.'}
      </div>

      {showModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.mTitle}>{editing ? 'Редактирование объекта' : 'Создание объекта'}</div>
            <div style={s.mDesc}>Администратор может менять все поля. Dispatcher — только название, этажность, статус и описание.</div>

            <form onSubmit={handleSubmit}>
              <label style={s.label}>Название объекта *</label>
              <input style={s.input} value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} required />

              <label style={s.label}>Адрес *</label>
              <input style={s.input} value={form.address} onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))} disabled={editing && isDispatcher} required />

              <label style={s.label}>Дом *</label>
              <input style={s.input} value={form.house} onChange={e => setForm(prev => ({ ...prev, house: e.target.value }))} disabled={editing && isDispatcher} required />

              <label style={s.label}>Количество этажей *</label>
              <input style={s.input} type="number" min="1" value={form.floors} onChange={e => setForm(prev => ({ ...prev, floors: e.target.value }))} required />

              <label style={s.label}>Статус объекта *</label>
              <select style={s.input} value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}>
                {BUILDING_STATUS_UI_OPTIONS.map(item => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <div style={s.hint}>{STATUS_HINT}</div>

              <label style={s.label}>Уровень угрозы *</label>
              <select style={s.input} value={form.risklevel} onChange={e => setForm(prev => ({ ...prev, risklevel: e.target.value }))} disabled={editing && isDispatcher}>
                {BUILDING_RISKLEVEL_OPTIONS.map(item => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>

              <label style={s.label}>Описание <span style={{ color: '#888' }}>(необязательно)</span></label>
              <textarea style={{ ...s.input, minHeight: 90, resize: 'vertical' }} value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} />

              {formError ? <div style={s.err}>{formError}</div> : null}

              <div style={s.mBtns}>
                <button type="button" style={s.mBtn(false)} onClick={() => setShowModal(false)}>Отмена</button>
                <button type="submit" style={s.mBtn(true)}>{editing ? 'Сохранить' : 'Создать'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}