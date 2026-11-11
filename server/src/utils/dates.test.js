import { describe, expect, it } from 'vitest';

import {
  addDays,
  endOfMonth,
  endOfWeek,
  getLocalDateString,
  getPeriodRanges,
  startOfMonth,
  startOfWeek,
  todayInZone
} from './dates.js';

describe('dates', () => {
  it('calcula la fecha local cruzando medianoche UTC', () => {
    expect(
      getLocalDateString(
        new Date('2026-01-01T02:30:00.000Z'),
        'America/Argentina/Buenos_Aires'
      )
    ).toBe('2025-12-31');
    expect(
      getLocalDateString(new Date('2026-01-01T02:30:00.000Z'), 'UTC')
    ).toBe('2026-01-01');
  });

  it('respeta el cambio de horario de verano', () => {
    expect(
      getLocalDateString(
        new Date('2026-03-08T06:30:00.000Z'),
        'America/New_York'
      )
    ).toBe('2026-03-08');
    expect(
      getLocalDateString(
        new Date('2026-03-09T04:30:00.000Z'),
        'America/New_York'
      )
    ).toBe('2026-03-09');
  });

  it('usa la fecha actual en la zona indicada', () => {
    expect(
      todayInZone(
        'America/Argentina/Buenos_Aires',
        new Date('2026-11-12T01:00:00.000Z')
      )
    ).toBe('2026-11-11');
  });

  it('calcula la semana de lunes a domingo', () => {
    expect(startOfWeek('2026-11-11')).toBe('2026-11-09');
    expect(endOfWeek('2026-11-11')).toBe('2026-11-15');
    expect(startOfWeek('2026-11-09')).toBe('2026-11-09');
    expect(startOfWeek('2026-11-15')).toBe('2026-11-09');
  });

  it('calcula mes y año, incluyendo año bisiesto', () => {
    expect(startOfMonth('2026-11-11')).toBe('2026-11-01');
    expect(endOfMonth('2026-11-11')).toBe('2026-11-30');
    expect(endOfMonth('2024-02-10')).toBe('2024-02-29');
    expect(endOfMonth('2026-02-10')).toBe('2026-02-28');
    expect(getPeriodRanges('2026-11-11')).toEqual({
      week: { start: '2026-11-09', end: '2026-11-15' },
      month: { start: '2026-11-01', end: '2026-11-30' },
      year: { start: '2026-01-01', end: '2026-12-31' }
    });
  });

  it('suma días cruzando fin de año', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });
});
