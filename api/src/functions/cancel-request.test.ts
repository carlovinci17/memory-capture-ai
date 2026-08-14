import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let handler: (req: unknown, ctx: unknown) => Promise<{ status: number; body?: unknown }>;
vi.mock('@azure/functions', () => ({
  app: {
    http: (_n: string, opts: { handler: typeof handler }) => {
      handler = opts.handler;
    },
  },
}));

const deleted: string[] = [];
const fakeUsersContainer = {
  item: () => ({ delete: async () => { deleted.push('deleted'); } }),
};
vi.mock('../lib/cosmos', () => ({
  isCosmosConfigured: () => true,
  getUsersContainer: async () => fakeUsersContainer,
}));

const sentEmails: { to: string; subject: string; html: string }[] = [];
vi.mock('../lib/email', () => ({
  sendEmail: async (opts: { to: string; subject: string; html: string }) => {
    sentEmails.push(opts);
    return true;
  },
}));

const ctx = { log: () => {}, error: () => {} };
const MALICIOUS_NAME = '<img src=x onerror=alert(1)><a href="https://evil.example">click</a>';
function req(name: string) {
  const principal = Buffer.from(
    JSON.stringify({
      userId: 'u1',
      userDetails: 'user@example.com',
      claims: [{ typ: 'name', val: name }],
    }),
  ).toString('base64');
  return { headers: { get: (h: string) => (h === 'x-ms-client-principal' ? principal : null) } };
}

beforeEach(() => {
  vi.resetModules();
  deleted.length = 0;
  sentEmails.length = 0;
  process.env.NOTIFY_EMAIL = 'admin@example.com';
});
afterEach(() => vi.restoreAllMocks());

async function load() {
  await import('./cancel-request');
}

describe('cancel-request', () => {
  it('HTML-escapes an attacker-controlled display name before it reaches the admin/user emails', async () => {
    await load();
    const res = await handler(req(MALICIOUS_NAME), ctx);
    expect(res.status).toBe(200);
    expect(sentEmails.length).toBeGreaterThan(0);
    for (const email of sentEmails) {
      expect(email.html).not.toContain('<img');
      expect(email.html).not.toContain('<a href');
      expect(email.html).toContain('&lt;img');
    }
  });

  it('still renders a normal name unescaped-looking (no stray entities)', async () => {
    await load();
    const res = await handler(req('Eleanor Marchetti'), ctx);
    expect(res.status).toBe(200);
    expect(sentEmails.some((e) => e.html.includes('Eleanor Marchetti'))).toBe(true);
  });
});
