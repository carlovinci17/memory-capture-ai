// cancel-request.ts — POST /api/users/cancel
// Called when a pending user cancels their approval request.
// Deletes their Cosmos record (so they can re-apply later) and notifies the admin.
import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { getPrincipal } from '../lib/account';
import { isCosmosConfigured, getUsersContainer } from '../lib/cosmos';
import { sendEmail } from '../lib/email';
import { json } from '../lib/http';

async function handler(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  const principal = getPrincipal(req);
  if (!principal) return json(401, { error: 'unauthenticated' });
  if (!isCosmosConfigured()) return json(503, { error: 'db_not_configured' });

  const userId = principal.userId;
  const email = principal.userDetails ?? '';
  const name = principal.name ?? email;

  try {
    const container = await getUsersContainer();
    try {
      await container.item(userId, userId).delete();
    } catch (err) {
      // 404 just means they weren't in the users table — still send the email.
      if (Number((err as { code?: number | string }).code) !== 404) throw err;
    }

    const sends: Promise<unknown>[] = [];

    const notifyTo = process.env.NOTIFY_EMAIL;
    if (notifyTo) {
      sends.push(sendEmail({
        to: notifyTo,
        subject: `Approval request cancelled: ${name}`,
        html: `
<p style="font-family:sans-serif">A user has cancelled their Memory Capture AI sign-up request.</p>
<table style="font-family:sans-serif;border-collapse:collapse;margin:12px 0">
  <tr><td style="padding:4px 12px 4px 0;font-weight:600">Name</td><td>${name}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:600">Email</td><td>${email}</td></tr>
</table>
<p style="font-family:sans-serif;color:#888;font-size:13px">Their approval record has been removed. They can re-apply by signing in again.</p>`,
      }));
    }

    if (email) {
      sends.push(sendEmail({
        to: email,
        subject: 'Memory Capture AI — your request has been cancelled',
        html: `
<p style="font-family:sans-serif">Hi${name && name !== email ? ` ${name}` : ''},</p>
<p style="font-family:sans-serif">Your Memory Capture AI access request has been cancelled as requested.</p>
<p style="font-family:sans-serif">If you change your mind, you can sign in again at any time to re-submit your request.</p>
<p style="font-family:sans-serif;color:#888;font-size:13px">If you didn't cancel this request, please reply to this email.</p>`,
      }));
    }

    await Promise.allSettled(sends);

    ctx.log(`[cancel-request] ${email} cancelled their request`);
    return json(200, { ok: true });
  } catch (err) {
    ctx.error('[cancel-request] failed', err);
    return json(500, { error: 'internal_error' });
  }
}

app.http('cancel-request', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'users/cancel',
  handler,
});
