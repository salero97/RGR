import api, { setApiToken } from './axios';

export async function login(email, password) {
  const res = await api.post('/auth/login', { email, password });
  setApiToken(res.data.accessToken);
  return res.data;
}

export async function register(email, password, fullname) {
  const res = await api.post('/auth/register', { email, password, fullname });
  return res.data;
}

export async function logout() {
  await api.post('/auth/logout');
  setApiToken(null);
}