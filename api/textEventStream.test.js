import test from 'node:test';
import assert from 'node:assert/strict';

import {
  enableTextRequestStreaming,
  readTextEventStream,
  shouldRetryWithoutTextStreaming,
  visibleTextStreamContent,
} from './textEventStream.js';

function createStream(chunks) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

test('textEventStream: hides thinking text and enables supported streaming transports', () => {
  assert.equal(visibleTextStreamContent('a<think>hidden</think>\nb'), 'ab');
  assert.equal(visibleTextStreamContent('answer<thin'), 'answer');

  assert.deepEqual(
    enableTextRequestStreaming(
      { url: 'https://api.test/v1/responses', body: { input: ['hello'] } },
      () => {},
    ),
    {
      url: 'https://api.test/v1/responses',
      body: { input: ['hello'], stream: true },
    },
  );

  const gemini = enableTextRequestStreaming(
    {
      isProxy: true,
      body: {
        apiUrl: 'https://generativelanguage.test/v1/models/model:generateContent?key=1',
        contents: [],
      },
    },
    () => {},
  );
  assert.match(gemini.body.apiUrl, /:streamGenerateContent/);
  assert.match(gemini.body.apiUrl, /[?&]alt=sse/);
  assert.equal(
    shouldRetryWithoutTextStreaming({ body: { stream: true } }, 400, 'streaming unsupported'),
    true,
  );
});

test('textEventStream: reads OpenAI SSE chunks and reports incremental text', async () => {
  const stream = createStream([
    `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: 'Hel' } }] })}\n\n`,
    `data: ${JSON.stringify({
      choices: [{ index: 0, delta: { content: 'lo' }, finish_reason: 'stop' }],
    })}\n\n`,
  ]);
  const updates = [];

  const result = await readTextEventStream({ body: stream }, { onText: (text) => updates.push(text) });

  assert.deepEqual(result, { text: 'Hello', finishReason: 'stop', finalResponse: null });
  assert.deepEqual(updates, ['Hel', 'Hello']);
});

test('textEventStream: surfaces stream errors with partial output', async () => {
  const stream = createStream([
    `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: 'partial' } }] })}\n\n`,
    `data: ${JSON.stringify({ error: { message: 'stream failed' } })}\n\n`,
  ]);

  await assert.rejects(
    () => readTextEventStream({ body: stream }),
    (error) => error.message === 'stream failed' && error.partialText === 'partial',
  );
});
