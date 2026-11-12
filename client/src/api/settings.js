import { api } from './client.js';

export function getSettings(options) {
  return api.get('/settings', options);
}

export function updateSettings(payload) {
  return api.put('/settings', payload);
}
