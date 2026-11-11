import { api } from './client.js';

export function getHealth(options) {
  return api.get('/health', options);
}
