// db/index.ts — repository factory. Swaps implementations by config without
// touching screen code. Cosmos/Table implementations are added in M8.
import type { ProfileRepository } from './repository';
import { LocalProfileRepository } from './localRepository';
import { ApiProfileRepository } from './apiRepository';

let instance: ProfileRepository | null = null;

export function getRepository(): ProfileRepository {
  if (instance) return instance;

  const provider = import.meta.env.VITE_AUTH_PROVIDER ?? 'guest';
  switch (provider) {
    case 'swa':
      // Cloud mode — profiles persist in Cosmos via the /api Functions.
      instance = new ApiProfileRepository();
      break;
    case 'guest':
    default:
      // Guest/local mode — fully offline, no cloud dependencies.
      instance = new LocalProfileRepository();
      break;
  }
  return instance;
}

export type { ProfileRepository, NewProfile } from './repository';
