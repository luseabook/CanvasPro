import test from 'node:test';
import assert from 'node:assert/strict';

function makeJsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

test('free image host falls back to Telegraph when Uguu proxy upload fails', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];

  try {
    globalThis.fetch = async (target, options = {}) => {
      const url = String(target || '');
      calls.push(url);

      assert.equal(options.method, 'POST');
      assert.ok(options.body instanceof FormData);

      if (url.includes(encodeURIComponent('https://uguu.se/upload'))) {
        return makeJsonResponse({ error: 'Upload proxy error: timed out' }, 500);
      }

      if (url.includes(encodeURIComponent('https://telegra.ph/upload'))) {
        return makeJsonResponse([{ src: '/file/demo-ref.png' }]);
      }

      throw new Error(`unexpected fetch url: ${url}`);
    };

    const { uploadToFreeImageHost } = await import('./freeImageHostApi.js');
    const result = await uploadToFreeImageHost(new Blob(['image-bytes'], { type: 'image/png' }));

    assert.equal(result, 'https://telegra.ph/file/demo-ref.png');
    assert.deepEqual(calls, [
      '/api/v2/proxy/upload?apiUrl=https%3A%2F%2Fuguu.se%2Fupload',
      '/api/v2/proxy/upload?apiUrl=https%3A%2F%2Ftelegra.ph%2Fupload',
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
