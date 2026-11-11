function pad(value) {
  return String(value).padStart(2, '0');
}

function toDate(value) {
  return value instanceof Date ? value : new Date(value);
}

export function toLocalDateKey(value = new Date()) {
  const date = toDate(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('-');
}

export function isSameLocalDay(left, right) {
  return toLocalDateKey(left) === toLocalDateKey(right);
}

export function formatLocalDate(value, options = {}) {
  const date = toDate(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    ...options
  }).format(date);
}

export function formatLocalTime(value, options = {}) {
  const date = toDate(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    ...options
  }).format(date);
}

export function formatLocalDateTime(value) {
  const date = toDate(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
}

export function getLocalDayRange(value = new Date()) {
  const date = toDate(value);
  const start = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0
  );
  const end = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999
  );

  return {
    start,
    end,
    dateKey: toLocalDateKey(date)
  };
}

export function createClientId() {
  if (typeof crypto === 'undefined' || !crypto.randomUUID) {
    throw new Error('El navegador no puede generar un identificador de sesión.');
  }

  return crypto.randomUUID();
}

export function toIsoTimestamp(value) {
  const date = toDate(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}
