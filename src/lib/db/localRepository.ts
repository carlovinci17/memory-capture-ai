// localRepository.ts — localStorage-backed ProfileRepository.
// Mirrors the prototype's persistence (key `mcap_mvp_store_v1`, with legacy
// single-profile migration from `mcap_mvp_profile_v1`).
import { StoreSchema, type Store, type StorytellerProfile } from '../domain/types';
import { PERSONAS } from '../domain/personas';
import type { NewProfile, ProfileRepository } from './repository';

const STORE_KEY = 'mcap_mvp_store_v1';
const LEGACY_KEY = 'mcap_mvp_profile_v1';

const EMPTY_STORE: Store = { profiles: [], activeId: null };

function newId(): string {
  return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function readRaw(): Store {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    const result = StoreSchema.safeParse(parsed);
    if (result.success) return result.data;
  } catch {
    // fall through to legacy migration
  }
  // Migrate a single legacy profile if present.
  try {
    const old = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
    if (old && old.name) {
      const id = old.id || newId();
      const migrated: Store = {
        profiles: [
          {
            id,
            name: old.name,
            yearBorn: old.yearBorn,
            birthplace: old.birthplace,
            bio: old.bio,
            photo: old.photo ?? null,
            personaId: old.personaId || PERSONAS[0].id,
            memories: old.memories || [],
            sessions: old.sessions || 0,
            createdAt: old.createdAt || Date.now(),
          },
        ],
        activeId: id,
      };
      const result = StoreSchema.safeParse(migrated);
      if (result.success) return result.data;
    }
  } catch {
    // ignore
  }
  return EMPTY_STORE;
}

function writeRaw(store: Store): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // storage may be unavailable (private mode / quota) — fail soft.
  }
}

/** Write an entire Store directly — used to seed demo data on first visit. */
export function seedLocalStore(store: Store): void {
  writeRaw(store);
}

export class LocalProfileRepository implements ProfileRepository {
  async load(): Promise<Store> {
    return readRaw();
  }

  async create(profile: NewProfile): Promise<StorytellerProfile> {
    const store = readRaw();
    const created: StorytellerProfile = { ...profile, id: newId() };
    writeRaw({ profiles: [...store.profiles, created], activeId: created.id });
    return created;
  }

  async update(id: string, profile: StorytellerProfile): Promise<StorytellerProfile> {
    const store = readRaw();
    const updated: StorytellerProfile = { ...profile, id };
    writeRaw({
      ...store,
      profiles: store.profiles.map((p) => (p.id === id ? updated : p)),
    });
    return updated;
  }

  async remove(id: string): Promise<string | null> {
    const store = readRaw();
    const remaining = store.profiles.filter((p) => p.id !== id);
    const activeId = remaining.length ? remaining[0].id : null;
    writeRaw({ profiles: remaining, activeId });
    return activeId;
  }

  async setActive(id: string): Promise<void> {
    const store = readRaw();
    writeRaw({ ...store, activeId: id });
  }
}
