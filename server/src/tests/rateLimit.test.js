import { describe, expect, it } from 'vitest';

import { buildLoginKey } from '../middlewares/rateLimit.middleware.js';

function request(ip, email) {
  return { ip, body: { email } };
}

describe('login rate limit key', () => {
  it('normaliza IPv6 a un /56 para que un /64 no evada el límite', () => {
    const first = buildLoginKey(
      request('2001:db8:1234:5678::1', 'ana@example.com')
    );
    const second = buildLoginKey(
      request('2001:db8:1234:5679::2', 'ana@example.com')
    );

    expect(first).toBe(second);
    expect(first).toContain('2001:db8:1234:5600::/56');
  });

  it('distingue subredes IPv6 distintos', () => {
    const first = buildLoginKey(
      request('2001:db8:1234:5678::1', 'ana@example.com')
    );
    const other = buildLoginKey(
      request('2001:db8:abcd:5678::1', 'ana@example.com')
    );

    expect(first).not.toBe(other);
  });

  it('deja las direcciones IPv4 intactas', () => {
    expect(buildLoginKey(request('127.0.0.1', 'ana@example.com'))).toBe(
      '127.0.0.1:ana@example.com'
    );
  });

  it('normaliza el email y separa cuentas distintas', () => {
    const first = buildLoginKey(request('127.0.0.1', ' Ana@Example.com '));
    const second = buildLoginKey(request('127.0.0.1', 'ana@example.com'));
    const other = buildLoginKey(request('127.0.0.1', 'otro@example.com'));

    expect(first).toBe(second);
    expect(first).not.toBe(other);
  });
});
