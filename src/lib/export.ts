// export.ts — data portability: download a storyteller's memories as JSON
// (Scope §12). Pure client-side; works in both guest and cloud modes.
import type { StorytellerProfile } from './domain/types';

function slug(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'storyteller'
  );
}

export interface MemoryExport {
  exportedAt: string;
  storyteller: {
    name: string;
    yearBorn?: string;
    birthplace?: string;
    bio?: string;
  };
  memories: StorytellerProfile['memories'];
}

/** Build the export payload (separated for testing). */
export function buildExport(profile: StorytellerProfile, now: Date = new Date()): MemoryExport {
  return {
    exportedAt: now.toISOString(),
    storyteller: {
      name: profile.name,
      yearBorn: profile.yearBorn,
      birthplace: profile.birthplace,
      bio: profile.bio,
    },
    memories: profile.memories ?? [],
  };
}

/** Trigger a browser download of the storyteller's memories as JSON. */
export function exportProfileJson(profile: StorytellerProfile, now: Date = new Date()): void {
  const blob = new Blob([JSON.stringify(buildExport(profile, now), null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug(profile.name)}-memories.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
