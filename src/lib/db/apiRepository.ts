// apiRepository.ts — cloud ProfileRepository backed by the /api/profiles
// Functions (Cosmos DB). Photos are uploaded to Blob via /api/uploads/photo so
// only their URL is stored. The "active" selection is per-browser UI state and
// stays in localStorage; the cloud only owns the profiles themselves.
import type { NewProfile, ProfileRepository } from './repository';
import type { Store, StorytellerProfile } from '../domain/types';

const ACTIVE_KEY = 'mcap_active_id';
const BASE = '/api';

function readActive(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}
function writeActive(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    // ignore
  }
}

async function parseJsonOrThrow<T>(res: Response, label: string): Promise<T> {
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    const preview = (await res.text()).slice(0, 80);
    throw new Error(
      `${label} (${res.status}): expected JSON but got "${preview}…" — API may not be deployed`,
    );
  }
  return res.json() as Promise<T>;
}

async function apiError(res: Response, label: string): Promise<Error> {
  let detail = '';
  try {
    const body = (await res.clone().json()) as { message?: string; error?: string };
    detail = body.message || body.error || '';
  } catch { /* body is not JSON */ }
  return new Error(`${label} (${res.status})${detail ? ': ' + detail : ''}`);
}

async function listProfiles(): Promise<StorytellerProfile[]> {
  const res = await fetch(`${BASE}/profiles`);
  if (!res.ok) throw await apiError(res, 'Failed to load profiles');
  const data = await parseJsonOrThrow<{ profiles: StorytellerProfile[] }>(res, 'Load profiles');
  return data.profiles ?? [];
}

/** Replace a data-URL photo with a Blob URL; pass through existing URLs/null. */
async function resolvePhoto(photo: string | null | undefined): Promise<string | null> {
  if (!photo) return null;
  if (!photo.startsWith('data:')) return photo; // already a URL
  const res = await fetch(`${BASE}/uploads/photo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl: photo }),
  });
  if (!res.ok) throw new Error(`Photo upload failed (${res.status})`);
  const data = await parseJsonOrThrow<{ url: string }>(res, 'Photo upload');
  return data.url;
}

export class ApiProfileRepository implements ProfileRepository {
  async load(): Promise<Store> {
    const profiles = await listProfiles();
    const stored = readActive();
    const activeId =
      (stored && profiles.some((p) => p.id === stored) && stored) || profiles[0]?.id || null;
    return { profiles, activeId };
  }

  async create(profile: NewProfile): Promise<StorytellerProfile> {
    const photo = await resolvePhoto(profile.photo);
    const res = await fetch(`${BASE}/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...profile, photo }),
    });
    if (!res.ok) throw await apiError(res, 'Create failed');
    const created = await parseJsonOrThrow<StorytellerProfile>(res, 'Create profile');
    writeActive(created.id);
    return created;
  }

  async update(id: string, profile: StorytellerProfile): Promise<StorytellerProfile> {
    const photo = await resolvePhoto(profile.photo);
    const { id: _omit, ...body } = { ...profile, photo };
    void _omit;
    const res = await fetch(`${BASE}/profiles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw await apiError(res, 'Update failed');
    return parseJsonOrThrow<StorytellerProfile>(res, 'Update profile');
  }

  async remove(id: string): Promise<string | null> {
    const res = await fetch(`${BASE}/profiles/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 404) throw new Error(`Delete failed (${res.status})`);
    // Recompute the next active selection from what remains.
    const remaining = await listProfiles();
    const next = remaining[0]?.id ?? null;
    if (readActive() === id || !next) writeActive(next);
    return next;
  }

  async setActive(id: string): Promise<void> {
    writeActive(id);
  }
}
