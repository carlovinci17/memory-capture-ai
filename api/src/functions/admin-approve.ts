// admin-approve.ts — GET /api/users/notify-approved?userId=&token=
// After manually approving a user in Cosmos DB, click the link in the admin
// notification email to send them their welcome email. Does NOT modify the DB.
import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { verifyToken } from '../lib/tokens';
import { notifyUser, getUserDoc } from '../lib/users';
import { isCosmosConfigured } from '../lib/cosmos';

const html = (body: string): HttpResponseInit => ({
  status: 200,
  headers: { 'Content-Type': 'text/html; charset=utf-8' },
  body: `<!doctype html><html><head><meta charset="utf-8"><title>Memory Capture AI</title></head><body style="font-family:sans-serif;max-width:480px;margin:80px auto;text-align:center">${body}</body></html>`,
});

async function handler(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  const userId = req.query.get('userId') ?? '';
  const token = req.query.get('token') ?? '';

  if (!userId || !token) return { status: 400, body: 'Missing parameters.' };

  let valid: boolean;
  try {
    valid = verifyToken(userId, token);
  } catch {
    return { status: 503, body: 'ADMIN_APPROVE_SECRET is not configured on this server.' };
  }
  if (!valid) return { status: 403, body: 'Invalid or expired token.' };

  if (!isCosmosConfigured()) return { status: 503, body: 'Database not configured.' };

  try {
    const user = await getUserDoc(userId);
    if (!user) return html('<h2>User not found ✗</h2><p style="color:#666">They may have cancelled their request.</p>');
    if (user.status !== 'approved') {
      return html(`<h2>Not yet approved</h2><p style="color:#666">Set the user's status to <strong>approved</strong> in Cosmos DB first, then click the link again.</p>`);
    }
    await notifyUser(user);
    ctx.log('[notify-approved] welcome email sent to', user.email);
    return html(`<h2>Welcome email sent ✓</h2><p style="color:#666">${user.email} has been notified. You can close this tab.</p>`);
  } catch (err) {
    ctx.error('notify-approved failed', err);
    return { status: 500, body: 'Internal error — check function logs.' };
  }
}

app.http('admin-approve', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'users/notify-approved',
  handler,
});
