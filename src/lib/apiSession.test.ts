import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSessionToken, withSessionHeader, _resetSessionTokenCache, SESSION_TOKEN_HEADER } from './apiSession';

beforeEach(() => _resetSessionTokenCache());
afterEach(() => vi.restoreAllMocks());

describe('apiSession', () => {
  it('mints and caches a token (one fetch for two calls)', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ token: 'tok', expiresAt: Date.now() + 10 * 60_000 }), { status: 200 }),
    );
    expect(await getSessionToken()).toBe('tok');
    expect(await getSessionToken()).toBe('tok');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('returns null when the endpoint is disabled', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 503 }));
    expect(await getSessionToken()).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));
    expect(await getSessionToken()).toBeNull();
  });

  it('attaches the token header when available, merging with existing headers', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ token: 'tok', expiresAt: Date.now() + 10 * 60_000 }), { status: 200 }),
    );
    const headers = await withSessionHeader({ 'Content-Type': 'application/json' });
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers[SESSION_TOKEN_HEADER]).toBe('tok');
  });

  it('omits the header when no token is available', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 503 }));
    const headers = await withSessionHeader({ 'Content-Type': 'application/json' });
    expect(headers).toEqual({ 'Content-Type': 'application/json' });
  });
});
