// illustrate.ts — POST /api/memories/illustrate
// Generates a watercolour square image for a captured memory via gpt-image-1,
// uploads it to Azure Blob, and returns the permanent public URL.
// Returns 503 when the image model is not configured so the SVG fallback stays silently.
import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { z } from 'zod';
import { getImageDeployment, getImageClient, isImageConfigured } from '../lib/imageClient';
import { isBlobConfigured, uploadDataUrl } from '../lib/blob';
import { badRequest, json, parseBody, upstreamError, ValidationError } from '../lib/http';

const IllustrateRequest = z.object({
  memoryId: z.string().min(1).max(64),
  title: z.string().min(1).max(200),
  summary: z.string().max(500).optional(),
  theme: z.string().max(80).optional(),
  era: z.string().max(40).optional(),
});

function buildPrompt(
  title: string,
  summary?: string,
  theme?: string,
  era?: string,
): string {
  const detail = summary ? summary.slice(0, 120) : title;
  const context = [era, theme].filter(Boolean).join(', ');
  return (
    `A small square watercolour illustration titled "${title}". ` +
    `${detail}` +
    (context ? ` (${context})` : '') +
    `. Soft paint washes, warm muted tones, aged paper texture, impressionistic style. ` +
    `No text, no labels, no borders, generous white margins. Square composition.`
  );
}

async function handler(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  if (!isImageConfigured()) {
    return json(503, { error: 'image_disabled', message: 'Image generation not configured.' });
  }
  if (!isBlobConfigured()) {
    return json(503, { error: 'blob_disabled', message: 'Blob storage not configured.' });
  }

  let body: z.infer<typeof IllustrateRequest>;
  try {
    body = await parseBody(req, IllustrateRequest);
  } catch (err) {
    if (err instanceof ValidationError) return badRequest(err.message);
    return badRequest('Invalid request body.');
  }

  const { memoryId, title, summary, theme, era } = body;
  const prompt = buildPrompt(title, summary, theme, era);

  try {
    const client = getImageClient();
    const deployment = getImageDeployment();

    const response = await client.images.generate(
      {
        model: deployment,
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'medium', // 'low' | 'medium' | 'high' for gpt-image-1
      },
      { signal: AbortSignal.timeout(85_000) }, // gpt-image-1-mini can be slow — keep under client 90s
    );

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      ctx.error('illustrate: gpt-image-1 returned no image data');
      return upstreamError('Image generation returned no data.');
    }

    const dataUrl = `data:image/png;base64,${b64}`;
    const imageUrl = await uploadDataUrl(dataUrl, `memory-${memoryId}`);
    return json(200, { imageUrl });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    ctx.error('illustrate failed', err);
    return upstreamError(`Image generation unavailable: ${detail}`);
  }
}

app.http('illustrate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'memories/illustrate',
  handler,
});
