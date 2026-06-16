import { describe, it, expect, beforeEach } from 'vitest';
import { allowRequest, _resetRateLimit } from './rateLimit';
import type { HttpRequest } from '@azure/functions';

function req(ip: string): HttpRequest {
  return { headers: { get: (h: string) => (h === 'x-forwarded-for' ? ip : null) } } as unknown as HttpRequest;
}

beforeEach(() => _resetRateLimit());

describe('allowRequest', () => {
  it('allows up to the limit then blocks', () => {
    const r = req('1.2.3.4');
    for (let i = 0; i < 3; i++) expect(allowRequest(r, 3)).toBe(true);
    expect(allowRequest(r, 3)).toBe(false);
  });

  it('tracks separate IPs independently', () => {
    expect(allowRequest(req('a'), 1)).toBe(true);
    expect(allowRequest(req('a'), 1)).toBe(false);
    expect(allowRequest(req('b'), 1)).toBe(true);
  });
});
