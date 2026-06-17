// Vercel serverless function — GET /api/speech/token
// Mints a short-lived Azure AI Speech token so the browser SDK can do
// STT/TTS without the key ever reaching the browser.
// Env vars: AZURE_SPEECH_KEY, AZURE_SPEECH_REGION (set in Vercel dashboard).
const https = require('https');

module.exports = async function handler(req, res) {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;

  if (!key || !region) {
    return res.status(503).json({ error: 'speech_disabled', key: !!key, region: !!region });
  }

  const token = await new Promise((resolve) => {
    const r = https.request(
      {
        hostname: `${region}.api.cognitive.microsoft.com`,
        path: '/sts/v1.0/issueToken',
        method: 'POST',
        headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Length': 0 },
      },
      (response) => {
        let body = '';
        response.on('data', (chunk) => { body += chunk; });
        response.on('end', () => {
          resolve(response.statusCode === 200 ? body : null);
        });
      },
    );
    r.on('error', () => resolve(null));
    r.setTimeout(8000, () => { r.destroy(); resolve(null); });
    r.end();
  });

  if (!token) {
    return res.status(502).json({ error: 'upstream_error', region });
  }

  res.setHeader('Cache-Control', 'private, max-age=480');
  return res.status(200).json({ token, region });
};
