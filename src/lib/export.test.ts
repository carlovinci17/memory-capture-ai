import { describe, it, expect } from 'vitest';
import { buildExport } from './export';
import type { StorytellerProfile } from './domain/types';

const profile: StorytellerProfile = {
  id: 'p1',
  name: 'Eleanor Marchetti',
  yearBorn: '1948',
  birthplace: 'Camogli',
  bio: 'Taught Italian for thirty-one years.',
  personaId: 'historian',
  memories: [
    { id: 'm1', title: 'Leaving Camogli', excerpt: 'It was 1967.', era: '1967', palette: ['#000'], createdAt: 1 },
  ],
  sessions: 1,
  createdAt: 1,
};

describe('buildExport', () => {
  it('includes storyteller facts + memories and a timestamp', () => {
    const out = buildExport(profile, new Date('2026-06-15T00:00:00Z'));
    expect(out.exportedAt).toBe('2026-06-15T00:00:00.000Z');
    expect(out.storyteller.name).toBe('Eleanor Marchetti');
    expect(out.storyteller.birthplace).toBe('Camogli');
    expect(out.memories).toHaveLength(1);
    expect(out.memories[0].excerpt).toBe('It was 1967.');
  });

  it('handles a profile with no memories', () => {
    const out = buildExport({ ...profile, memories: [] });
    expect(out.memories).toEqual([]);
  });
});
