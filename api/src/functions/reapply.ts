// POST /api/users/reapply
// Called when a denied user wants to re-submit their access request.
// Resets their Cosmos status to pending and re-sends the admin + pending emails.
import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { getPrincipal } from '../lib/account';
import { isCosmosConfigured } from '../lib/cosmos';
import { reapplyUser } from '../lib/users';
import { json } from '../lib/http';

async function handler(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  const principal = getPrincipal(req);
  if (!principal) return json(401, { error: 'unauthenticated' });
  if (!isCosmosConfigured()) return json(503, { error: 'db_not_configured' });

  try {
    const ok = await reapplyUser(principal.userId);
    if (!ok) return json(409, { error: 'not_eligible' });
    ctx.log(`[reapply] ${principal.userDetails} re-applied for access`);
    return json(200, { ok: true });
  } catch (err) {
    ctx.error('[reapply] failed', err);
    return json(500, { error: 'internal_error' });
  }
}

app.http('reapply', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'users/reapply',
  handler,
});
