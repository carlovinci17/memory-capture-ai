// repository.ts — the swappable persistence interface.
// localStorage today; Cosmos DB / Table Storage implementations land in M8
// behind this same contract. Screens depend only on this interface.
import type { StorytellerProfile, Store } from '../domain/types';

/** A new profile payload from the onboarding form (no id assigned yet). */
export type NewProfile = Omit<StorytellerProfile, 'id'>;

export interface ProfileRepository {
  /** Load the whole store (all profiles + the active id). */
  load(): Promise<Store>;
  /** Create a new storyteller; returns the created profile (with id). */
  create(profile: NewProfile): Promise<StorytellerProfile>;
  /** Replace an existing profile by id. */
  update(id: string, profile: StorytellerProfile): Promise<StorytellerProfile>;
  /** Remove a profile by id; returns the next active id (or null). */
  remove(id: string): Promise<string | null>;
  /** Set the active storyteller. */
  setActive(id: string): Promise<void>;
}
