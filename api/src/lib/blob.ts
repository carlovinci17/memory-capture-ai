// blob.ts — upload storyteller photos to Azure Blob Storage and return a URL.
// Keeps large images out of Cosmos documents (which have a 2MB doc limit).
// All uploads are resized to ≤1200px and converted to WebP before storage.
import { BlobServiceClient } from '@azure/storage-blob';
import sharp from 'sharp';

const CONTAINER = 'photos';
const MAX_PX = 1200;
const WEBP_QUALITY = 85;

const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

let containerReady: Promise<ReturnType<BlobServiceClient['getContainerClient']>> | null = null;

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_CONNECTION_STRING);
}

async function getContainer() {
  if (containerReady) return containerReady;
  const conn = process.env.BLOB_CONNECTION_STRING;
  if (!conn) throw new Error('Blob storage is not configured.');
  containerReady = (async () => {
    const service = BlobServiceClient.fromConnectionString(conn);
    const client = service.getContainerClient(CONTAINER);
    await client.createIfNotExists({ access: 'blob' });
    return client;
  })();
  return containerReady;
}

async function compress(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .resize(MAX_PX, MAX_PX, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

/**
 * Upload a data-URL image and return its public blob URL.
 * Images are resized to ≤1200px and converted to WebP before storage.
 * `id` seeds a stable-ish, collision-resistant blob name.
 */
export async function uploadDataUrl(dataUrl: string, id: string): Promise<string> {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error('Invalid data URL.');
  const contentType = match[1];
  if (!SUPPORTED_TYPES.has(contentType)) throw new Error('Unsupported image type.');
  const raw = Buffer.from(match[2], 'base64');
  if (raw.byteLength > 5 * 1024 * 1024) throw new Error('Image too large (max 5MB).');

  const data = await compress(raw);
  const container = await getContainer();
  const blobName = `${id}-${data.byteLength.toString(36)}.webp`;
  const block = container.getBlockBlobClient(blobName);
  await block.uploadData(data, { blobHTTPHeaders: { blobContentType: 'image/webp' } });
  return block.url;
}
