// extract.ts — POST /api/interview/extract
// Structured memory extraction (Scope §7.3). Temperature 0 for determinism.
// The model's excerpt is re-validated server-side to be verbatim.
import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { getClient, getDeployment } from '../lib/client';
import { EXTRACTION_JSON_SCHEMA, ExtractRequest, ExtractionResult } from '../lib/schemas';
import { extractSystem } from '../lib/prompts';
import { verbatimExcerpt } from '../lib/verbatim';
import { badRequest, json, parseBody, timeoutSignal, tooManyRequests, upstreamError, ValidationError } from '../lib/http';
import { allowRequest } from '../lib/rateLimit';

async function handler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (!allowRequest(req, 40)) return tooManyRequests();
  let body;
  try {
    body = await parseBody(req, ExtractRequest);
  } catch (e) {
    if (e instanceof ValidationError) return badRequest(e.message);
    throw e;
  }

  try {
    const completion = await getClient().chat.completions.create(
      {
        model: getDeployment(),
        temperature: 0,
        max_tokens: 500,
        response_format: { type: 'json_schema', json_schema: EXTRACTION_JSON_SCHEMA },
        messages: [
          { role: 'system', content: extractSystem() },
          { role: 'user', content: body.answerText },
        ],
      },
      { signal: timeoutSignal() },
    );

    const content = completion.choices[0]?.message?.content ?? '{}';
    const parsed = ExtractionResult.safeParse(JSON.parse(content));
    if (!parsed.success) return upstreamError('Malformed extraction.');

    // Enforce verbatim wording regardless of what the model returned.
    const result = {
      ...parsed.data,
      excerpt: parsed.data.title ? verbatimExcerpt(body.answerText, parsed.data.excerpt) : '',
    };
    return json(200, result);
  } catch (err) {
    context.error('extract failed', err);
    return upstreamError();
  }
}

app.http('extract', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'interview/extract',
  handler,
});
