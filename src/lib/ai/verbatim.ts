// verbatim.ts — enforce Principle #3 ("their words, kept exactly").
// Never trust a model (or any source) to return the storyteller's words
// unaltered. We validate the candidate excerpt is genuinely a substring of the
// answer; if not, we fall back to a code-based verbatim trim of the answer.
const MAX = 160;

function trim(answer: string): string {
  const a = answer.trim();
  return a.length > MAX ? a.slice(0, MAX - 2).trim() + '…' : a;
}

/**
 * Returns a guaranteed-verbatim excerpt. `candidate` is accepted only if it is
 * a substring of `answer` (ignoring surrounding whitespace and a trailing
 * ellipsis); otherwise the answer itself is trimmed.
 */
export function verbatimExcerpt(answer: string, candidate?: string | null): string {
  if (candidate) {
    const core = candidate.replace(/…$/, '').trim();
    if (core && answer.includes(core)) {
      return candidate.trim().length > MAX ? trim(candidate) : candidate.trim();
    }
  }
  return trim(answer);
}
