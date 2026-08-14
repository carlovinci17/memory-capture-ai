// next-question.ts — POST /api/interview/next-question
// AI-asks mode. Streams the question text as plain text/plain deltas so the UI
// can render it progressively. Falls back to a 502 (→ client offline engine)
// if the model call fails before streaming begins.
import {
  app,
  HttpResponse,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from '@azure/functions';
import { getClient, getDeployment } from '../lib/client';
import { NextQuestionRequest } from '../lib/schemas';
import { nextQuestionSystem, transcriptMessages } from '../lib/prompts';
import { badRequest, parseBody, timeoutSignal, upstreamError, ValidationError } from '../lib/http';
import { requireSession } from '../lib/sessionToken';

// Opt this app into HTTP streaming responses (Functions Node v4).
app.setup({ enableHttpStream: true });

async function handler(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit | HttpResponse> {
  const gate = requireSession(req, 40);
  if (gate !== true) return gate;
  let body;
  try {
    body = await parseBody(req, NextQuestionRequest);
  } catch (e) {
    if (e instanceof ValidationError) return badRequest(e.message);
    throw e;
  }

  const first = body.profile.name.trim().split(/\s+/)[0] || 'friend';

  let aiStream;
  try {
    aiStream = await getClient().chat.completions.create(
      {
        model: getDeployment(),
        temperature: 0.9,
        max_tokens: 60,
        stream: true,
        messages: [
          { role: 'system', content: nextQuestionSystem(body.profile, body.persona, body.priorMemories, body.openingAngle) },
          ...transcriptMessages(body.transcript, body.persona.name, first),
        ],
      },
      { signal: timeoutSignal() },
    );
  } catch (err) {
    context.error('next-question failed', err);
    return upstreamError();
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of aiStream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        }
        controller.close();
      } catch (err) {
        context.error('next-question stream error', err);
        controller.error(err);
      }
    },
  });

  return new HttpResponse({
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    body: stream,
  });
}

app.http('next-question', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'interview/next-question',
  handler,
});
