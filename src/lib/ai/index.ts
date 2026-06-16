// ai/index.ts — interview-engine factory.
// Returns the Azure-backed HTTP engine when VITE_AI_MODE === 'azure' (it falls
// back to the offline engine per-call on any error); otherwise the pure offline
// engine for guest mode and local dev without keys.
import { FallbackInterviewEngine } from './fallbackEngine';
import { HttpInterviewEngine } from './httpEngine';
import type { InterviewEngine } from './types';

let instance: InterviewEngine | null = null;

export function getInterviewEngine(): InterviewEngine {
  if (instance) return instance;
  instance =
    import.meta.env.VITE_AI_MODE === 'azure'
      ? new HttpInterviewEngine()
      : new FallbackInterviewEngine();
  return instance;
}

export type {
  InterviewEngine,
  InterviewContext,
  SummaryContext,
  ExtractionResult,
} from './types';
