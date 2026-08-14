// illustrateMemory.ts — fire-and-forget wrapper for POST /api/memories/illustrate.
// Returns both image URLs on success, or null on any failure (DALL-E not configured,
// timeout, network error). Never throws.
import { withSessionHeader } from '../apiSession';

export interface IllustrationResult {
  imageUrl: string;
  imageThumbnailUrl: string;
}

export async function illustrateMemory(payload: {
  memoryId: string;
  title: string;
  summary?: string;
  theme?: string;
  era?: string;
}): Promise<IllustrationResult | null> {
  try {
    const res = await fetch('/api/memories/illustrate', {
      method: 'POST',
      headers: await withSessionHeader({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn(`[illustrate] HTTP ${res.status}:`, body);
      return null;
    }
    const data = (await res.json()) as { imageUrl?: string; imageThumbnailUrl?: string };
    if (!data.imageUrl || !data.imageThumbnailUrl) {
      console.warn('[illustrate] response missing image URLs', data);
      return null;
    }
    return { imageUrl: data.imageUrl.trim(), imageThumbnailUrl: data.imageThumbnailUrl.trim() };
  } catch (err) {
    console.warn('[illustrate] fetch failed:', err);
    return null;
  }
}
