// profiles.ts — GET /api/profiles (list) · POST /api/profiles (create)
// All rows are scoped to the caller's accountId partition.
import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { randomUUID } from 'node:crypto';
import { getProfilesContainer, isCosmosConfigured } from '../lib/cosmos';
import { requireApproved } from '../lib/auth';
import { ProfileUpsert, toClientProfile, type ProfileDoc } from '../lib/profileSchemas';
import { badRequest, json, parseBody, ValidationError } from '../lib/http';

async function handler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (!isCosmosConfigured()) return json(503, { error: 'db_disabled', message: 'Database not configured.' });
  try {
    const auth = await requireApproved(req);
    if (!('accountId' in auth)) return auth;
    const { accountId } = auth;
    const container = await getProfilesContainer();

    if (req.method === 'GET') {
      const { resources } = await container.items
        .query<ProfileDoc>({
          query: 'SELECT * FROM c WHERE c.accountId = @a ORDER BY c.createdAt ASC',
          parameters: [{ name: '@a', value: accountId }],
        })
        .fetchAll();
      return json(200, { profiles: resources.map(toClientProfile) });
    }

    // POST — create
    const payload = await parseBody(req, ProfileUpsert);
    const doc: ProfileDoc = { ...payload, id: randomUUID(), accountId };
    const { resource } = await container.items.create(doc);
    return json(201, toClientProfile(resource as ProfileDoc));
  } catch (err) {
    if (err instanceof ValidationError) return badRequest(err.message);
    context.error('profiles failed', err);
    const e = err as { code?: unknown; statusCode?: unknown; message?: string };
    return json(502, { error: 'upstream_error', debug: `code=${e.code} statusCode=${e.statusCode} msg=${e.message}` });
  }
}

app.http('profiles', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  route: 'profiles',
  handler,
});
