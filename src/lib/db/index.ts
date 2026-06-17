// db/index.ts — repository factory. Runtime mode (demo vs production) is read
// from localStorage so the admin panel can switch it without a rebuild.
import type { ProfileRepository } from './repository';
import { LocalProfileRepository } from './localRepository';
import { ApiProfileRepository } from './apiRepository';
import { getRuntimeMode } from '../demo/demoMode';

let instance: ProfileRepository | null = null;

export function getRepository(): ProfileRepository {
  if (instance) return instance;
  if (getRuntimeMode() === 'production') {
    // Production mode — profiles persist in Cosmos via the /api Functions.
    instance = new ApiProfileRepository();
  } else {
    // Demo mode (default) — fully local, no cloud storage.
    instance = new LocalProfileRepository();
  }
  return instance;
}

export type { ProfileRepository, NewProfile } from './repository';
