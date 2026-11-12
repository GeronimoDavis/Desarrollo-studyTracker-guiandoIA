const FALLBACK_TIMEZONES = [
  'UTC',
  'America/Argentina/Buenos_Aires',
  'America/Bogota',
  'America/Cancun',
  'America/Chicago',
  'America/Mexico_City',
  'America/New_York',
  'America/Santiago',
  'America/Sao_Paulo',
  'America/Toronto',
  'Africa/Cairo',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Europe/Berlin',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Paris',
  'Europe/Rome'
];

export function listTimezones(extra = []) {
  let zones = [];

  try {
    if (typeof Intl.supportedValuesOf === 'function') {
      zones = Intl.supportedValuesOf('timeZone');
    }
  } catch {
    zones = [];
  }

  const merged = new Set([...zones, ...FALLBACK_TIMEZONES, ...extra]);

  return [...merged].sort((left, right) => left.localeCompare(right));
}

export function isValidTimezone(value) {
  if (!value) {
    return false;
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}
