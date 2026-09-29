import test from 'node:test';
import assert from 'node:assert/strict';

import { createTextResponseDeadline, readTextResponseBody } from './textResponseDeadline.js';

test('textResponseDeadline: cancels the reader and reports the timeout phase', async () => {
  let cancels = 0;
  const deadline = createTextResponseDeadline(
    {
      cancel: async () => {
        cancels += 1;
      },
    },
    { firstChunkTimeoutMs: 5, timeoutMs: 50 },
  );

  await new Promise((resolve) => setTimeout(resolve, 12));
  assert.throws(
    () => deadline.check(),
    (error) => error.type === 'TIMEOUT' && error.timeoutPhase === '首次响应',
  );
  assert.equal(cancels, 1);
  deadline.dispose();
});

test('textResponseDeadline: resets idle activity and rejects when aborted', async () => {
  let cancels = 0;
  const abortController = new AbortController();
  const deadline = createTextResponseDeadline(
    {
      cancel: async () => {
        cancels += 1;
      },
    },
    { idleTimeoutMs: 5, signal: abortController.signal },
  );

  deadline.activity();
  await new Promise((resolve) => setTimeout(resolve, 12));
  assert.throws(
    () => deadline.check(),
    (error) => error.type === 'TIMEOUT' && error.timeoutPhase === '输出停滞',
  );
  assert.equal(cancels, 1);
  deadline.dispose();

  const aborted = new AbortController();
  aborted.abort();
  const abortedDeadline = createTextResponseDeadline({ cancel: async () => {} }, { signal: aborted.signal });
  assert.throws(
    () => abortedDeadline.check(),
    (error) => error.name === 'AbortError',
  );
  abortedDeadline.dispose();
});

test('textResponseDeadline: reads streamed UTF-8 chunks and exposes partial text on failure', async () => {
  const response = new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('你'));
        controller.enqueue(new TextEncoder().encode('好'));
        controller.close();
      },
    }),
  );

  assert.equal(await readTextResponseBody(response), '你好');

  const failing = {
    body: {
      getReader() {
        let first = true;
        return {
          async read() {
            if (first) {
              first = false;
              return { value: new TextEncoder().encode('partial'), done: false };
            }
            throw new Error('stream failed');
          },
          async cancel() {},
          releaseLock() {},
        };
      },
    },
  };
  await assert.rejects(readTextResponseBody(failing), (error) => error.partialText === 'partial');
});
