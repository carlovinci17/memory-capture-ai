// httpEngine.ts — calls the Azure Functions API (/api/interview/*) which talks
// to Azure AI Foundry server-side. Every method degrades gracefully to the
// offline FallbackInterviewEngine on error, timeout, or over-budget, so the
// interview never hard-stops (Scope §7 note). A simple per-session call budget
// caps runaway spend (Scope §16); per-IP limiting is added server-side in M9.
import { FallbackInterviewEngine } from './fallbackEngine';
import type {
  ExtractionResult,
  InterviewContext,
  InterviewEngine,
  SummaryContext,
} from './types';
import type { ExtractedEntity } from '../domain/types';
import { withSessionHeader } from '../apiSession';

const TIMEOUT_MS = 12_000;
const MAX_CALLS_PER_MINUTE = 30;

function wireProfile(ctx: InterviewContext | SummaryContext) {
  const { name, yearBorn, birthplace, bio } = ctx.profile;
  return { name, yearBorn, birthplace, bio };
}

function wirePersona(ctx: InterviewContext | SummaryContext) {
  return { name: ctx.persona.name, promptStyle: ctx.persona.promptStyle };
}

function wireTranscript(transcript: InterviewContext['transcript']) {
  return transcript.map((t) => ({ who: t.who, text: t.text, askerLabel: t.askerLabel }));
}

export class HttpInterviewEngine implements InterviewEngine {
  private readonly fallback = new FallbackInterviewEngine();
  private callTimes: number[] = [];

  constructor(private readonly base = '/api/interview') {}

  /** Sliding-window budget. Returns false when the session is over budget. */
  private withinBudget(): boolean {
    const now = Date.now();
    this.callTimes = this.callTimes.filter((t) => now - t < 60_000);
    if (this.callTimes.length >= MAX_CALLS_PER_MINUTE) return false;
    this.callTimes.push(now);
    return true;
  }

  private async post(path: string, body: unknown): Promise<Response> {
    return fetch(`${this.base}/${path}`, {
      method: 'POST',
      headers: await withSessionHeader({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  }

  async nextQuestion(
    ctx: InterviewContext,
    onDelta?: (textSoFar: string) => void,
  ): Promise<string> {
    if (!this.withinBudget()) return this.fallback.nextQuestion(ctx, onDelta);
    try {
      const res = await this.post('next-question', {
        profile: wireProfile(ctx),
        persona: wirePersona(ctx),
        transcript: wireTranscript(ctx.transcript),
        priorMemories: ctx.priorMemories,
        openingAngle: ctx.openingAngle,
      });
      if (!res.ok || !res.body) return this.fallback.nextQuestion(ctx, onDelta);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        onDelta?.(text);
      }
      text = text.trim();
      return text || (await this.fallback.nextQuestion(ctx, onDelta));
    } catch {
      return this.fallback.nextQuestion(ctx, onDelta);
    }
  }

  async suggestQuestions(ctx: InterviewContext, count: number): Promise<string[]> {
    if (!this.withinBudget()) return this.fallback.suggestQuestions(ctx, count);
    try {
      const res = await this.post('suggest-questions', {
        profile: wireProfile(ctx),
        persona: wirePersona(ctx),
        transcript: wireTranscript(ctx.transcript),
        count,
      });
      if (!res.ok) return this.fallback.suggestQuestions(ctx, count);
      const data = (await res.json()) as { suggestions?: string[] };
      const list = data.suggestions?.filter((q) => typeof q === 'string' && q.trim()) ?? [];
      return list.length ? list.slice(0, count) : this.fallback.suggestQuestions(ctx, count);
    } catch {
      return this.fallback.suggestQuestions(ctx, count);
    }
  }

  async extract(answerText: string, priorEntities: ExtractedEntity[]): Promise<ExtractionResult> {
    if (!this.withinBudget()) return this.fallback.extract(answerText, priorEntities);
    try {
      const res = await this.post('extract', {
        answerText,
        priorEntities: priorEntities.map((e) => ({ kind: e.kind, text: e.text })),
      });
      if (!res.ok) return this.fallback.extract(answerText, priorEntities);
      return (await res.json()) as ExtractionResult;
    } catch {
      return this.fallback.extract(answerText, priorEntities);
    }
  }

  async summary(ctx: SummaryContext): Promise<string | null> {
    if (!this.withinBudget()) return null;
    try {
      const res = await this.post('summary', {
        profile: wireProfile(ctx),
        persona: wirePersona(ctx),
        session: ctx.session,
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { paragraph?: string };
      return data.paragraph?.trim() || null;
    } catch {
      return null;
    }
  }
}
