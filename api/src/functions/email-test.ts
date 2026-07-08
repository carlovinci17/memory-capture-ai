// email-test.ts — GET /api/email/test  (protected by ADMIN_APPROVE_SECRET as ?secret=)
// Sends a test email to NOTIFY_EMAIL so you can verify the ACS pipeline without a new sign-up.
import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { sendEmail } from '../lib/email';

async function handler(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  const secret = req.query.get('secret') ?? '';
  if (!secret || secret !== process.env.ADMIN_APPROVE_SECRET) {
    return { status: 403, body: 'Forbidden.' };
  }
  const to = process.env.NOTIFY_EMAIL;
  if (!to) return { status: 503, body: 'NOTIFY_EMAIL not configured.' };

  ctx.log('[email-test] Sending test email to', to);
  try {
    await sendEmail({
      to,
      subject: 'Memory Capture AI — email test',
      html: `<p style="font-family:sans-serif">ACS email pipeline is working. Sent at ${new Date().toISOString()}.</p>`,
    });
    ctx.log('[email-test] Send completed OK');
    return { status: 200, body: `Test email sent to ${to}` };
  } catch (err) {
    ctx.error('[email-test] Send failed', err);
    return { status: 500, body: `Send failed: ${String(err)}` };
  }
}

app.http('email-test', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'email/test',
  handler,
});
