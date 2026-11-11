import { api } from './client.js';

export function createSession(payload) {
  return api.post('/sessions', payload);
}
