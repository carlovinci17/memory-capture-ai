// sessionToken.ts — lightweight, anonymous proof-of-session for the public AI +
// speech endpoints. Guest/demo mode intentionally allows unauthenticated use of
// the AI interview (no Google sign-in required — see README "Try for free"), so
// these endpoints can't be gated behind requireApproved(). Instead, the client
// mints a short-lived token via POST /api/session/start before its first AI
// call; the six AI/speech endpoints require it. This isn't a hard stop against
// a determined scripted caller (session/start is itself just another public
// endpoint), but it closes off casual/direct abuse of the billed endpoints and
// gives us one narrow choke point to harden further later if needed.
import type { HttpRequest, HttpResponseInit } from '@azure/functions';
import { json, tooManyRequests } from './http';
import { allowRequest } from './rateLimit';
import { sign, verifySignature } from './tokens';

export const SESSION_TOKEN_HEADER = 'x-session-token';
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours — comfortably covers one sitting

function getSecret(): string {
  const s = process.env.SESSION_TOKEN_SECRET;
  if (!s) throw new Error('SESSION_TOKEN_SECRET is not configured.');
  return s;
}

export function isSessionTokenConfigured(): boolean {
  return Boolean(process.env.SESSION_TOKEN_SECRET);
}

export function mintSessionToken(): { token: string; expiresAt: number } {
  const issuedAt = Date.now();
  return { token: `${issuedAt}.${sign(getSecret(), `session:${issuedAt}`)}`, expiresAt: issuedAt + TTL_MS };
}

function verify(token: string): boolean {
  const dot = token.indexOf('.');
  if (dot < 0) return false;
  const issuedAt = Number(token.slice(0, dot));
  if (!Number.isFinite(issuedAt)) return false;
  const now = Date.now();
  if (now - issuedAt > TTL_MS || issuedAt > now) return false;
  return verifySignature(getSecret(), `session:${issuedAt}`, token.slice(dot + 1));
}

/** Returns true when the request carries a valid session token, else a 401 to return directly. */
export function requireSessionToken(req: HttpRequest): true | HttpResponseInit {
  const token = req.headers.get(SESSION_TOKEN_HEADER);
  if (!token || !verify(token)) {
    return json(401, { error: 'session_required', message: 'Start a session first.' });
  }
  return true;
}

/** Combined guard for the public AI/speech endpoints: rate limit, then session token. */
export function requireSession(req: HttpRequest, maxPerMinute: number): true | HttpResponseInit {
  if (!allowRequest(req, maxPerMinute)) return tooManyRequests();
  return requireSessionToken(req);
}
