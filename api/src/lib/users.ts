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
  const base = (process.env.APP_URL ?? 'https://memory-capture-ai.carlovinci.com.au').replace(/\/$/, '');
  const token = generateToken(user.id);
  const q = `userId=${encodeURIComponent(user.id)}&token=${token}`;
  const approveUrl = `${base}/api/admin/approve?${q}&action=approve`;
  const denyUrl = `${base}/api/admin/approve?${q}&action=deny`;
  const btnStyle = 'display:inline-block;padding:10px 22px;border-radius:6px;text-decoration:none;font-weight:600;color:#fff';
  await sendEmail({
    to,
    subject: `New sign-up: ${user.name ?? user.email}`,
    html: `
<p style="font-family:sans-serif">A new user signed up for Memory Capture AI and is awaiting your approval.</p>
<table style="font-family:sans-serif;border-collapse:collapse;margin:12px 0">
  <tr><td style="padding:4px 12px 4px 0;font-weight:600">Name</td><td>${esc(user.name ?? '—')}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:600">Email</td><td>${esc(user.email)}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:600">Signed up</td><td>${user.createdAt}</td></tr>
</table>
<p>
  <a href="${approveUrl}" style="${btnStyle};background:#16a34a;margin-right:10px">✓ Approve</a>
  <a href="${denyUrl}" style="${btnStyle};background:#dc2626">✗ Deny</a>
</p>
<p style="font-family:sans-serif;font-size:12px;color:#888">These links use a signed token. Rotate ADMIN_APPROVE_SECRET to invalidate all outstanding links.</p>`,
  });
}

export async function checkApproval(userId: string, email: string, name?: string): Promise<UserDoc['status']> {
  const container = await getUsersContainer();
  try {
    const { resource } = await container.item(userId, userId).read<UserDoc>();
    if (resource) return resource.status;
  } catch (err) {
    if ((err as { code?: number }).code !== 404) throw err;
  }
  const user: UserDoc = { id: userId, email, name, status: 'pending', createdAt: new Date().toISOString() };
  await container.items.create(user);
  notifyAdmin(user).catch((e) => console.error('[users] notification failed', e));
  return 'pending';
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
}
