// summary.ts — POST /api/interview/summary
// One warm, AI-written paragraph reflecting on the session. Stats stay in code.
import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { z } from 'zod';
import { getClient, getDeployment } from '../lib/client';
import { SummaryRequest } from '../lib/schemas';
import { summarySystem } from '../lib/prompts';
import { badRequest, json, parseBody, timeoutSignal, upstreamError, ValidationError } from '../lib/http';
import { requireSession } from '../lib/sessionToken';

const ResponseShape = z.object({ paragraph: z.string().default('') });

async function handler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const gate = requireSession(req, 40);
  if (gate !== true) return gate;
  let body;
  try {
    body = await parseBody(req, SummaryRequest);
  } catch (e) {
    if (e instanceof ValidationError) return badRequest(e.message);
    throw e;
  }

  const memoryList = body.session.memories
    .map((m) => `• ${m.title}: “${m.excerpt}”`)
    .join('\n');

  try {
    const completion = await getClient().chat.completions.create(
      {
        model: getDeployment(),
        temperature: 0.6,
        max_tokens: 160,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: summarySystem(body.profile, body.persona) },
          {
            role: 'user',
            content: memoryList
              ? `Memories shared today:\n${memoryList}`
              : 'No specific memories were captured this session.',
          },
        ],
      },
      { signal: timeoutSignal() },
    );

    const content = completion.choices[0]?.message?.content ?? '{}';
    const parsed = ResponseShape.safeParse(JSON.parse(content));
    if (!parsed.success) return upstreamError('Malformed summary.');
    return json(200, { paragraph: parsed.data.paragraph });
  } catch (err) {
    context.error('summary failed', err);
    return upstreamError();
  }
}

app.http('summary', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'interview/summary',
  handler,
});
