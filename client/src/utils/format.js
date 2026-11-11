export function formatDuration(seconds) {
  const totalSeconds = Number(seconds ?? 0);

  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return '0 min';
  }

  const totalMinutes = Math.round(totalSeconds / 60);

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
}

export function formatDateKey(dateKey) {
  if (!dateKey) {
    return '—';
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeZone: 'UTC'
  }).format(new Date(`${dateKey}T00:00:00.000Z`));
}

export function formatDateTime(isoDate) {
  if (!isoDate) {
    return '—';
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(isoDate));
}
