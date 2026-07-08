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

  try {
    await client.beginSend({
      senderAddress: from,
      content: { subject: opts.subject, html: opts.html },
      recipients: { to: [{ address: opts.to }] },
    });
    console.log('[email] ACS accepted send to:', opts.to, '| subject:', opts.subject);
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 429) {
      // ACS Azure Managed Domain has a low hourly send quota — 429 during heavy
      // testing is expected. In production (few emails/day) this will not trigger.
      console.warn('[email] ACS 429 — hourly send quota reached. Email not sent to:', opts.to);
      return; // Soft-fail: don't crash the caller, log and move on.
    }
    throw err;
  }
}
