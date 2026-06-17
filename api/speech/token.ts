// api/speech/token.ts — Vercel serverless function (GET /api/speech/token)
// Mirrors the Azure Function at api/src/functions/speech-token.ts.
// Reads AZURE_SPEECH_KEY and AZURE_SPEECH_REGION from Vercel env vars (server-side only).
export default async function handler(): Promise<Response> {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;

  if (!key || !region) {
    return new Response(JSON.stringify({ error: 'speech_disabled', key: !!key, region: !!region }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 8000);

  try {
    const res = await fetch(
      `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: 'POST',
        headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Length': '0' },
        signal: ac.signal,
      },
    );
    clearTimeout(timer);
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'upstream_error', status: res.status, region }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const token = await res.text();
    return new Response(JSON.stringify({ token, region }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=480',
      },
    });
  } catch (err) {
    clearTimeout(timer);
    return new Response(JSON.stringify({ error: 'upstream_error', detail: String(err), region }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
