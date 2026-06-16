import { describe, it, expect, beforeEach } from 'vitest';
import { LocalProfileRepository } from './localRepository';
import type { NewProfile } from './repository';

const base: NewProfile = {
  name: 'Eleanor Marchetti',
  yearBorn: '1948',
  birthplace: 'Camogli, Italy',
  bio: '',
  photo: null,
  personaId: 'historian',
  memories: [],
  sessions: 0,
  createdAt: 1_000_000,
};

describe('LocalProfileRepository', () => {
  let repo: LocalProfileRepository;
  beforeEach(() => {
    localStorage.clear();
    repo = new LocalProfileRepository();
  });

  it('starts empty', async () => {
    const store = await repo.load();
    expect(store.profiles).toHaveLength(0);
    expect(store.activeId).toBeNull();
  });

  it('creates a profile and sets it active', async () => {
    const created = await repo.create(base);
    expect(created.id).toBeTruthy();
    const store = await repo.load();
    expect(store.profiles).toHaveLength(1);
    expect(store.activeId).toBe(created.id);
  });

  it('updates an existing profile', async () => {
    const created = await repo.create(base);
    await repo.update(created.id, { ...created, name: 'Nonna Eleanor' });
    const store = await repo.load();
    expect(store.profiles[0].name).toBe('Nonna Eleanor');
  });

  it('removes a profile and falls back to the next active id', async () => {
    const a = await repo.create(base);
    const b = await repo.create({ ...base, name: 'Thomas Hale' });
    const next = await repo.remove(b.id);
    expect(next).toBe(a.id);
    const store = await repo.load();
    expect(store.profiles).toHaveLength(1);
  });

  it('migrates a legacy single-profile key', async () => {
    localStorage.setItem(
      'mcap_mvp_profile_v1',
      JSON.stringify({ id: 'legacy1', name: 'Legacy Person', personaId: 'grandchild' }),
    );
    const store = await repo.load();
    expect(store.profiles).toHaveLength(1);
    expect(store.profiles[0].name).toBe('Legacy Person');
    expect(store.activeId).toBe('legacy1');
  });
});
