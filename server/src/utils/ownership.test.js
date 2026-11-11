import { describe, expect, it } from 'vitest';

import { assertOwnedRow, assertSameUser } from './ownership.js';

describe('ownership', () => {
  it('devuelve la fila cuando existe', () => {
    const row = { id: 1, user_id: 2 };

    expect(assertOwnedRow(row)).toBe(row);
  });

  it('oculta un recurso inexistente con 404', () => {
    expect(() => assertOwnedRow(null)).toThrowError(
      expect.objectContaining({ status: 404, code: 'NOT_FOUND' })
    );
  });

  it('oculta un recurso de otro usuario con 404', () => {
    expect(() => assertSameUser(2, 1)).toThrowError(
      expect.objectContaining({ status: 404, code: 'NOT_FOUND' })
    );
    expect(assertSameUser(1, 1)).toBe(true);
  });
});
