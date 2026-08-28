import api from './axios';

export async function getBuildings() {
  const res = await api.get('/buildings');
  return res.data;
}

export async function getBuildingsPaged(params) {
  const normalized = { ...params };
  if (normalized.search === '') delete normalized.search;

  const res = await api.get('/buildings', { params: normalized });
  return res.data;
}

export async function getBuilding(id) {
  const res = await api.get(`/buildings/${id}`);
  return res.data;
}

export async function createBuilding(data) {
  const payload = {
    name: data.name.trim(),
    address: data.address.trim(),
    house: data.house.trim(),
    floors: Number(data.floors),
    risklevel: data.risklevel,
    status: data.status,
    description: data.description ? data.description.trim() : ''
  };

  const res = await api.post('/buildings', payload);
  return res.data;
}

export async function updateBuilding(id, data) {
  const payload = {};

  if (data.name !== undefined) payload.name = data.name.trim();
  if (data.address !== undefined) payload.address = data.address.trim();
  if (data.house !== undefined) payload.house = data.house.trim();
  if (data.floors !== undefined) payload.floors = Number(data.floors);
  if (data.risklevel !== undefined) payload.risklevel = data.risklevel;
  if (data.status !== undefined) payload.status = data.status;
  if (data.description !== undefined) payload.description = data.description ? data.description.trim() : '';

  const res = await api.put(`/buildings/${id}`, payload);
  return res.data;
}

export async function deleteBuilding(id) {
  await api.delete(`/buildings/${id}`);
}