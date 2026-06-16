// blob.ts — upload storyteller photos to Azure Blob Storage and return a URL.
// Keeps large images out of Cosmos documents (which have a 2MB doc limit).
import { BlobServiceClient } from '@azure/storage-blob';

const CONTAINER = 'photos';

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

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/**
 * Upload a data-URL image and return its public blob URL.
 * `id` seeds a stable-ish, collision-resistant blob name.
 */
export async function uploadDataUrl(dataUrl: string, id: string): Promise<string> {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error('Invalid data URL.');
  const contentType = match[1];
  const ext = EXT[contentType];
  if (!ext) throw new Error('Unsupported image type.');
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.byteLength > 5 * 1024 * 1024) throw new Error('Image too large (max 5MB).');

  const container = await getContainer();
  const blobName = `${id}-${buffer.byteLength.toString(36)}.${ext}`;
  const block = container.getBlockBlobClient(blobName);
  await block.uploadData(buffer, { blobHTTPHeaders: { blobContentType: contentType } });
  return block.url;
}
