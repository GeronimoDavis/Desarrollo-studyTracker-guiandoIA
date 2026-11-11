import { describe, expect, it } from 'vitest';
import { formatClock, formatMinutes } from './timeFormat.js';

describe('timeFormat', () => {
  it('formatea segundos y minutos', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(65)).toBe('01:05');
    expect(formatClock(3661)).toBe('01:01:01');
  });

  it('normaliza valores inválidos o negativos', () => {
    expect(formatClock(-10)).toBe('00:00');
    expect(formatMinutes(3600)).toBe('60 min');
  });
});
