import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let handler: (req: unknown, ctx: unknown) => Promise<{ status: number; body?: unknown }>;
vi.mock('@azure/functions', () => ({
  app: {
    http: (_n: string, opts: { handler: typeof handler }) => {
      handler = opts.handler;
    },
  },
}));

// Fake Cosmos containers.
const created: unknown[] = [];
const fakeContainer = {
  items: {
    query: () => ({
      fetchAll: async () => ({
        resources: [
          { id: 'a', accountId: 'guest', name: 'Eleanor', personaId: 'historian', createdAt: 1, memories: [], sessions: 0 },
        ],
      }),
    }),
    create: async (doc: unknown) => {
      created.push(doc);
      return { resource: doc };
    },
  },
};
const fakeUsersContainer = {
  item: () => ({ read: async () => ({ resource: { id: 'guest', email: '', status: 'approved' } }) }),
};
vi.mock('./../lib/cosmos', () => ({
  isCosmosConfigured: () => true,
  getProfilesContainer: async () => fakeContainer,
  getUsersContainer: async () => fakeUsersContainer,
}));

const ctx = { error: () => {} };
const PRINCIPAL = Buffer.from(
  JSON.stringify({ userId: 'guest', identityProvider: 'github' }),
).toString('base64');
function req(method: string, body?: unknown, principal: string | null = PRINCIPAL) {
  return {
    method,
    headers: { get: (h: string) => (h === 'x-ms-client-principal' ? principal : null) },
    json: async () => body,
    params: {},
  };
}

beforeEach(() => {
  vi.resetModules();
  created.length = 0;
});
afterEach(() => vi.restoreAllMocks());

async function load() {
  await import('./profiles');
}

describe('profiles function', () => {
  it('lists profiles for the account (stripped of system fields)', async () => {
    await load();
    const res = await handler(req('GET'), ctx);
    expect(res.status).toBe(200);
    const data = JSON.parse(res.body as string);
    expect(data.profiles).toHaveLength(1);
    expect(data.profiles[0]).not.toHaveProperty('accountId');
  });

  it('creates a profile with a server-assigned id under the guest partition', async () => {
    await load();
    const res = await handler(
      req('POST', { name: 'Thomas Hale', personaId: 'journalist', createdAt: 2 }),
      ctx,
    );
    expect(res.status).toBe(201);
    const doc = created[0] as { id: string; accountId: string };
    expect(doc.id).toBeTruthy();
    expect(doc.accountId).toBe('guest');
  });

  it('rejects an invalid create payload with 400', async () => {
    await load();
    const res = await handler(req('POST', { personaId: 'journalist' }), ctx); // missing name/createdAt
    expect(res.status).toBe(400);
  });

  it('rejects an anonymous request with 401', async () => {
    await load();
    const res = await handler(req('GET', undefined, null), ctx);
    expect(res.status).toBe(401);
  });
});
