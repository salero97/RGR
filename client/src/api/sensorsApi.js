import api from './axios';

export async function getSensors(params) {
  const normalized = { ...params };
  if (normalized.search === '') delete normalized.search;

  const res = await api.get('sensors', { params: normalized });
  return res.data;
}

export async function getSensor(id) {
  const res = await api.get(`sensors/${id}`);
  return res.data;
}

export async function createSensor(data) {
  const payload = {
    building_id: Number(data.building_id),
    type: data.type.trim(),
    location: data.location ? data.location.trim() : '',
    status: data.status || 'active',
    floor: data.floor ? Number(data.floor) : null
  };
  const res = await api.post('sensors', payload);
  return res.data;
}

export async function updateSensor(id, data) {
  const payload = {};
  if (data.type !== undefined) payload.type = data.type.trim();
  if (data.location !== undefined) payload.location = data.location.trim();
  if (data.status !== undefined) payload.status = data.status;
  if (data.floor !== undefined) payload.floor = data.floor ? Number(data.floor) : null;
  const res = await api.put(`sensors/${id}`, payload);
  return res.data;
}

export async function deleteSensor(id) {
  await api.delete(`sensors/${id}`);
}

export async function simulateSensor(id) {
  const res = await api.post(`/sensors/${id}/simulate`);
  return res.data;
}
