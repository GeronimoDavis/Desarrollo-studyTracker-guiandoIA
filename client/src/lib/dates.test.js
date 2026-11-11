import { describe, expect, it } from 'vitest';

import {
  createClientId,
  formatLocalTime,
  getLocalDayRange,
  isSameLocalDay,
  toIsoTimestamp,
  toLocalDateKey
} from './dates.js';
import { formatClock, formatClockLong } from './timeFormat.js';

describe('client date and time helpers', () => {
  it('calcula el día local sin usar UTC', () => {
    const lateNight = new Date(2026, 10, 11, 23, 59, 59);
    const earlyMorning = new Date(2026, 10, 12, 0, 0, 1);

    expect(toLocalDateKey(lateNight)).toBe('2026-11-11');
    expect(toLocalDateKey(earlyMorning)).toBe('2026-11-12');
    expect(isSameLocalDay(lateNight, new Date(2026, 10, 11, 8))).toBe(true);
    expect(isSameLocalDay(lateNight, earlyMorning)).toBe(false);
  });

  it('devuelve el rango del día local', () => {
    const range = getLocalDayRange(new Date(2026, 10, 11, 15, 30));

    expect(range.dateKey).toBe('2026-11-11');
    expect(range.start.getHours()).toBe(0);
    expect(range.start.getMinutes()).toBe(0);
    expect(range.end.getHours()).toBe(23);
    expect(range.end.getMinutes()).toBe(59);
  });

  it('formatea relojes largos y locales', () => {
    expect(formatClockLong(0)).toBe('00:00:00');
    expect(formatClockLong(3661)).toBe('01:01:01');
    expect(formatClock(59)).toBe('00:59');
    expect(formatClock(3661)).toBe('01:01:01');
    expect(formatLocalTime(new Date(2026, 10, 11, 9, 5, 7))).toBe('09:05:07');
  });

  it('genera UUID y timestamps ISO', () => {
    const clientId = createClientId();

    expect(clientId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(toIsoTimestamp(BASE_DATE)).toBe('2026-11-11T12:00:00.000Z');
  });
});

const BASE_DATE = new Date('2026-11-11T12:00:00.000Z');
