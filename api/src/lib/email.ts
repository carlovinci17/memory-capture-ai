interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(opts: EmailOptions): Promise<boolean> {
  const connString = process.env.ACS_CONNECTION_STRING;
  const from = process.env.NOTIFY_FROM_EMAIL;
  if (!connString || !from) {
    console.warn('[email] ACS_CONNECTION_STRING or NOTIFY_FROM_EMAIL not set — skipping notification');
    return false;
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
    return true;
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 429) {
      // ACS Azure Managed Domain: 10 sends/hour hard limit. Soft-fail so the
      // caller (sign-up, approval) still completes even when quota is exhausted.
      console.warn('[email] ACS 429 — hourly quota reached, email NOT sent to:', opts.to);
      return false;
    }
    throw err;
  }
}
