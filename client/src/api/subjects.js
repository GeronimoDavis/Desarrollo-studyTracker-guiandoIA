import { api } from './client.js';

export function listSubjects({ includeArchived = false, signal } = {}) {
  const query = includeArchived ? '?includeArchived=1' : '';
  return api.get(`/subjects${query}`, { signal });
}

export function getSubject(id, options) {
  return api.get(`/subjects/${id}`, options);
}

export function createSubject(payload) {
  return api.post('/subjects', payload);
}

export function updateSubject(id, payload) {
  return api.put(`/subjects/${id}`, payload);
}

export function deleteSubject(id) {
  return api.delete(`/subjects/${id}`);
}

export function restoreSubject(id) {
  return api.post(`/subjects/${id}/restore`);
}

export function getSubjectStats(id, options) {
  return api.get(`/subjects/${id}/stats`, options);
}
