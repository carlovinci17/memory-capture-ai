import { createHmac, timingSafeEqual } from 'node:crypto';

/** Generic HMAC-SHA256 sign/verify — shared by the admin-approve tokens below and sessionToken.ts. */
export function sign(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifySignature(secret: string, payload: string, token: string): boolean {
  try {
    const expected = Buffer.from(sign(secret, payload), 'hex');
    const actual = Buffer.from(token, 'hex');
    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function getSecret(): string {
  const s = process.env.ADMIN_APPROVE_SECRET;
  if (!s) throw new Error('ADMIN_APPROVE_SECRET is not configured.');
  return s;
}

export function generateToken(userId: string, action: string = ''): string {
  const payload = action ? `${userId}:${action}` : userId;
  return sign(getSecret(), payload);
}

export function verifyToken(userId: string, token: string, action: string = ''): boolean {
  const payload = action ? `${userId}:${action}` : userId;
  return verifySignature(getSecret(), payload, token);
}
