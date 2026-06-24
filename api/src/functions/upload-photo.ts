// upload-photo.ts — POST /api/uploads/photo
// Accepts a data-URL image, stores it in Blob, returns its public URL. Keeps
// large images out of Cosmos docs (2MB limit) and the browser bundle.
import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { isBlobConfigured, uploadDataUrl } from '../lib/blob';
import { requireApproved } from '../lib/auth';
import { badRequest, json, parseBody, upstreamError, ValidationError } from '../lib/http';

const UploadRequest = z.object({
  dataUrl: z.string().startsWith('data:').max(7_000_000),
});

async function handler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (!isBlobConfigured()) return json(503, { error: 'blob_disabled', message: 'Blob storage not configured.' });
  try {
    const auth = await requireApproved(req);
    if (!('accountId' in auth)) return auth;
    const { accountId } = auth;
    const { dataUrl } = await parseBody(req, UploadRequest);
    const url = await uploadDataUrl(dataUrl, `${accountId}-${randomUUID()}`);
    return json(200, { url });
  } catch (err) {
    if (err instanceof ValidationError) return badRequest(err.message);
    if (err instanceof Error && /Unsupported|Invalid|too large/.test(err.message)) {
      return badRequest(err.message);
    }
    context.error('upload-photo failed', err);
    return upstreamError('Photo upload unavailable.');
  }
}

app.http('upload-photo', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'uploads/photo',
  handler,
});
