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

// Email 1a — admin notification with approve/reject buttons
async function notifyAdmin(user: UserDoc): Promise<void> {
  const to = process.env.NOTIFY_EMAIL;
  if (!to) return;
  const appUrl = (process.env.APP_URL ?? '').replace(/\/$/, '');
  const approveUrl = `${appUrl}/api/users/review?userId=${encodeURIComponent(user.id)}&action=approve&token=${generateToken(user.id, 'approve')}`;
  const rejectUrl  = `${appUrl}/api/users/review?userId=${encodeURIComponent(user.id)}&action=reject&token=${generateToken(user.id, 'reject')}`;
  await sendEmail({
    to,
    subject: `New sign-up awaiting approval: ${user.name ?? user.email}`,
    html: `
<p style="font-family:sans-serif">A new user signed up for Memory Capture AI and is awaiting your approval.</p>
<table style="font-family:sans-serif;border-collapse:collapse;margin:12px 0">
  <tr><td style="padding:4px 12px 4px 0;font-weight:600">Name</td><td>${esc(user.name ?? '—')}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:600">Email</td><td>${esc(user.email)}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:600">Signed up</td><td>${user.createdAt}</td></tr>
</table>
<p style="font-family:sans-serif">
  <a href="${approveUrl}" style="display:inline-block;padding:10px 24px;background:#2a7c3f;color:#fff;text-decoration:none;border-radius:999px;font-weight:600;font-size:15px;margin-right:12px">Approve</a>
  <a href="${rejectUrl}"  style="display:inline-block;padding:10px 24px;background:#c0392b;color:#fff;text-decoration:none;border-radius:999px;font-weight:600;font-size:15px">Reject</a>
</p>
<p style="font-family:sans-serif;color:#888;font-size:13px">Each button can only be used once per user.</p>`,
  });
}

// Email 1b — user pending confirmation
async function notifyUserPending(user: UserDoc): Promise<void> {
  await sendEmail({
    to: user.email,
    subject: 'Memory Capture AI — your request is pending approval',
    html: `
<p style="font-family:sans-serif">Hi${user.name ? ` ${esc(user.name)}` : ''}!</p>
<p style="font-family:sans-serif">Thanks for signing up for Memory Capture AI. Your request has been received and is awaiting approval.</p>
<p style="font-family:sans-serif">We'll send you an email once it's been reviewed — usually within 24 hours.</p>
<p style="font-family:sans-serif;color:#888;font-size:13px">If you didn't sign up for this service, you can safely ignore this email.</p>`,
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

  // Send both notifications concurrently; soft-fail independently
  await Promise.all([
    notifyAdmin(user).catch((e) => console.error('[users] admin notification failed', e)),
    notifyUserPending(user).catch((e) => console.error('[users] pending notification failed', e)),
  ]);

  return 'pending';
}

// Email 3a — user approved
export async function notifyUser(user: UserDoc): Promise<boolean> {
  const appUrl = process.env.APP_URL ?? '';
  const signInUrl = `${appUrl}/.auth/login/google?post_login_redirect_uri=${encodeURIComponent('/home?mcap_setup=1')}`;
  return sendEmail({
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

// Email 3b — user rejected
export async function notifyUserRejected(user: UserDoc): Promise<boolean> {
  return sendEmail({
    to: user.email,
    subject: 'Memory Capture AI — your access request',
    html: `
<p style="font-family:sans-serif">Hi${user.name ? ` ${esc(user.name)}` : ''},</p>
<p style="font-family:sans-serif">Thank you for your interest in Memory Capture AI. Unfortunately we're unable to approve your account at this time.</p>
<p style="font-family:sans-serif;color:#888;font-size:13px">If you think this is a mistake, please reply to this email.</p>`,
  });
}

export async function reapplyUser(userId: string): Promise<boolean> {
  const container = await getUsersContainer();
  let user: UserDoc;
  try {
    const { resource } = await container.item(userId, userId).read<UserDoc>();
    if (!resource || resource.status !== 'denied') return false;
    user = { ...resource, status: 'pending' };
    delete user.approvedAt;
    await container.item(userId, userId).replace<UserDoc>(user);
  } catch (err) {
    if (Number((err as { code?: number | string }).code) === 404) return false;
    throw err;
  }
  await Promise.all([
    notifyAdmin(user).catch((e) => console.error('[users] admin re-apply notification failed', e)),
    notifyUserPending(user).catch((e) => console.error('[users] pending re-apply notification failed', e)),
  ]);
  return true;
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
  const notify = status === 'approved' ? notifyUser(resource) : notifyUserRejected(resource);
  await notify
    .then((sent) => { if (!sent) console.warn(`[users] ${status} notification NOT sent — ACS quota exhausted`); })
    .catch((e) => console.error(`[users] ${status} notification failed`, e));
}
