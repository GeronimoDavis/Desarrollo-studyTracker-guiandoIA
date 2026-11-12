import { describe, expect, it } from 'vitest';

import { isValidTimezone, listTimezones } from './timezones.js';

describe('timezones helpers', () => {
  it('acepta zonas horarias IANA válidas', () => {
    expect(isValidTimezone('UTC')).toBe(true);
    expect(isValidTimezone('America/Argentina/Buenos_Aires')).toBe(true);
  });

  it('rechaza valores inválidos', () => {
    expect(isValidTimezone('')).toBe(false);
    expect(isValidTimezone('No/Existe')).toBe(false);
  });

  it('incluye la zona actual entre las opciones', () => {
    const zones = listTimezones(['America/Argentina/Buenos_Aires']);

    expect(zones).toContain('America/Argentina/Buenos_Aires');
    expect(zones).toContain('UTC');
    expect([...zones].sort((left, right) => left.localeCompare(right))).toEqual(
      zones
    );
  });
});
