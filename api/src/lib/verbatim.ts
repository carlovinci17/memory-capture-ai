// verbatim.ts — server-side enforcement of Principle #3 ("their words, kept
// exactly"). Mirrors src/lib/ai/verbatim.ts. The model is never trusted to
// return the storyteller's words unaltered: a candidate excerpt is accepted
// only if it is genuinely a substring of the answer, else we code-trim.
const MAX = 160;

function trim(answer: string): string {
  const a = answer.trim();
  return a.length > MAX ? a.slice(0, MAX - 2).trim() + '…' : a;
}

export function verbatimExcerpt(answer: string, candidate?: string | null): string {
  if (candidate) {
    const core = candidate.replace(/…$/, '').trim();
    if (core && answer.includes(core)) {
      return candidate.trim().length > MAX ? trim(candidate) : candidate.trim();
    }
  }
  return trim(answer);
}
