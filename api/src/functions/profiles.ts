// profiles.ts — GET /api/profiles (list) · POST /api/profiles (create)
// All rows are scoped to the caller's accountId partition.
import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { randomUUID } from 'node:crypto';
import { getProfilesContainer, isCosmosConfigured } from '../lib/cosmos';
import { getAccountId } from '../lib/account';
import { ProfileUpsert, toClientProfile, type ProfileDoc } from '../lib/profileSchemas';
import { badRequest, json, parseBody, upstreamError, ValidationError } from '../lib/http';

async function handler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (!isCosmosConfigured()) return json(503, { error: 'db_disabled', message: 'Database not configured.' });
  const accountId = getAccountId(req);
  if (!accountId) return json(401, { error: 'unauthenticated', message: 'Sign in required.' });

  try {
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
    return upstreamError('Profile store unavailable.');
  }
}

app.http('profiles', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  route: 'profiles',
  handler,
});
