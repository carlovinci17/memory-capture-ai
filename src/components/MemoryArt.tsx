// MemoryArt.tsx — renders a memory's AI-generated watercolour image when
// available, falling back to the procedural SVG bloom while the image loads
// or when DALL-E is not configured.
import { WatercolorArt } from './Watercolor';
import type { Memory } from '../lib/domain/types';

interface MemoryArtProps {
  memory: Memory;
  /** Seed for the SVG fallback — keeps it stable across renders. */
  seed?: number;
  /** Use the 400px thumbnail instead of the 1200px full image. For card/list views. */
  thumbnail?: boolean;
}

export function MemoryArt({ memory, seed, thumbnail }: MemoryArtProps) {
  const src = thumbnail
    ? (memory.imageThumbnailUrl ?? memory.imageUrl)
    : (memory.imageUrl ?? memory.imageThumbnailUrl);

  if (src) {
    return (
      <img
        src={src}
        alt=""
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
      />
    );
  }
  const s = seed ?? ((memory.id.length + (memory.era ? memory.era.charCodeAt(0) : 7)));
  return (
    <WatercolorArt
      palette={memory.palette || ['var(--bloom-a)', 'var(--bloom-c)', 'var(--bloom-d)']}
      seed={s}
    />
  );
}
