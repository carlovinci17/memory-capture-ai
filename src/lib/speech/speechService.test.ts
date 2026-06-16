import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isSpeechAvailable, _resetTokenCache } from './speechService';

beforeEach(() => _resetTokenCache());
afterEach(() => vi.restoreAllMocks());

describe('speechService token handling', () => {
  it('reports available and caches the token (one fetch for two checks)', async () => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ token: 'tok', region: 'eastus' }), { status: 200 }),
      );
    expect(await isSpeechAvailable()).toBe(true);
    expect(await isSpeechAvailable()).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1); // second call served from cache
  });

  it('reports unavailable when the endpoint is disabled (503)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 503 }));
    expect(await isSpeechAvailable()).toBe(false);
  });

  it('reports unavailable when fetch throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));
    expect(await isSpeechAvailable()).toBe(false);
  });
});
