// fallbackEngine.ts — offline interview logic ported from the prototype
// (mvp-interview.jsx: extractFrom, deriveTitle, FOLLOWUPS, QUESTION_POOL).
// Used in guest mode and as the graceful fallback when Azure AI is unavailable.
import type { ExtractedEntity } from '../domain/types';
import { verbatimExcerpt } from './verbatim';
import type { ExtractionResult, InterviewContext, InterviewEngine } from './types';

const STOPWORDS = new Set([
  'I', 'A', 'The', 'My', 'We', 'It', 'And', 'But', 'When', 'Where', 'There', 'That', 'This',
  'They', 'He', 'She', 'You', 'Me', 'Then', 'So', 'No', 'Yes', 'Oh', 'Well', 'Her', 'His', 'Our',
  'Their', 'In', 'On', 'At', 'To', 'Of', 'For', 'With', 'Mr', 'Mrs', 'Ms', 'Dr', "It's",
]);

const FOLLOWUPS = [
  "That's wonderful. Who else was there with you in that memory?",
  'Tell me more — what did that feel like, in the moment?',
  'Beautiful. And what happened next?',
  'I can almost picture it. What sounds or smells come back to you?',
  'Why do you think that one has stayed with you all these years?',
  'And the people around you then — what were they like?',
  'What a detail to keep. Where exactly was this?',
];

// Persona-flavoured follow-ups so the interviewer's character comes through even
// in offline mode (the AI engine varies via persona.promptStyle).
const FOLLOWUPS_BY_PERSONA: Record<string, string[]> = {
  historian: [
    'What was happening in the wider world around then?',
    'How did that place look and sound in those years?',
    'What had changed by the time this happened?',
    'Who held the old stories in your family back then?',
  ],
  journalist: [
    'And then what happened — what came next?',
    'When did you realise things had changed?',
    'What was the turning point in that?',
    'You paused there — what were you feeling in that moment?',
  ],
  grandchild: [
    'Ooh, what did that smell like? Take me there.',
    'What were Sundays like back then?',
    'Who made you laugh the most in those days?',
    'What song was playing in the house?',
  ],
  researcher: [
    'Who exactly was there — what were their names?',
    'What year would that have been, roughly?',
    'And where did this take place?',
    'How was that person related to you?',
  ],
};

const QUESTION_POOL = [
  'What were you like when you were my age?',
  "What's a smell or taste that takes you straight back home?",
  'Who made you laugh the most when you were growing up?',
  'What were Sunday afternoons like in your family?',
  "What's the bravest thing you've ever done?",
  'What did your mother always used to say to you?',
  'Is there a story about our family you think I should know?',
  'What music was playing in the house when you were young?',
  'If you could relive one ordinary day, which one would it be?',
  '{place} — what did it look, sound and smell like back then?',
  'What do you hope we remember about you?',
  "What's something you've never told anyone?",
];

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function deriveTitle(text: string): string {
  const clean = text
    .replace(/\b(18|19|20)\d{2}\b/g, ' ')
    .replace(/[^A-Za-z\s'']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = clean.split(' ').filter(Boolean);
  if (!words.length) return 'A new memory';
  const small = new Set([
    'the', 'a', 'an', 'and', 'of', 'to', 'in', 'on', 'at', 'was', 'were', 'is', 'are', 'it', 'i',
    'my', 'we', 'so', 'but', 'then', 'that', 'this', 'with', 'for', 'when', 'where', 'while',
    'would', 'could', 'should', 'had', 'have', 'has', 'did', 'do', 'as', 'by', 'from', 'about',
    'me', 'her', 'his', 'our', 'their', 'not', 'no', 'up', 'out', 'into', 'over', 'just', 'still',
    'left', 'went', 'came', 'said', 'told', 'looked',
  ]);
  const keep = words.filter((w) => !small.has(w.toLowerCase()));
  const pick = (keep.length >= 2 ? keep : words).slice(0, 4).join(' ');
  return titleCase(pick.length > 38 ? pick.slice(0, 36) + '…' : pick);
}

export function extractFrom(text: string): { years: string[]; names: string[] } {
  const years = text.match(/\b(18|19|20)\d{2}\b/g) || [];
  const names: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  sentences.forEach((sent) => {
    const toks = sent.trim().split(/\s+/);
    toks.forEach((raw, i) => {
      const w = raw.replace(/[^A-Za-z'']/g, '');
      if (i === 0) return;
      if (w.length < 3) return;
      if (!/^[A-Z][a-z'']+$/.test(w)) return;
      if (STOPWORDS.has(w)) return;
      names.push(w);
    });
  });
  return { years: [...new Set(years)], names: [...new Set(names)] };
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MIN_ANSWER_LEN = 14;

export class FallbackInterviewEngine implements InterviewEngine {
  private followUpIndex = 0;

  async nextQuestion(
    ctx: InterviewContext,
    onDelta?: (textSoFar: string) => void,
  ): Promise<string> {
    const pool = FOLLOWUPS_BY_PERSONA[ctx.persona.id] ?? FOLLOWUPS;
    // Avoid repeating any question already in the transcript
    const asked = new Set(ctx.transcript.filter((t) => t.who === 'ai').map((t) => t.text));
    const available = pool.filter((q) => !asked.has(q));
    const source = available.length > 0 ? available : pool;
    const q = source[this.followUpIndex % source.length];
    this.followUpIndex += 1;
    onDelta?.(q);
    return q;
  }

  async suggestQuestions(ctx: InterviewContext, count: number): Promise<string[]> {
    const out: string[] = [];
    const lastAnswer = [...ctx.transcript].reverse().find((t) => t.who === 'storyteller');
    if (lastAnswer) {
      const ex = extractFrom(lastAnswer.text);
      if (ex.names[0]) out.push(`You mentioned ${ex.names[0]} — what were they like?`);
      if (ex.names[1]) out.push(`Tell me more about ${ex.names[1]}.`);
      if (ex.years[0]) out.push(`What else do you remember from ${ex.years[0]}?`);
    }
    const first = (ctx.profile.name || '').trim().split(/\s+/)[0] || 'friend';
    const place = ctx.profile.birthplace || 'home';
    const sub = (q: string) => q.replace(/\{first\}/g, first).replace(/\{place\}/g, place);
    for (const q of shuffle(QUESTION_POOL).map(sub)) {
      if (out.length >= count) break;
      if (!out.includes(q)) out.push(q);
    }
    return out.slice(0, count);
  }

  async extract(answerText: string, _prior: ExtractedEntity[]): Promise<ExtractionResult> {
    if (answerText.trim().length < MIN_ANSWER_LEN) {
      return { title: null, era: '', theme: '', excerpt: '', people: [], places: [], years: [] };
    }
    const ex = extractFrom(answerText);
    const era = ex.years.length ? [...ex.years].sort()[0] : '';
    const sentences = answerText.trim().split(/(?<=[.!?])\s+/);
    const summary = sentences.slice(0, 2).join(' ').trim();
    return {
      title: deriveTitle(answerText),
      era,
      theme: 'Your story',
      excerpt: verbatimExcerpt(answerText),
      summary: summary || answerText.slice(0, 200).trim(),
      people: ex.names.map((text) => ({ text, relation: null })),
      places: [],
      years: ex.years,
    };
  }

  // Offline mode writes no AI reflection — the Summary screen hides the block.
  async summary(): Promise<string | null> {
    return null;
  }
}
