// profileSchemas.ts — Zod validation for profile CRUD (mirrors the client's
// StorytellerProfile in src/lib/domain/types.ts).
import { z } from 'zod';

const Memory = z.object({
  id: z.string(),
  title: z.string(),
  excerpt: z.string(),
  summary: z.string().optional(),
  imageUrl: z.string().optional(),
  imageThumbnailUrl: z.string().optional(),
  era: z.string().optional(),
  theme: z.string().optional(),
  palette: z.array(z.string()),
  createdAt: z.number(),
  question: z.string().optional(),
  answer: z.string().optional(),
  people: z.array(z.object({ text: z.string(), relation: z.string().nullish() })).optional(),
  places: z.array(z.string()).optional(),
  years: z.array(z.string()).optional(),
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

/** Create/replace payload — the full profile minus the server-assigned id. */
export const ProfileUpsert = z.object({
  name: z.string().min(1).max(120),
  yearBorn: z.string().max(8).optional(),
  birthplace: z.string().max(200).optional(),
  bio: z.string().max(2000).optional(),
  photo: z.string().nullable().optional(),
  gender: z.enum(['M', 'F']).optional(),
  personaId: z.enum(['historian', 'journalist', 'grandchild', 'researcher']),
  memories: z.array(Memory).default([]),
  sessions: z.number().int().min(0).default(0),
  createdAt: z.number(),
});
export type ProfileUpsert = z.infer<typeof ProfileUpsert>;

/** Stored Cosmos document shape. */
export interface ProfileDoc extends ProfileUpsert {
  id: string;
  accountId: string;
}

/** Strip Cosmos/system + ownership fields before returning to the client. */
export function toClientProfile(doc: ProfileDoc) {
  return {
    id: doc.id,
    name: doc.name,
    yearBorn: doc.yearBorn,
    birthplace: doc.birthplace,
    bio: doc.bio,
    photo: doc.photo ?? null,
    gender: doc.gender,
    personaId: doc.personaId,
    memories: doc.memories ?? [],
    sessions: doc.sessions ?? 0,
    createdAt: doc.createdAt,
  };
}
