import test from 'node:test';
import assert from 'node:assert/strict';

import { fetchLocalMediaPlaybackBlob } from './localMediaPlaybackApi.js';

test('localMediaPlaybackApi: returns typed empty and missing results', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(null, { status: 404 });
  };

  try {
    assert.deepEqual(await fetchLocalMediaPlaybackBlob('', { resultMode: 'typed' }), {
      status: 'empty-url',
      blob: null,
      httpStatus: 0,
    });
    assert.deepEqual(
      await fetchLocalMediaPlaybackBlob('http://local.test/missing.mp4', {
        resultMode: 'typed',
      }),
      {
        status: 'hard-missing',
        blob: null,
        httpStatus: 404,
      },
    );
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('localMediaPlaybackApi: reads bounded video blobs and enforces byte limits', async () => {
  const originalFetch = globalThis.fetch;
  const responses = [
    new Response(new Blob(['video'], { type: 'video/mp4' }), {
      status: 200,
      headers: { 'content-type': 'video/mp4', 'content-length': '5' },
    }),
    new Response(null, {
      status: 200,
      headers: { 'content-length': '11' },
    }),
  ];
  globalThis.fetch = async () => responses.shift();

  try {
    const ready = await fetchLocalMediaPlaybackBlob('http://local.test/video.mp4', {
      resultMode: 'typed',
      maxBytes: 10,
      timeout: 500,
    });
    assert.equal(ready.status, 'ready');
    assert.equal(ready.blob.size, 5);
    assert.equal(ready.blob.type, 'video/mp4');

    const overLimit = await fetchLocalMediaPlaybackBlob('http://local.test/large.mp4', {
      resultMode: 'typed',
      maxBytes: 10,
      timeout: 500,
    });
    assert.deepEqual(overLimit, {
      status: 'over-limit',
      blob: null,
      httpStatus: 0,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('localMediaPlaybackApi: reports timeouts in typed mode', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) =>
    new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), {
        once: true,
      });
    });

  try {
    const result = await fetchLocalMediaPlaybackBlob('http://local.test/slow.mp4', {
      resultMode: 'typed',
      timeout: 5,
    });
    assert.deepEqual(result, { status: 'timeout', blob: null, httpStatus: 0 });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
