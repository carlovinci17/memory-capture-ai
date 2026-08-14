// session-start.ts — POST /api/session/start
// Mints the anonymous session token required by the public AI + speech
// endpoints (see lib/sessionToken.ts for why this exists instead of requiring
// sign-in). No body, no state stored — just a signed, time-boxed token.
import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { json, tooManyRequests } from '../lib/http';
import { allowRequest } from '../lib/rateLimit';
import { isSessionTokenConfigured, mintSessionToken } from '../lib/sessionToken';

async function handler(req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  if (!allowRequest(req, 20)) return tooManyRequests();
  if (!isSessionTokenConfigured()) {
    return json(503, { error: 'session_disabled', message: 'Sessions are not configured.' });
  }
  const { token, expiresAt } = mintSessionToken();
  return json(200, { token, expiresAt });
}

app.http('session-start', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'session/start',
  handler,
});
