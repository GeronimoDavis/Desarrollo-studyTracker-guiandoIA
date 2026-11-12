import { api } from './client.js';

export function createSession(payload) {
  return api.post('/sessions', payload);
}

export function listSessions({ from, to, subjectId, status, mode, limit = 100, offset = 0, signal } = {}) {
  const query = new URLSearchParams();

  if (from) {
    query.set('from', from);
  }

  if (to) {
    query.set('to', to);
  }

  if (subjectId) {
    query.set('subjectId', subjectId);
  }

  if (status) {
    query.set('status', status);
  }

  if (mode) {
    query.set('mode', mode);
  }

  query.set('limit', limit);
  query.set('offset', offset);

  return api.get(`/sessions?${query.toString()}`, { signal });
}

export async function listAllSessions(options = {}) {
  const limit = options.limit ?? 100;
  const sessions = [];
  let offset = 0;

  while (true) {
    const data = await listSessions({ ...options, limit, offset });
    sessions.push(...data.sessions);
    offset += data.sessions.length;

    if (
      data.sessions.length === 0 ||
      offset >= data.pagination.total
    ) {
      return sessions;
    }
  }
}
