import { describe, expect, it } from 'vitest';
import { HttpError } from './httpError.js';

describe('HttpError', () => {
  it('expone el estado, código y mensaje', () => {
    const error = new HttpError(404, 'NOT_FOUND', 'No encontrado');

    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('No encontrado');
    expect(error.expose).toBe(true);
  });
});
