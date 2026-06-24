import { createHmac, timingSafeEqual } from 'node:crypto';

function getSecret(): string {
  const s = process.env.ADMIN_APPROVE_SECRET;
  if (!s) throw new Error('ADMIN_APPROVE_SECRET is not configured.');
  return s;
}

export function generateToken(userId: string): string {
  return createHmac('sha256', getSecret()).update(userId).digest('hex');
}

export function verifyToken(userId: string, token: string): boolean {
  try {
    const expected = Buffer.from(generateToken(userId), 'hex');
    const actual = Buffer.from(token, 'hex');
    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
