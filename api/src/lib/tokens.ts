import { createHmac, timingSafeEqual } from 'node:crypto';

function getSecret(): string {
  const s = process.env.ADMIN_APPROVE_SECRET;
  if (!s) throw new Error('ADMIN_APPROVE_SECRET is not configured.');
  return s;
}

export function generateToken(userId: string, action: string = ''): string {
  const payload = action ? `${userId}:${action}` : userId;
  return createHmac('sha256', getSecret()).update(payload).digest('hex');
}

export function verifyToken(userId: string, token: string, action: string = ''): boolean {
  try {
    const expected = Buffer.from(generateToken(userId, action), 'hex');
    const actual = Buffer.from(token, 'hex');
    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
