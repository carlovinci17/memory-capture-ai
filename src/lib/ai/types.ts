// ai/types.ts — the interview "engine" contract.
// The static fallback (M5) and the Azure AI Foundry client (M6) both implement
// this. Screens depend only on the interface, so swapping in real AI is a
// one-line change and the static pools remain as a graceful fallback.
import type { ExtractedEntity, Persona, StorytellerProfile, TranscriptTurn } from '../domain/types';

export interface InterviewContext {
  profile: StorytellerProfile;
  persona: Persona;
  transcript: TranscriptTurn[];
  /** Memories captured in previous sessions — used to vary the opening question and avoid re-asking. */
  priorMemories?: { title: string; summary?: string; excerpt: string }[];
  /** Random angle hint for the opening question — ensures variety across sessions. */
  openingAngle?: string;
}

/** Structured memory extraction (mirrors Scope §7.3). */
export interface ExtractionResult {
  /** null → the answer was too thin to be a memory; create no card. */
  title: string | null;
  era: string;
  theme: string;
  /** The storyteller's words, verbatim (validated as a substring of the answer). */
  excerpt: string;
  people: { text: string; relation: string | null }[];
  places: string[];
  years: string[];
  /** 1-2 sentence prose summary of the memory (for display alongside the verbatim excerpt). */
  summary?: string;
}

/** Optional, warm one-paragraph session reflection (Scope §7.4). */
export interface SummaryContext {
  profile: StorytellerProfile;
  persona: Persona;
  session: {
    memories: { title: string; excerpt: string }[];
    turns: number;
    minutes: number;
  };
}

export interface InterviewEngine {
  /**
   * AI-asks mode: the next gentle question. `onDelta` (optional) is called with
   * the text-so-far as it streams, for progressive rendering.
   */
  nextQuestion(ctx: InterviewContext, onDelta?: (textSoFar: string) => void): Promise<string>;
  /** Manual mode: optional follow-up suggestions for the family operator. */
  suggestQuestions(ctx: InterviewContext, count: number): Promise<string[]>;
  /** Live extraction after each storyteller answer. */
  extract(answerText: string, priorEntities: ExtractedEntity[]): Promise<ExtractionResult>;
  /** Optional one-paragraph reflection; engines may return null to opt out. */
  summary(ctx: SummaryContext): Promise<string | null>;
}
