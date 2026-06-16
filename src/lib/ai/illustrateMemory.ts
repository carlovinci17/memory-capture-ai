// illustrateMemory.ts — fire-and-forget wrapper for POST /api/memories/illustrate.
// Returns the Azure Blob URL of the generated image, or null on any failure
// (DALL-E not configured, timeout, network error). Never throws.
export async function illustrateMemory(payload: {
  memoryId: string;
  title: string;
  summary?: string;
  theme?: string;
  era?: string;
}): Promise<string | null> {
  try {
    const res = await fetch('/api/memories/illustrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn(`[illustrate] HTTP ${res.status}:`, body);
      return null;
    }
    const data = (await res.json()) as { imageUrl?: string };
    if (!data.imageUrl) console.warn('[illustrate] response missing imageUrl', data);
    return data.imageUrl?.trim() || null;
  } catch (err) {
    console.warn('[illustrate] fetch failed:', err);
    return null;
  }
}
