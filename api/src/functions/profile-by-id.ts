// profile-by-id.ts — GET/PATCH/DELETE /api/profiles/{id}
// Cross-account access is impossible: reads/writes use the caller's accountId as
// the partition key, so another owner's id simply isn't found.
import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { getProfilesContainer, isCosmosConfigured } from '../lib/cosmos';
import { requireApproved } from '../lib/auth';
import { ProfileUpsert, toClientProfile, type ProfileDoc } from '../lib/profileSchemas';
import { badRequest, json, parseBody, upstreamError, ValidationError } from '../lib/http';

async function handler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (!isCosmosConfigured()) return json(503, { error: 'db_disabled', message: 'Database not configured.' });
  const id = req.params.id;
  if (!id) return badRequest('Missing profile id.');
  try {
    const auth = await requireApproved(req);
    if (!('accountId' in auth)) return auth;
    const { accountId } = auth;
    const container = await getProfilesContainer();
    const item = container.item(id, accountId);

    if (req.method === 'GET') {
      const { resource } = await item.read<ProfileDoc>();
      if (!resource) return json(404, { error: 'not_found' });
      return json(200, toClientProfile(resource));
    }

    if (req.method === 'PATCH') {
      const payload = await parseBody(req, ProfileUpsert);
      const doc: ProfileDoc = { ...payload, id, accountId };
      const { resource } = await item.replace(doc);
      return json(200, toClientProfile(resource as ProfileDoc));
    }

    // DELETE
    await item.delete();
    return json(200, { ok: true });
  } catch (err) {
    if (err instanceof ValidationError) return badRequest(err.message);
    if ((err as { code?: number }).code === 404) return json(404, { error: 'not_found' });
    context.error('profile-by-id failed', err);
    return upstreamError('Profile store unavailable.');
  }
}

app.http('profile-by-id', {
  methods: ['GET', 'PATCH', 'DELETE'],
  authLevel: 'anonymous',
  route: 'profiles/{id}',
  handler,
});
