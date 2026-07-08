import { getUsersContainer } from './cosmos';
import { sendEmail } from './email';
import { generateToken } from './tokens';

export interface UserDoc {
  id: string;
  email: string;
  name?: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
  approvedAt?: string;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function notifyAdmin(user: UserDoc): Promise<void> {
  const to = process.env.NOTIFY_EMAIL;
  if (!to) return;
  const appUrl = (process.env.APP_URL ?? '').replace(/\/$/, '');
  const token = generateToken(user.id);
  const notifyUrl = `${appUrl}/api/users/notify-approved?userId=${encodeURIComponent(user.id)}&token=${token}`;
  await sendEmail({
    to,
    subject: `New sign-up: ${user.name ?? user.email}`,
    html: `
<p style="font-family:sans-serif">A new user signed up for Memory Capture AI and is awaiting approval.</p>
<table style="font-family:sans-serif;border-collapse:collapse;margin:12px 0">
  <tr><td style="padding:4px 12px 4px 0;font-weight:600">Name</td><td>${esc(user.name ?? '—')}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:600">Email</td><td>${esc(user.email)}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:600">Signed up</td><td>${user.createdAt}</td></tr>
</table>
<p style="font-family:sans-serif;color:#555;font-size:14px">Approve the user in Cosmos DB, then click below to send them their welcome email.</p>
<p style="font-family:sans-serif">
  <a href="${notifyUrl}" style="display:inline-block;padding:10px 24px;background:#c0602a;color:#fff;text-decoration:none;border-radius:999px;font-weight:600;font-size:15px">Send welcome email to user</a>
</p>`,
  });
}

export async function getUserDoc(userId: string): Promise<UserDoc | undefined> {
  const container = await getUsersContainer();
  try {
    const { resource } = await container.item(userId, userId).read<UserDoc>();
    return resource;
  } catch (err) {
    if (Number((err as { code?: number | string }).code) === 404) return undefined;
    throw err;
  }
}

export async function checkApproval(userId: string, email: string, name?: string): Promise<UserDoc['status']> {
  // Admin email bypasses the queue — no Cosmos write, no notification.
  const adminEmail = (process.env.NOTIFY_EMAIL ?? '').toLowerCase();
  if (adminEmail && email.toLowerCase() === adminEmail) return 'approved';

  const container = await getUsersContainer();
  try {
    const { resource } = await container.item(userId, userId).read<UserDoc>();
    if (resource) return resource.status;
  } catch (err) {
    if (Number((err as { code?: number | string }).code) !== 404) throw err;
  }
  const user: UserDoc = { id: userId, email, name, status: 'pending', createdAt: new Date().toISOString() };
  await container.items.create(user);
  await notifyAdmin(user).catch((e) => console.error('[users] notification failed', e));
  return 'pending';
}

export async function notifyUser(user: UserDoc): Promise<void> {
  const appUrl = process.env.APP_URL ?? '';
  const signInUrl = `${appUrl}/.auth/login/google?post_login_redirect_uri=${encodeURIComponent('/home?mcap_setup=1')}`;
  await sendEmail({
    to: user.email,
    subject: "You're approved — welcome to Memory Capture AI",
    html: `
<p style="font-family:sans-serif">Good news${user.name ? `, ${esc(user.name)}` : ''}! Your Memory Capture AI account has been approved.</p>
<p style="font-family:sans-serif">
  <a href="${signInUrl}" style="display:inline-block;padding:10px 24px;background:#c0602a;color:#fff;text-decoration:none;border-radius:999px;font-weight:600;font-size:15px">
    Sign in to get started
  </a>
</p>
<p style="font-family:sans-serif;color:#888;font-size:13px">If the button doesn't work, paste this link into your browser:<br>${signInUrl}</p>`,
  });
}

export async function updateUserStatus(userId: string, status: 'approved' | 'denied'): Promise<void> {
  const container = await getUsersContainer();
  const { resource } = await container.item(userId, userId).read<UserDoc>();
  if (!resource) throw new Error(`User ${userId} not found.`);
  await container.item(userId, userId).replace<UserDoc>({
    ...resource,
    status,
    ...(status === 'approved' ? { approvedAt: new Date().toISOString() } : {}),
  });
  if (status === 'approved') {
    await notifyUser(resource).catch((e) => console.error('[users] approval notification failed', e));
  }
}
