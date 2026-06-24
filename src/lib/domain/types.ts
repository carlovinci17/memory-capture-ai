// Domain types — the source of truth for the data model (Engineering Scope §6).
// Persisted as JSON documents (localStorage today; Cosmos/Table later).
import { z } from 'zod';

export type PersonaId = 'historian' | 'journalist' | 'grandchild' | 'researcher';

export const PERSONA_IDS: readonly PersonaId[] = [
  'historian',
  'journalist',
  'grandchild',
  'researcher',
] as const;

/** A captured story — rendered as a watercolor "memory card". */
export const MemorySchema = z.object({
  id: z.string(),
  title: z.string(),
  /** The storyteller's words, verbatim (trimmed). Never paraphrased. */
  excerpt: z.string(),
  era: z.string().optional(),
  theme: z.string().optional(),
  /** 2–3 hex/token colors for the watercolor art. */
  palette: z.array(z.string()),
  createdAt: z.number(),
  /** The question that prompted this memory (for the detail/transcript view). */
  question: z.string().optional(),
  /** The full verbatim answer (the excerpt is a short preview of this). */
  answer: z.string().optional(),
  /** People/places/years noticed in this specific memory. */
  people: z.array(z.object({ text: z.string(), relation: z.string().nullish() })).optional(),
  places: z.array(z.string()).optional(),
  years: z.array(z.string()).optional(),
  /** Short prose summary of the memory (generated at capture time). */
  summary: z.string().optional(),
  /** AI-generated watercolour image URL (Azure Blob), set asynchronously after capture. */
  imageUrl: z.string().optional(),
  /** 400px thumbnail of the same image — used in card/list views. */
  imageThumbnailUrl: z.string().optional(),
  /** Full conversation transcript from the session this memory was captured in. */
  transcript: z
    .array(
      z.object({
        who: z.enum(['ai', 'storyteller', 'asker']),
        text: z.string(),
        askerLabel: z.string().optional(),
        ts: z.number(),
      }),
    )
    .optional(),
});
export type Memory = z.infer<typeof MemorySchema>;

export type EntityKind = 'person' | 'place' | 'year';

export const ExtractedEntitySchema = z.object({
  kind: z.enum(['person', 'place', 'year']),
  text: z.string(),
  relation: z.string().nullish(),
});
export type ExtractedEntity = z.infer<typeof ExtractedEntitySchema>;

/** A storyteller profile. Owns its memories; counters are denormalized. */
export const StorytellerProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  yearBorn: z.string().optional(),
  birthplace: z.string().optional(),
  bio: z.string().optional(),
  /** Data URL today; Azure Blob URL once cloud storage lands. */
  photo: z.string().nullable().optional(),
  gender: z.enum(['M', 'F']).optional(),
  personaId: z.enum(['historian', 'journalist', 'grandchild', 'researcher']),
  memories: z.array(MemorySchema).default([]),
  sessions: z.number().default(0),
  createdAt: z.number(),
});
export type StorytellerProfile = z.infer<typeof StorytellerProfileSchema>;

/** Top-level persisted store (maps the prototype's `mcap_mvp_store_v1`). */
export const StoreSchema = z.object({
  profiles: z.array(StorytellerProfileSchema),
  activeId: z.string().nullable(),
});
export type Store = z.infer<typeof StoreSchema>;

/** One line of interview dialogue. */
export interface TranscriptTurn {
  who: 'ai' | 'storyteller' | 'asker';
  text: string;
  /** e.g. "Family" — present when who === 'asker'. */
  askerLabel?: string;
  ts: number;
}

/** Static interviewer config (not stored per user). */
export interface Persona {
  id: PersonaId;
  name: string;
  glyph: string;
  accent: string;
  blurb: string;
  sample: string;
  /** System-prompt fragment describing this interviewer's voice/style (used by AI in M6). */
  promptStyle: string;
  /** Azure neural TTS voice for read-aloud, distinct per interviewer. */
  voice: string;
}

/** Result of a finished interview session (passed to the Summary screen). */
export interface SessionResult {
  memories: Memory[];
  noticed: ExtractedEntity[];
  turns: number;
  minutes: number;
  /** The full conversation, attached to each memory captured this session. */
  transcript: TranscriptTurn[];
}
