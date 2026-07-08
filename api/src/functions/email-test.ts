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
    const sent = await sendEmail({
      to,
      subject: 'Memory Capture AI — email test',
      html: `<p style="font-family:sans-serif">ACS email pipeline is working. Sent at ${new Date().toISOString()}.</p>`,
    });
    if (!sent) {
      ctx.warn('[email-test] ACS quota exhausted — email was NOT sent');
      return { status: 429, body: 'ACS hourly quota exhausted (10/hour on Azure Managed Domain). Wait ~1 hour and try again.' };
    }
    ctx.log('[email-test] Send accepted by ACS');
    return { status: 200, body: `Test email accepted by ACS — check inbox/spam at ${to}` };
  } catch (err) {
    const detail = {
      message: (err as Error).message,
      name: (err as Error).name,
      statusCode: (err as { statusCode?: number }).statusCode,
      code: (err as { code?: string }).code,
      details: (err as { details?: unknown }).details,
    };
    ctx.error('[email-test] Send failed', detail);
    return { status: 500, body: JSON.stringify(detail, null, 2) };
  }
}

app.http('email-test', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'email/test',
  handler,
});
