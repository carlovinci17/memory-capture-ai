import { describe, it, expect } from 'vitest';
import { FallbackInterviewEngine, deriveTitle, extractFrom } from './fallbackEngine';
import { verbatimExcerpt } from './verbatim';
import { PERSONAS } from '../domain/personas';
import type { StorytellerProfile } from '../domain/types';

const profile: StorytellerProfile = {
  id: 'p1',
  name: 'Eleanor Marchetti',
  birthplace: 'Camogli',
  personaId: 'historian',
  memories: [],
  sessions: 0,
  createdAt: 0,
};

describe('verbatimExcerpt', () => {
  it('keeps a candidate that is a genuine substring', () => {
    const answer = 'It was September 1967, still warm, the boats were coming in.';
    expect(verbatimExcerpt(answer, 'the boats were coming in')).toBe('the boats were coming in');
  });

  it('rejects a paraphrase and falls back to the verbatim answer', () => {
    const answer = 'It was September 1967, still warm.';
    // A paraphrase the model might invent — must NOT be stored.
    expect(verbatimExcerpt(answer, 'She left in autumn of 1967')).toBe(answer);
  });

  it('trims very long answers to <= 160 chars with an ellipsis', () => {
    const answer = 'a'.repeat(300);
    const out = verbatimExcerpt(answer);
    expect(out.length).toBeLessThanOrEqual(160);
    expect(out.endsWith('…')).toBe(true);
  });
});

describe('extractFrom / deriveTitle', () => {
  it('extracts years and capitalized names, ignoring stopwords', () => {
    const { years, names } = extractFrom('In 1967 my father Giovanni left Camogli.');
    expect(years).toContain('1967');
    expect(names).toContain('Giovanni');
    expect(names).toContain('Camogli');
  });

  it('derives a short title without the year', () => {
    expect(deriveTitle('I remember leaving the harbour in 1967')).not.toMatch(/1967/);
  });
});

describe('FallbackInterviewEngine', () => {
  const engine = new FallbackInterviewEngine();
  const ctx = { profile, persona: PERSONAS[0], transcript: [] };

  it('returns no card for a too-short answer', async () => {
    const r = await engine.extract('Yes.', []);
    expect(r.title).toBeNull();
  });

  it('builds a verbatim memory card from a substantive answer', async () => {
    const answer = "I was born in Camogli in 1948, above my father's net store.";
    const r = await engine.extract(answer, []);
    expect(r.title).toBeTruthy();
    expect(r.era).toBe('1948');
    expect(answer.includes(r.excerpt.replace(/…$/, ''))).toBe(true);
  });

  it('cycles follow-up questions in AI mode', async () => {
    const q1 = await engine.nextQuestion(ctx);
    const q2 = await engine.nextQuestion(ctx);
    expect(q1).toBeTruthy();
    expect(q1).not.toBe(q2);
  });

  it('asks persona-flavoured questions (grandchild differs from historian)', async () => {
    const grandchild = PERSONAS.find((p) => p.id === 'grandchild')!;
    const historian = PERSONAS.find((p) => p.id === 'historian')!;
    const gq = await new FallbackInterviewEngine().nextQuestion({ ...ctx, persona: grandchild });
    const hq = await new FallbackInterviewEngine().nextQuestion({ ...ctx, persona: historian });
    expect(gq).not.toBe(hq);
  });

  it('gives each persona a distinct read-aloud voice', () => {
    const voices = PERSONAS.map((p) => p.voice);
    expect(new Set(voices).size).toBe(voices.length);
  });

  it('suggests the requested number of questions', async () => {
    const list = await engine.suggestQuestions(ctx, 3);
    expect(list).toHaveLength(3);
  });
});
