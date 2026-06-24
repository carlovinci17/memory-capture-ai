// admin-approve.ts — GET /api/admin/approve?userId=&token=&action=approve|deny
// Called from the one-click links in the approval email. No SWA auth required;
// security comes from the HMAC-signed token.
import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { verifyToken } from '../lib/tokens';
import { updateUserStatus } from '../lib/users';
import { isCosmosConfigured } from '../lib/cosmos';

const html = (body: string): HttpResponseInit => ({
  status: 200,
  headers: { 'Content-Type': 'text/html; charset=utf-8' },
  body: `<!doctype html><html><head><meta charset="utf-8"><title>Memory Capture AI</title></head><body style="font-family:sans-serif;max-width:480px;margin:80px auto;text-align:center">${body}</body></html>`,
});

async function handler(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  const userId = req.query.get('userId') ?? '';
  const token = req.query.get('token') ?? '';
  const action = req.query.get('action');

  if (!userId || !token || (action !== 'approve' && action !== 'deny')) {
    return { status: 400, body: 'Missing or invalid parameters.' };
  }

  let valid: boolean;
  try {
    valid = verifyToken(userId, token);
  } catch {
    return { status: 503, body: 'ADMIN_APPROVE_SECRET is not configured on this server.' };
  }
  if (!valid) return { status: 403, body: 'Invalid or expired approval token.' };

  if (!isCosmosConfigured()) return { status: 503, body: 'Database not configured.' };

  try {
    await updateUserStatus(userId, action === 'approve' ? 'approved' : 'denied');
    const verb = action === 'approve' ? 'approved ✓' : 'denied ✗';
    return html(`<h2>User ${verb}</h2><p style="color:#666">You can close this tab.</p>`);
  } catch (err) {
    ctx.error('admin-approve failed', err);
    return { status: 500, body: 'Internal error — check function logs.' };
  }
}

app.http('admin-approve', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'admin/approve',
  handler,
});
