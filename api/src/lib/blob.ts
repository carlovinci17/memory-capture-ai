// blob.ts — upload storyteller photos to Azure Blob Storage and return a URL.
// Keeps large images out of Cosmos documents (which have a 2MB doc limit).
// All uploads are resized to ≤1200px and converted to WebP before storage.
import { BlobServiceClient } from '@azure/storage-blob';
import sharp from 'sharp';

const CONTAINER = 'photos';
const THUMB_PX = 200;
const THUMB_QUALITY = 65;
const FULL_PX = 800;
const FULL_QUALITY = 75;

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

async function resize(input: Buffer, px: number, quality: number): Promise<Buffer> {
  return sharp(input)
    .resize(px, px, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
}

async function upload(container: Awaited<ReturnType<typeof getContainer>>, data: Buffer, name: string): Promise<string> {
  const block = container.getBlockBlobClient(name);
  await block.uploadData(data, { blobHTTPHeaders: { blobContentType: 'image/webp' } });
  return block.url;
}

function parseDataUrl(dataUrl: string): Buffer {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error('Invalid data URL.');
  if (!SUPPORTED_TYPES.has(match[1])) throw new Error('Unsupported image type.');
  const raw = Buffer.from(match[2], 'base64');
  if (raw.byteLength > 5 * 1024 * 1024) throw new Error('Image too large (max 5MB).');
  return raw;
}

/** Upload a profile photo — single 1200px WebP. Returns the public blob URL. */
export async function uploadDataUrl(dataUrl: string, id: string): Promise<string> {
  const raw = parseDataUrl(dataUrl);
  const data = await resize(raw, FULL_PX, FULL_QUALITY);
  const container = await getContainer();
  return upload(container, data, `${id}.webp`);
}

/** Upload a memory illustration — thumbnail (400px) + full (1200px). Returns both URLs. */
export async function uploadDataUrlSizes(
  dataUrl: string,
  id: string,
): Promise<{ url: string; thumbnailUrl: string }> {
  const raw = parseDataUrl(dataUrl);
  const [full, thumb] = await Promise.all([
    resize(raw, FULL_PX, FULL_QUALITY),
    resize(raw, THUMB_PX, THUMB_QUALITY),
  ]);
  const container = await getContainer();
  const [url, thumbnailUrl] = await Promise.all([
    upload(container, full, `${id}.webp`),
    upload(container, thumb, `${id}-thumb.webp`),
  ]);
  return { url, thumbnailUrl };
}
