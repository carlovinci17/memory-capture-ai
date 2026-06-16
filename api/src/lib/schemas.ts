// schemas.ts — Zod request validation + the structured-extraction JSON schema.
import { z } from 'zod';

export const ProfileContext = z.object({
  name: z.string().min(1).max(120),
  yearBorn: z.string().max(8).optional(),
  birthplace: z.string().max(160).optional(),
  bio: z.string().max(1000).optional(),
});

export const PersonaContext = z.object({
  name: z.string().min(1).max(80),
  promptStyle: z.string().min(1).max(600),
});

export const TurnContext = z.object({
  who: z.enum(['ai', 'storyteller', 'asker']),
  text: z.string().max(4000),
  askerLabel: z.string().max(80).optional(),
});

export const NextQuestionRequest = z.object({
  profile: ProfileContext,
  persona: PersonaContext,
  transcript: z.array(TurnContext).max(40),
  priorMemories: z
    .array(z.object({ title: z.string().max(120), summary: z.string().max(500).optional(), excerpt: z.string().max(300) }))
    .max(20)
    .optional()
    .default([]),
  openingAngle: z.string().max(300).optional(),
});

export const SuggestQuestionsRequest = NextQuestionRequest.extend({
  count: z.number().int().min(1).max(5).default(3),
});

export const ExtractRequest = z.object({
  answerText: z.string().min(1).max(4000),
  priorEntities: z
    .array(z.object({ kind: z.enum(['person', 'place', 'year']), text: z.string() }))
    .max(50)
    .optional()
    .default([]),
});

export const SummaryRequest = z.object({
  profile: ProfileContext,
  persona: PersonaContext,
  session: z.object({
    memories: z.array(z.object({ title: z.string(), excerpt: z.string() })).max(50),
    turns: z.number().int().min(0),
    minutes: z.number().int().min(0),
  }),
});

/** JSON schema handed to the model via response_format (Scope §7.3). */
export const EXTRACTION_JSON_SCHEMA = {
  name: 'memory_extraction',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: {
        type: ['string', 'null'],
        description: '≤ 6 words, evocative, no year. null if the answer is too thin to be a memory.',
      },
      era: { type: 'string', description: 'A 4-digit year or short period. Empty string if unknown.' },
      theme: { type: 'string', description: '1–2 words, e.g. "Home", "Family".' },
      excerpt: {
        type: 'string',
        description: "The storyteller's words verbatim, a substring of the input, ≤ 160 chars.",
      },
      summary: {
        type: 'string',
        description: '1–2 warm, specific sentences capturing the heart of the memory. Empty string if title is null.',
      },
      people: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            text: { type: 'string' },
            relation: { type: ['string', 'null'] },
          },
          required: ['text', 'relation'],
        },
      },
      places: { type: 'array', items: { type: 'string' } },
      years: { type: 'array', items: { type: 'string' } },
    },
    required: ['title', 'era', 'theme', 'excerpt', 'summary', 'people', 'places', 'years'],
  },
} as const;

/** Shape the model returns for extraction (validated before use). */
export const ExtractionResult = z.object({
  title: z.string().nullable(),
  era: z.string(),
  theme: z.string(),
  excerpt: z.string(),
  summary: z.string(),
  people: z.array(z.object({ text: z.string(), relation: z.string().nullable() })),
  places: z.array(z.string()),
  years: z.array(z.string()),
});
export type ExtractionResult = z.infer<typeof ExtractionResult>;
