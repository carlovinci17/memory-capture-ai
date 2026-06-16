import { describe, it, expect } from 'vitest';
import { verbatimExcerpt } from './verbatim';
import { nextQuestionSystem, suggestQuestionsSystem, transcriptMessages } from './prompts';
import { ExtractionResult, ExtractRequest, NextQuestionRequest } from './schemas';

const profile = { name: 'Eleanor Marchetti', yearBorn: '1948', birthplace: 'Camogli' };
const persona = { name: 'Curious Historian', promptStyle: 'You situate a life within history.' };

describe('verbatimExcerpt (server)', () => {
  it('keeps a genuine substring and rejects a paraphrase', () => {
    const answer = 'It was September 1967, still warm.';
    expect(verbatimExcerpt(answer, 'September 1967')).toBe('September 1967');
    expect(verbatimExcerpt(answer, 'She left in autumn')).toBe(answer);
  });
});

describe('prompt builders', () => {
  it('embeds persona style and storyteller context in the system prompt', () => {
    const sys = nextQuestionSystem(profile, persona);
    expect(sys).toContain('Curious Historian');
    expect(sys).toContain('situate a life within history');
    expect(sys).toContain('Camogli');
    expect(sys).toContain('1948');
  });

  it('asks for a JSON suggestions object with the requested count', () => {
    const sys = suggestQuestionsSystem(profile, persona, 3);
    expect(sys).toContain('3');
    expect(sys.toLowerCase()).toContain('json');
  });

  it('maps transcript turns to assistant/user roles, last 8 only', () => {
    const turns = Array.from({ length: 12 }, (_, i) => ({
      who: i % 2 === 0 ? ('ai' as const) : ('storyteller' as const),
      text: `t${i}`,
    }));
    const msgs = transcriptMessages(turns, persona.name, 'Eleanor');
    expect(msgs).toHaveLength(8);
    expect(msgs[msgs.length - 1].content).toContain('t11');
  });
});

describe('request validation', () => {
  it('rejects an empty answer for extract', () => {
    expect(ExtractRequest.safeParse({ answerText: '' }).success).toBe(false);
  });

  it('accepts a well-formed next-question request', () => {
    const ok = NextQuestionRequest.safeParse({ profile, persona, transcript: [] });
    expect(ok.success).toBe(true);
  });

  it('parses a valid extraction result', () => {
    const r = ExtractionResult.safeParse({
      title: 'Leaving Camogli',
      era: '1967',
      theme: 'Home',
      excerpt: 'the boats were coming in',
      people: [{ text: 'Giovanni', relation: 'Father' }],
      places: ['Camogli'],
      years: ['1967'],
    });
    expect(r.success).toBe(true);
  });
});
