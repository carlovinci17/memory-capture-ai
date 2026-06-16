// suggest-questions.ts — POST /api/interview/suggest-questions
// Manual mode: warm, family-style follow-ups grounded in the latest answer.
import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { z } from 'zod';
import { getClient, getDeployment } from '../lib/client';
import { SuggestQuestionsRequest } from '../lib/schemas';
import { suggestQuestionsSystem, transcriptMessages } from '../lib/prompts';
import { badRequest, json, parseBody, timeoutSignal, tooManyRequests, upstreamError, ValidationError } from '../lib/http';
import { allowRequest } from '../lib/rateLimit';

const ResponseShape = z.object({ suggestions: z.array(z.string()).default([]) });

async function handler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (!allowRequest(req, 40)) return tooManyRequests();
  let body;
  try {
    body = await parseBody(req, SuggestQuestionsRequest);
  } catch (e) {
    if (e instanceof ValidationError) return badRequest(e.message);
    throw e;
  }

  const first = body.profile.name.trim().split(/\s+/)[0] || 'friend';
  try {
    const completion = await getClient().chat.completions.create(
      {
        model: getDeployment(),
        temperature: 0.7,
        max_tokens: 150,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: suggestQuestionsSystem(body.profile, body.persona, body.count) },
          ...transcriptMessages(body.transcript, body.persona.name, first),
        ],
      },
      { signal: timeoutSignal() },
    );

    const content = completion.choices[0]?.message?.content ?? '{}';
    const parsed = ResponseShape.safeParse(JSON.parse(content));
    if (!parsed.success) return upstreamError('Malformed suggestions.');
    return json(200, { suggestions: parsed.data.suggestions.slice(0, body.count) });
  } catch (err) {
    context.error('suggest-questions failed', err);
    return upstreamError();
  }
}

app.http('suggest-questions', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'interview/suggest-questions',
  handler,
});
