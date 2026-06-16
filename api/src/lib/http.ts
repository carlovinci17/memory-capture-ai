// http.ts — shared helpers for the Functions: body parsing, validation,
// uniform error envelopes, and a per-call timeout signal.
import type { HttpRequest, HttpResponseInit } from '@azure/functions';
import type { z } from 'zod';

export const REQUEST_TIMEOUT_MS = 12_000;

export function timeoutSignal(ms = REQUEST_TIMEOUT_MS): AbortSignal {
  return AbortSignal.timeout(ms);
}

export function json(status: number, body: unknown): HttpResponseInit {
  return {
    status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export function badRequest(message: string): HttpResponseInit {
  return json(400, { error: 'invalid_request', message });
}

export function upstreamError(message = 'AI service unavailable'): HttpResponseInit {
  // 502 signals the client to fall back to its offline engine.
  return json(502, { error: 'upstream_error', message });
}

export function tooManyRequests(message = 'Too many requests — please slow down.'): HttpResponseInit {
  return json(429, { error: 'rate_limited', message });
}

/** Parse + validate the JSON body against a Zod schema. Throws a tagged error on failure. */
export async function parseBody<S extends z.ZodTypeAny>(
  req: HttpRequest,
  schema: S,
): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ValidationError('Body must be valid JSON.');
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ValidationError(result.error.issues.map((i) => i.message).join('; '));
  }
  return result.data;
}

export class ValidationError extends Error {}
