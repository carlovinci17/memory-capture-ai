// StoreProvider.tsx — app-wide storyteller state, backed by the repository.
// Screens read the active profile and call mutators; persistence is abstracted.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getRepository, type NewProfile } from '../db';
import { seedLocalStore } from '../db/localRepository';
import { getFullDemoStore } from '../demo/demoData';
import type { Memory, SessionResult, Store, StorytellerProfile } from '../domain/types';

interface StoreContextValue {
  ready: boolean;
  profiles: StorytellerProfile[];
  activeId: string | null;
  activeProfile: StorytellerProfile | null;
  createProfile(profile: NewProfile): Promise<StorytellerProfile>;
  updateProfile(id: string, profile: StorytellerProfile): Promise<void>;
  deleteProfile(id: string): Promise<string | null>;
  switchProfile(id: string): Promise<void>;
  changePersona(id: string, personaId: StorytellerProfile['personaId']): Promise<void>;
  finishSession(id: string, result: SessionResult): Promise<void>;
  /** Remove one memory from a profile. */
  deleteMemory(profileId: string, memoryId: string): Promise<void>;
  /** Patch fields on one memory (e.g. add a year the user typed in). */
  updateMemory(profileId: string, memoryId: string, patch: Partial<Memory>): Promise<void>;
  /** Delete every storyteller (and their memories) for a fresh start. */
  resetAll(): Promise<void>;
  /** Seed the demo store combined with the given user profile — for first demo visit. */
  initDemoStore(userProfile: StorytellerProfile): void;
  /** Load demo profiles without creating a user profile — skip onboarding. */
  skipToDemo(): void;
  /** Set when the initial load failed — contains the error message, null when ok. */
  loadError: string | null;
  /** Retry the initial load. */
  reload(): void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const EMPTY: Store = { profiles: [], activeId: null };

export function StoreProvider({ children }: { children: ReactNode }) {
  const repo = useMemo(() => getRepository(), []);
  const [store, setStore] = useState<Store>(EMPTY);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setReady(false);
    setLoadError(null);
    repo
      .load()
      .then((s) => {
        if (!alive) return;
        setStore(s);
        setReady(true);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        console.error('[StoreProvider] load failed:', err);
        const msg = err instanceof Error ? err.message : String(err);
        setLoadError(msg);
        setReady(true);
      });
    return () => {
      alive = false;
    };
  }, [repo, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  const createProfile = useCallback(
    async (profile: NewProfile) => {
      const created = await repo.create(profile);
      setStore((s) => ({ profiles: [...s.profiles, created], activeId: created.id }));
      return created;
    },
    [repo],
  );

  const updateProfile = useCallback(
    async (id: string, profile: StorytellerProfile) => {
      const updated = await repo.update(id, profile);
      setStore((s) => ({ ...s, profiles: s.profiles.map((p) => (p.id === id ? updated : p)) }));
    },
    [repo],
  );

  const deleteProfile = useCallback(
    async (id: string) => {
      const nextActive = await repo.remove(id);
      setStore((s) => ({ profiles: s.profiles.filter((p) => p.id !== id), activeId: nextActive }));
      return nextActive;
    },
    [repo],
  );

  const switchProfile = useCallback(
    async (id: string) => {
      await repo.setActive(id);
      setStore((s) => ({ ...s, activeId: id }));
    },
    [repo],
  );

  const changePersona = useCallback(
    async (id: string, personaId: StorytellerProfile['personaId']) => {
      const current = store.profiles.find((p) => p.id === id);
      if (!current) return;
      await updateProfile(id, { ...current, personaId });
    },
    [store.profiles, updateProfile],
  );

  const finishSession = useCallback(
    async (id: string, result: SessionResult) => {
      const current = store.profiles.find((p) => p.id === id);
      if (!current) return;
      // Attach the full session transcript to each memory captured this session,
      // so its detail view can show the whole conversation.
      const captured = result.memories.map((m) => ({ ...m, transcript: result.transcript }));
      await updateProfile(id, {
        ...current,
        sessions: (current.sessions || 0) + 1,
        memories: [...captured, ...(current.memories || [])],
      });
    },
    [store.profiles, updateProfile],
  );

  const deleteMemory = useCallback(
    async (profileId: string, memoryId: string) => {
      const current = store.profiles.find((p) => p.id === profileId);
      if (!current) return;
      await updateProfile(profileId, {
        ...current,
        memories: (current.memories || []).filter((m) => m.id !== memoryId),
      });
    },
    [store.profiles, updateProfile],
  );

  const updateMemory = useCallback(
    async (profileId: string, memoryId: string, patch: Partial<Memory>) => {
      const current = store.profiles.find((p) => p.id === profileId);
      if (!current) return;
      await updateProfile(profileId, {
        ...current,
        memories: (current.memories || []).map((m) =>
          m.id === memoryId ? { ...m, ...patch } : m,
        ),
      });
    },
    [store.profiles, updateProfile],
  );

  const resetAll = useCallback(async () => {
    // Remove each profile via the active repository (local or cloud).
    for (const p of store.profiles) {
      await repo.remove(p.id);
    }
    setStore({ profiles: [], activeId: null });
  }, [repo, store.profiles]);

  const initDemoStore = useCallback((userProfile: StorytellerProfile) => {
    const demoStore = getFullDemoStore();
    const combined = { profiles: [userProfile, ...demoStore.profiles], activeId: userProfile.id };
    seedLocalStore(combined);
    setStore(combined);
  }, []);

  const skipToDemo = useCallback(() => {
    const demoStore = getFullDemoStore();
    seedLocalStore(demoStore);
    setStore(demoStore);
  }, []);

  const activeProfile =
    store.profiles.find((p) => p.id === store.activeId) || store.profiles[0] || null;

  const value: StoreContextValue = {
    ready,
    profiles: store.profiles,
    activeId: store.activeId,
    activeProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    switchProfile,
    changePersona,
    finishSession,
    deleteMemory,
    updateMemory,
    resetAll,
    initDemoStore,
    skipToDemo,
    loadError,
    reload,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within a StoreProvider');
  return ctx;
}
