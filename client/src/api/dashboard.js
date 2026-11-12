import { api } from './client.js';

export function getDashboard({ signal } = {}) {
  return api.get('/dashboard', { signal });
}

export function getPeriodReport({ period = 'week', date, signal } = {}) {
  const query = new URLSearchParams({ period });

  if (date) {
    query.set('date', date);
  }

  return api.get(`/stats/period?${query.toString()}`, { signal });
}

export function getDailyReport({ date, signal } = {}) {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return api.get(`/stats/daily${query}`, { signal });
}

export function getHeatmap({ year, signal } = {}) {
  const query = year ? `?year=${encodeURIComponent(year)}` : '';
  return api.get(`/stats/heatmap${query}`, { signal });
}
