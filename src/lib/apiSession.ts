// apiSession.ts — mints and caches the anonymous session token required by the
// public AI + speech endpoints (see api/src/lib/sessionToken.ts for why). Guest
// mode has no Google sign-in to key off, so this is a lightweight stand-in:
// call getSessionToken() and attach it as the X-Session-Token header before
// hitting /api/interview/*, /api/memories/illustrate, or /api/speech/token.
// Every one of those callers already treats a non-2xx response as "fall back /
// unavailable", so a failed or missing token degrades the same way any other
// API hiccup does — no special-casing needed at the call sites.
export const SESSION_TOKEN_HEADER = 'x-session-token';

interface CachedToken {
  token: string;
  expires: number;
}

let cache: CachedToken | null = null;
let inFlight: Promise<CachedToken | null> | null = null;

/** Test helper — clears the in-memory token cache. */
export function _resetSessionTokenCache(): void {
  cache = null;
  inFlight = null;
}

async function mint(): Promise<CachedToken | null> {
  try {
    const res = await fetch('/api/session/start', { method: 'POST' });
    if (!res.ok) return null;
    const data = (await res.json()) as { token?: string; expiresAt?: number };
    if (!data.token || !data.expiresAt) return null;
    // Refresh a bit early so a call never starts on a token about to expire.
    return { token: data.token, expires: data.expiresAt - 5 * 60 * 1000 };
  } catch {
    return null;
  }
}

/** Returns a valid session token, minting/caching one as needed, or null if unavailable. */
export async function getSessionToken(): Promise<string | null> {
  if (cache && Date.now() < cache.expires) return cache.token;
  if (!inFlight) {
    inFlight = mint().finally(() => {
      inFlight = null;
    });
  }
  cache = await inFlight;
  return cache?.token ?? null;
}

/** Builds fetch headers with the session token attached, if one is available. */
export async function withSessionHeader(headers: Record<string, string> = {}): Promise<Record<string, string>> {
  const token = await getSessionToken();
  return token ? { ...headers, [SESSION_TOKEN_HEADER]: token } : headers;
}
