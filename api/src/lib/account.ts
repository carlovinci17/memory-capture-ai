import type { HttpRequest } from '@azure/functions';

export interface ClientPrincipal {
  userId: string;
  userDetails?: string;   // email for Google
  identityProvider?: string;
  name?: string;          // display name from Google claims
}

interface RawPrincipal {
  userId?: string;
  userDetails?: string;
  identityProvider?: string;
  claims?: Array<{ typ: string; val: string }>;
}

export function getPrincipal(req: HttpRequest): ClientPrincipal | null {
  const header = req.headers.get('x-ms-client-principal');
  if (!header) return null;
  try {
    const raw = JSON.parse(Buffer.from(header, 'base64').toString('utf8')) as RawPrincipal;
    if (!raw.userId) return null;
    const name = raw.claims?.find((c) => c.typ === 'name')?.val;
    return { userId: raw.userId, userDetails: raw.userDetails, identityProvider: raw.identityProvider, name };
  } catch {
    return null;
  }
}

export function getAccountId(req: HttpRequest): string | null {
  return getPrincipal(req)?.userId ?? null;
}
