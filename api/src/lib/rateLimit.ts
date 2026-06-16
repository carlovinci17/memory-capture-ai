// rateLimit.ts — best-effort per-IP sliding-window limiter to cap abuse/spend
// on the public AI + speech endpoints (Scope §16). In-memory and per-instance
// (not a distributed limiter), which is enough of a guardrail for a demo; a
// durable limiter would live in Redis/Cosmos if this grew.
import type { HttpRequest } from '@azure/functions';

const WINDOW_MS = 60_000;
const buckets = new Map<string, number[]>();

function clientKey(req: HttpRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-azure-clientip') || 'anonymous';
}

/** Returns true if the request is within budget; records the hit when allowed. */
export function allowRequest(req: HttpRequest, maxPerMinute: number): boolean {
  const key = clientKey(req);
  const now = Date.now();
  const recent = (buckets.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= maxPerMinute) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  return true;
}

/** Test helper — clears all buckets. */
export function _resetRateLimit(): void {
  buckets.clear();
}
