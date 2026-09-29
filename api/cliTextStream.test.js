import test from 'node:test';
import assert from 'node:assert/strict';

import { requestCliTextStream } from './cliTextStream.js';

function streamResponse(events) {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      for (const event of events) controller.enqueue(encoder.encode(event));
      controller.close();
    },
  });
  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'text/event-stream; charset=utf-8' },
  });
}

test('cliTextStream: posts a streaming request and forwards visible text', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return streamResponse([
      'data: {"choices":[{"index":0,"delta":{"content":"hel"}}]}\n\n',
      'data: {"choices":[{"index":0,"delta":{"content":"lo"}}]}\n\n',
      'data: {"choices":[{"index":0,"finish_reason":"stop"}]}\n\n',
      'data: [DONE]\n\n',
    ]);
  };

  try {
    const seen = [];
    const result = await requestCliTextStream(
      { provider: 'provider-1', model: 'model-1', prompt: 'hello' },
      { onText: (text) => seen.push(text), timeoutMs: 50 },
    );

    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, '/api/v2/cli-providers/generate-text');
    assert.equal(calls[0].options.method, 'POST');
    assert.equal(calls[0].options.headers.Accept, 'text/event-stream');
    assert.deepEqual(JSON.parse(calls[0].options.body), {
      provider: 'provider-1',
      model: 'model-1',
      prompt: 'hello',
      stream: true,
    });
    assert.deepEqual(result, { text: 'hello', provider: 'provider-1' });
    assert.deepEqual(seen, ['hel', 'hello']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('cliTextStream: surfaces a non-stream error response', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: { message: 'CLI unavailable' } }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });

  try {
    await assert.rejects(
      () => requestCliTextStream({ provider: 'p' }, { onText() {}, timeoutMs: 50 }),
      /CLI unavailable/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('cliTextStream: reports its own timeout without masking caller aborts', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) =>
    new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), {
        once: true,
      });
    });

  try {
    await assert.rejects(
      () => requestCliTextStream({ provider: 'p' }, { onText() {}, timeoutMs: 5 }),
      (error) => error instanceof Error && error.message.includes('CLI'),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
