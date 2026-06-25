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
  const poller = await client.beginSend({
    senderAddress: from,
    content: { subject: opts.subject, html: opts.html },
    recipients: { to: [{ address: opts.to }] },
  });
  await poller.pollUntilDone();
}
