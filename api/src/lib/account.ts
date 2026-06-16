// account.ts — resolve the authenticated account for a request.
// Azure Static Web Apps injects `x-ms-client-principal` (base64 JSON) for
// signed-in users. Data endpoints require it (401 otherwise); rows are
// partitioned by this id so one owner can never see another's stories.
import type { HttpRequest } from '@azure/functions';

export interface ClientPrincipal {
  userId: string;
  userDetails?: string;
  identityProvider?: string;
}

/** Parse the SWA principal, or null when the caller is anonymous. */
export function getPrincipal(req: HttpRequest): ClientPrincipal | null {
  const header = req.headers.get('x-ms-client-principal');
  if (!header) return null;
  try {
    const p = JSON.parse(Buffer.from(header, 'base64').toString('utf8')) as Partial<ClientPrincipal>;
    return p.userId ? { userId: p.userId, userDetails: p.userDetails, identityProvider: p.identityProvider } : null;
  } catch {
    return null;
  }
}

/** The owning account id, or null when not authenticated. */
export function getAccountId(req: HttpRequest): string | null {
  return getPrincipal(req)?.userId ?? null;
}
