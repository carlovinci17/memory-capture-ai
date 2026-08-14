import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let handler: (req: unknown, ctx: unknown) => Promise<{ status: number; body?: unknown }>;
vi.mock('@azure/functions', () => ({
  app: {
    http: (_name: string, opts: { handler: typeof handler }) => {
      handler = opts.handler;
    },
  },
}));

const ctx = { error: () => {} };
const req = () => ({ headers: { get: () => null } });

beforeEach(async () => {
  vi.resetModules();
  process.env.SESSION_TOKEN_SECRET = 'test-secret';
});
afterEach(() => vi.restoreAllMocks());

async function load() {
  await import('./session-start');
}

describe('session-start', () => {
  it('mints a token when configured', async () => {
    await load();
    const res = await handler(req(), ctx);
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body as string);
    expect(body.token).toBeTruthy();
    expect(body.expiresAt).toBeGreaterThan(Date.now());
  });

  it('returns 503 when not configured', async () => {
    delete process.env.SESSION_TOKEN_SECRET;
    await load();
    const res = await handler(req(), ctx);
    expect(res.status).toBe(503);
  });
});
