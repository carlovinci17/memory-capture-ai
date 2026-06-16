import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiProfileRepository } from './apiRepository';
import type { NewProfile } from './repository';
import type { StorytellerProfile } from '../domain/types';

const base: NewProfile = {
  name: 'Eleanor Marchetti',
  personaId: 'historian',
  photo: null,
  memories: [],
  sessions: 0,
  createdAt: 1,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('ApiProfileRepository', () => {
  it('lists profiles and resolves active id from localStorage', async () => {
    const profiles: StorytellerProfile[] = [
      { ...base, id: 'a' } as StorytellerProfile,
      { ...base, id: 'b', name: 'Thomas' } as StorytellerProfile,
    ];
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ profiles }));
    localStorage.setItem('mcap_active_id', 'b');
    const repo = new ApiProfileRepository();
    const store = await repo.load();
    expect(store.profiles).toHaveLength(2);
    expect(store.activeId).toBe('b');
  });

  it('uploads a data-URL photo before creating, storing the returned URL', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ url: 'https://blob/abc.png' })) // upload
      .mockResolvedValueOnce(jsonResponse({ ...base, id: 'a', photo: 'https://blob/abc.png' }, 201));
    const repo = new ApiProfileRepository();
    const created = await repo.create({ ...base, photo: 'data:image/png;base64,iVBOR' });
    expect(created.photo).toBe('https://blob/abc.png');
    // First call hits the upload endpoint with the data URL.
    expect(fetchMock.mock.calls[0][0]).toContain('/api/uploads/photo');
    const createBody = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
    expect(createBody.photo).toBe('https://blob/abc.png');
    expect(localStorage.getItem('mcap_active_id')).toBe('a');
  });

  it('does not re-upload an existing URL photo', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ ...base, id: 'a', photo: 'https://blob/x.png' }, 201));
    const repo = new ApiProfileRepository();
    await repo.create({ ...base, photo: 'https://blob/x.png' });
    expect(fetchMock).toHaveBeenCalledTimes(1); // no upload call
    expect(fetchMock.mock.calls[0][0]).toContain('/api/profiles');
  });

  it('recomputes the next active id after delete', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ ok: true })) // DELETE
      .mockResolvedValueOnce(jsonResponse({ profiles: [{ ...base, id: 'b' }] })); // re-list
    localStorage.setItem('mcap_active_id', 'a');
    const repo = new ApiProfileRepository();
    const next = await repo.remove('a');
    expect(next).toBe('b');
    expect(localStorage.getItem('mcap_active_id')).toBe('b');
  });
});
