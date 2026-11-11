import { api, apiRequest } from './client.js';

export function register(payload) {
  return api.post('/auth/register', payload, { skipAuthRefresh: true });
}

export function login(payload) {
  return api.post('/auth/login', payload, { skipAuthRefresh: true });
}

export function refresh() {
  return apiRequest('/auth/refresh', {
    method: 'POST',
    skipAuthRefresh: true
  });
}

export function logout() {
  return api.post('/auth/logout', undefined, { skipAuthRefresh: true });
}

export function getMe(options) {
  return api.get('/auth/me', options);
}

export function updateMe(payload) {
  return api.patch('/auth/me', payload);
}

export function changePassword(payload) {
  return api.patch('/auth/password', payload);
}
