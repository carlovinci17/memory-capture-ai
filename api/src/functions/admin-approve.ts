// GET /api/users/review?userId=&action=approve|reject&token=
// Called when admin clicks Approve or Reject in the notification email.
// Verifies the HMAC token, updates the user's status in Cosmos, and emails the user.
import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { verifyToken } from '../lib/tokens';
import { getUserDoc, updateUserStatus } from '../lib/users';
import { isCosmosConfigured } from '../lib/cosmos';

const html = (body: string): HttpResponseInit => ({
  status: 200,
  headers: { 'Content-Type': 'text/html; charset=utf-8' },
  body: `<!doctype html><html><head><meta charset="utf-8"><title>Memory Capture AI</title></head><body style="font-family:sans-serif;max-width:480px;margin:80px auto;text-align:center">${body}</body></html>`,
});

async function handler(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  const userId = req.query.get('userId') ?? '';
  const action = req.query.get('action') ?? '';
  const token  = req.query.get('token')  ?? '';

  if (!userId || !token || (action !== 'approve' && action !== 'reject')) {
    return { status: 400, body: 'Missing or invalid parameters.' };
  }

  let valid: boolean;
  try {
    valid = verifyToken(userId, token, action);
  } catch {
    return { status: 503, body: 'ADMIN_APPROVE_SECRET is not configured on this server.' };
  }
  if (!valid) return { status: 403, body: 'Invalid or expired token.' };

  if (!isCosmosConfigured()) return { status: 503, body: 'Database not configured.' };

  const user = await getUserDoc(userId);
  if (!user) {
    return html('<h2>User not found ✗</h2><p style="color:#666">They may have cancelled their request.</p>');
  }

  if (user.status === 'approved' || user.status === 'denied') {
    const label = user.status === 'approved' ? 'approved ✓' : 'rejected ✗';
    return html(`<h2>Already ${label}</h2><p style="color:#666">This user has already been ${user.status}. No changes made.</p>`);
  }

  try {
    const dbStatus = action === 'approve' ? 'approved' : 'denied';
    await updateUserStatus(userId, dbStatus);
    ctx.log(`[review] ${dbStatus} — ${user.email}`);

    return action === 'approve'
      ? html(`<h2>Approved ✓</h2><p style="color:#666">${esc(user.email)} has been approved and notified. You can close this tab.</p>`)
      : html(`<h2>Rejected ✗</h2><p style="color:#666">${esc(user.email)} has been rejected and notified. You can close this tab.</p>`);
  } catch (err) {
    ctx.error('[review] failed', err);
    return { status: 500, body: 'Internal error — check function logs.' };
  }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

app.http('admin-approve', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'users/review',
  handler,
});
