import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// The function registers itself with the Functions runtime on import; we stub
// `app.http` so importing the module just captures the handler.
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
  delete process.env.AZURE_SPEECH_KEY;
  delete process.env.AZURE_SPEECH_REGION;
});
afterEach(() => vi.restoreAllMocks());

async function load() {
  await import('./speech-token');
}

describe('speech-token', () => {
  it('returns 503 when Speech is not configured', async () => {
    await load();
    const res = await handler(req(), ctx);
    expect(res.status).toBe(503);
  });

  it('mints a token when configured', async () => {
    process.env.AZURE_SPEECH_KEY = 'k';
    process.env.AZURE_SPEECH_REGION = 'eastus';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('the-token', { status: 200 }));
    await load();
    const res = await handler(req(), ctx);
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body as string)).toEqual({ token: 'the-token', region: 'eastus' });
  });

  it('returns 502 when the token service errors', async () => {
    process.env.AZURE_SPEECH_KEY = 'k';
    process.env.AZURE_SPEECH_REGION = 'eastus';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('no', { status: 401 }));
    await load();
    const res = await handler(req(), ctx);
    expect(res.status).toBe(502);
  });
});
