const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad(value) {
  return String(value).padStart(2, '0');
}

function parseDateKey(dateKey) {
  const match = DATE_KEY_PATTERN.exec(dateKey);

  if (!match) {
    throw new Error(`Fecha inválida: ${dateKey}`);
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3])
  };
}

function formatUtcDate(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )}`;
}

export function getLocalDateString(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const values = {};

  for (const part of parts) {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  }

  return `${values.year}-${values.month}-${values.day}`;
}

export function todayInZone(timeZone, now = new Date()) {
  return getLocalDateString(now, timeZone);
}

export function addDays(dateKey, amount) {
  const { year, month, day } = parseDateKey(dateKey);
  const date = new Date(Date.UTC(year, month - 1, day + amount));

  return formatUtcDate(date);
}

export function startOfWeek(dateKey) {
  const { year, month, day } = parseDateKey(dateKey);
  const date = new Date(Date.UTC(year, month - 1, day));
  const offset = (date.getUTCDay() + 6) % 7;

  return addDays(dateKey, -offset);
}

export function endOfWeek(dateKey) {
  return addDays(startOfWeek(dateKey), 6);
}

export function startOfMonth(dateKey) {
  const { year, month } = parseDateKey(dateKey);
  return `${year}-${pad(month)}-01`;
}

export function endOfMonth(dateKey) {
  const { year, month } = parseDateKey(dateKey);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return `${year}-${pad(month)}-${pad(lastDay)}`;
}

export function startOfYear(dateKey) {
  const { year } = parseDateKey(dateKey);
  return `${year}-01-01`;
}

export function endOfYear(dateKey) {
  const { year } = parseDateKey(dateKey);
  return `${year}-12-31`;
}

export function getPeriodRanges(dateKey) {
  return {
    week: {
      start: startOfWeek(dateKey),
      end: endOfWeek(dateKey)
    },
    month: {
      start: startOfMonth(dateKey),
      end: endOfMonth(dateKey)
    },
    year: {
      start: startOfYear(dateKey),
      end: endOfYear(dateKey)
    }
  };
}
