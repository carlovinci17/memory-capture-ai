interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(opts: EmailOptions): Promise<void> {
  const connString = process.env.ACS_CONNECTION_STRING;
  const from = process.env.NOTIFY_FROM_EMAIL;
  if (!connString || !from) {
    console.warn('[email] ACS_CONNECTION_STRING or NOTIFY_FROM_EMAIL not set — skipping notification');
    return;
  }
  // Lazy import avoids loading the ACS SDK at startup (previously caused Functions crash).
  const { EmailClient } = await import('@azure/communication-email');
  const client = new EmailClient(connString);

  // Retry up to 4 times with exponential backoff. ACS returns 429 when throttled.
  const delays = [5_000, 15_000, 30_000];
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      await client.beginSend({
        senderAddress: from,
        content: { subject: opts.subject, html: opts.html },
        recipients: { to: [{ address: opts.to }] },
      });
      console.log('[email] ACS accepted send to:', opts.to, '| subject:', opts.subject);
      return;
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 429 && attempt < delays.length) {
        const waitMs = delays[attempt];
        console.warn(`[email] ACS 429 on attempt ${attempt + 1}, retrying in ${waitMs / 1000}s`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      throw err;
    }
  }
}
