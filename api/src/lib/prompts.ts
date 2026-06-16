// prompts.ts — system-prompt builders (mirroring Scope §7 templates).
import type { z } from 'zod';
import type { NextQuestionRequest, ProfileContext, PersonaContext, TurnContext } from './schemas';

type Profile = z.infer<typeof ProfileContext>;
type Persona = z.infer<typeof PersonaContext>;
type Turn = z.infer<typeof TurnContext>;

function whoLabel(turn: Turn, personaName: string, storytellerFirst: string): string {
  if (turn.who === 'ai') return personaName;
  if (turn.who === 'asker') return turn.askerLabel || 'Family';
  return storytellerFirst;
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || 'friend';
}

function contextLine(profile: Profile): string {
  const born = profile.yearBorn ? `born ${profile.yearBorn}` : 'born (year unknown)';
  const place = profile.birthplace ? ` in ${profile.birthplace}` : '';
  const bio = profile.bio ? ` ${profile.bio}` : '';
  return `Context about the storyteller: ${born}${place}.${bio}`.trim();
}

/** Map the last ~8 turns into chat messages for the model. */
export function transcriptMessages(
  transcript: Turn[],
  personaName: string,
  storytellerFirst: string,
): { role: 'assistant' | 'user'; content: string }[] {
  return transcript.slice(-8).map((t) => ({
    role: t.who === 'ai' ? 'assistant' : 'user',
    content: t.who === 'ai' ? t.text : `${whoLabel(t, personaName, storytellerFirst)}: ${t.text}`,
  }));
}

export function nextQuestionSystem(
  profile: Profile,
  persona: Persona,
  priorMemories?: { title: string; summary?: string; excerpt: string }[],
  openingAngle?: string,
): string {
  const first = firstName(profile.name);
  const lines = [
    `You are ${persona.name}, a warm, unhurried interviewer helping ${first} record their life story.`,
    `Voice/style: ${persona.promptStyle}`,
    'Ask ONE short, gentle question at a time. Build on what they just said.',
    'Never rush, never stack multiple questions, never give advice.',
    contextLine(profile),
  ];
  if (priorMemories && priorMemories.length > 0) {
    const titles = priorMemories.map((m) => `"${m.title}"`).join(', ');
    lines.push(`Memories already captured in previous sessions (do not revisit these topics): ${titles}.`);
  }
  if (openingAngle) {
    lines.push(
      `For the opening question (when the transcript is empty): ${openingAngle}`,
      'Make the question feel natural and specific to this person — weave in details from their profile or prior memories where they fit.',
    );
  }
  lines.push('Return only the question text — no preamble, no quotation marks.');
  return lines.join('\n');
}

export function suggestQuestionsSystem(profile: Profile, persona: Persona, count: number): string {
  const first = firstName(profile.name);
  return [
    `You help a family member interview ${first}, in the spirit of ${persona.name}.`,
    `Voice/style: ${persona.promptStyle}`,
    `Produce ${count} warm, family-style questions the family member could ask next,`,
    "grounded in the storyteller's most recent answer (reference the people/places they mentioned).",
    'Keep each question short and gentle.',
    contextLine(profile),
    'Respond with a JSON object: { "suggestions": string[] }.',
  ].join('\n');
}

export function extractSystem(): string {
  return [
    "Extract a single memory card from the storyteller's words about one topic.",
    'The input may contain one answer or several related answers on the same theme — treat them as one memory.',
    'Do NOT invent facts. The "excerpt" MUST be a verbatim phrase taken directly from the input.',
    'If the content is too thin to be a memory, return title: null with empty excerpt and summary.',
    'Keep title ≤ 6 words with no year. Excerpt ≤ 160 chars. Summary: 1–2 warm, specific sentences.',
  ].join('\n');
}

export function summarySystem(profile: Profile, persona: Persona): string {
  const first = firstName(profile.name);
  return [
    `You are ${persona.name}. Write ONE short, warm paragraph (2–3 sentences) reflecting on what`,
    `${first} shared in today's session — gentle and dignified, never effusive.`,
    'Do not invent details beyond the memories provided. Do not list statistics.',
    'Respond with a JSON object: { "paragraph": string }.',
  ].join('\n');
}

export type { NextQuestionRequest };
