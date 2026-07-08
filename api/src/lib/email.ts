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
  // beginSend returns 202 Accepted when ACS queues the email.
  // We do NOT call pollUntilDone() — polling makes repeated GET requests that
  // hit ACS rate limits and throw 429 errors. Delivery status is tracked via
  // EmailSendMailOperational / EmailStatusUpdateOperational in Log Analytics.
  await client.beginSend({
    senderAddress: from,
    content: { subject: opts.subject, html: opts.html },
    recipients: { to: [{ address: opts.to }] },
  });
  console.log('[email] ACS accepted send to:', opts.to, '| subject:', opts.subject);
}
