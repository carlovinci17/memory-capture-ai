import { describe, it, expect, beforeEach } from 'vitest';
import { createHmac } from 'node:crypto';
import type { HttpRequest } from '@azure/functions';
import { _resetRateLimit } from './rateLimit';
import {
  SESSION_TOKEN_HEADER,
  isSessionTokenConfigured,
  mintSessionToken,
  requireSession,
  requireSessionToken,
} from './sessionToken';

function req(token: string | null): HttpRequest {
  return { headers: { get: (h: string) => (h === SESSION_TOKEN_HEADER ? token : null) } } as unknown as HttpRequest;
}

/** Signs a payload the same way sessionToken.ts does, for constructing test tokens with arbitrary issuedAt values. */
function sign(issuedAt: number): string {
  return createHmac('sha256', process.env.SESSION_TOKEN_SECRET!).update(`session:${issuedAt}`).digest('hex');
}

beforeEach(() => {
  process.env.SESSION_TOKEN_SECRET = 'test-secret';
  _resetRateLimit();
});

describe('sessionToken', () => {
  it('reports configured/unconfigured based on the env var', () => {
    expect(isSessionTokenConfigured()).toBe(true);
    delete process.env.SESSION_TOKEN_SECRET;
    expect(isSessionTokenConfigured()).toBe(false);
  });

  it('accepts a freshly minted token', () => {
    const { token, expiresAt } = mintSessionToken();
    expect(expiresAt).toBeGreaterThan(Date.now());
    expect(requireSessionToken(req(token))).toBe(true);
  });

  it('rejects a missing token', () => {
    const result = requireSessionToken(req(null));
    expect(result).not.toBe(true);
    expect((result as { status: number }).status).toBe(401);
  });

  it('rejects a tampered signature', () => {
    const { token } = mintSessionToken();
    const [issuedAt] = token.split('.');
    const tampered = `${issuedAt}.${'0'.repeat(64)}`;
    expect(requireSessionToken(req(tampered))).not.toBe(true);
  });

  it('rejects an expired token', () => {
    const staleIssuedAt = Date.now() - 3 * 60 * 60 * 1000; // 3h ago, TTL is 2h
    expect(requireSessionToken(req(`${staleIssuedAt}.${sign(staleIssuedAt)}`))).not.toBe(true);
  });

  it('rejects a future-dated token', () => {
    const futureIssuedAt = Date.now() + 60_000;
    expect(requireSessionToken(req(`${futureIssuedAt}.${sign(futureIssuedAt)}`))).not.toBe(true);
  });

  it('rejects a malformed token', () => {
    expect(requireSessionToken(req('not-a-real-token'))).not.toBe(true);
  });
});

describe('requireSession (rate limit + session token combined)', () => {
  it('accepts a valid token within the rate limit', () => {
    const { token } = mintSessionToken();
    expect(requireSession(req(token), 5)).toBe(true);
  });

  it('rejects when the token is missing, even within the rate limit', () => {
    const result = requireSession(req(null), 5);
    expect(result).not.toBe(true);
    expect((result as { status: number }).status).toBe(401);
  });

  it('rejects with 429 once the rate limit is exceeded, before checking the token', () => {
    const result1 = requireSession(req(null), 1);
    expect((result1 as { status: number }).status).toBe(401); // first call: rate limit OK, token missing
    const result2 = requireSession(req(null), 1);
    expect((result2 as { status: number }).status).toBe(429); // second call: rate limit now exceeded
  });
});
