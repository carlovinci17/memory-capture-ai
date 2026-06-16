// speech-token.ts — GET /api/speech/token
// Mints a short-lived Azure AI Speech authorization token so the browser Speech
// SDK can do STT/TTS without ever seeing the Speech key. Tokens last ~10 min;
// the client refreshes before expiry. Returns 503 when Speech isn't configured
// (the UI then hides voice and falls back to typing).
import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { json, timeoutSignal, tooManyRequests } from '../lib/http';
import { allowRequest } from '../lib/rateLimit';

async function handler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (!allowRequest(req, 20)) return tooManyRequests();
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) {
    return json(503, { error: 'speech_disabled', message: 'Speech is not configured.' });
  }

  try {
    const res = await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Length': '0' },
      signal: timeoutSignal(),
    });
    if (!res.ok) {
      context.error(`issueToken failed: ${res.status}`);
      return json(502, { error: 'upstream_error', message: 'Could not mint Speech token.' });
    }
    const token = await res.text();
    // Cache for slightly less than the ~10-minute token lifetime.
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=480' },
      body: JSON.stringify({ token, region }),
    };
  } catch (err) {
    context.error('speech-token failed', err);
    return json(502, { error: 'upstream_error', message: 'Could not mint Speech token.' });
  }
}

app.http('speech-token', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'speech/token',
  handler,
});
