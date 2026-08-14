import { describe, it, expect, vi, afterEach } from 'vitest';
import { HttpInterviewEngine } from './httpEngine';
import { PERSONAS } from '../domain/personas';
import type { StorytellerProfile } from '../domain/types';

// The session-token round trip is exercised in apiSession.test.ts — stub it here so
// these tests can assert on a single fetch call per interview request, as before.
vi.mock('../apiSession', () => ({ withSessionHeader: async (h: Record<string, string> = {}) => h }));

const profile: StorytellerProfile = {
  id: 'p1',
  name: 'Eleanor Marchetti',
  birthplace: 'Camogli',
  personaId: 'historian',
  memories: [],
  sessions: 0,
  createdAt: 0,
};
const ctx = { profile, persona: PERSONAS[0], transcript: [] };

function streamResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((c) => controller.enqueue(encoder.encode(c)));
      controller.close();
    },
  });
  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/plain' } });
}

afterEach(() => vi.restoreAllMocks());

describe('HttpInterviewEngine', () => {
  it('assembles streamed deltas for nextQuestion and reports progress', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      streamResponse(['What ', 'was ', 'the harbour like?']),
    );
    const engine = new HttpInterviewEngine();
    const seen: string[] = [];
    const q = await engine.nextQuestion(ctx, (t) => seen.push(t));
    expect(q).toBe('What was the harbour like?');
    expect(seen[seen.length - 1]).toBe('What was the harbour like?');
    expect(seen.length).toBeGreaterThan(1);
  });

  it('falls back to the offline engine when the API errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 502 }));
    const engine = new HttpInterviewEngine();
    const list = await engine.suggestQuestions(ctx, 3);
    expect(list).toHaveLength(3); // offline pool still answers
  });

  it('parses a successful extract response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          title: 'Leaving Camogli',
          era: '1967',
          theme: 'Home',
          excerpt: 'the boats were coming in',
          people: [],
          places: ['Camogli'],
          years: ['1967'],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const engine = new HttpInterviewEngine();
    const r = await engine.extract('the boats were coming in', []);
    expect(r.title).toBe('Leaving Camogli');
    expect(r.era).toBe('1967');
  });

  it('falls back to offline extraction when fetch throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));
    const engine = new HttpInterviewEngine();
    const r = await engine.extract('I was born in Camogli in 1948.', []);
    expect(r.title).toBeTruthy(); // offline engine produced a card
  });

  it('returns null summary on API failure (block stays hidden)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('x', { status: 502 }));
    const engine = new HttpInterviewEngine();
    const p = await engine.summary({
      profile,
      persona: PERSONAS[0],
      session: { memories: [{ title: 'T', excerpt: 'E' }], turns: 1, minutes: 1 },
    });
    expect(p).toBeNull();
  });
});
