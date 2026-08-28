import api from './axios';

export async function getIncidents(params) {
  const normalized = { ...params };

  if (normalized.status === '') delete normalized.status;
  if (normalized.severity === '') delete normalized.severity;
  if (normalized.search === '') delete normalized.search;

  const res = await api.get('/incidents', { params: normalized });
  return res.data;
}

export async function getIncident(id) {
  const res = await api.get(`/incidents/${id}`);
  return res.data;
}

export async function createIncident(data) {
  const payload = {
    address: data.address.trim(),
    house: data.house.trim(),
    floor: Number(data.floor),
    apartment: data.apartment ? data.apartment.trim() : '',
    threattype: data.threattype.trim(),
    severity: data.severity,
    status: data.status,
    responsible: data.responsible.trim(),
    description: data.description ? data.description.trim() : ''
  };

  const res = await api.post('/incidents', payload);
  return res.data;
}

export async function updateIncident(id, data) {
  const payload = {};

  if (data.address !== undefined) payload.address = data.address.trim();
  if (data.house !== undefined) payload.house = data.house.trim();
  if (data.floor !== undefined) payload.floor = Number(data.floor);
  if (data.apartment !== undefined) payload.apartment = data.apartment ? data.apartment.trim() : '';
  if (data.threattype !== undefined) payload.threattype = data.threattype.trim();
  if (data.severity !== undefined) payload.severity = data.severity;
  if (data.status !== undefined) payload.status = data.status;
  if (data.responsible !== undefined) payload.responsible = data.responsible.trim();
  if (data.description !== undefined) payload.description = data.description ? data.description.trim() : '';

  const res = await api.put(`/incidents/${id}`, payload);
  return res.data;
}

export async function deleteIncident(id) {
  await api.delete(`/incidents/${id}`);
}