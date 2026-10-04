import test from 'node:test';
import assert from 'node:assert/strict';
import { processInputAudios } from './audioUploadApi.js';
function makeJsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status: status,
    headers: { 'Content-Type': 'application/json' },
  });
}
async function withMockFetch(item, handler) {
  const key = globalThis.fetch;
  globalThis.fetch = item;
  try {
    return await handler();
  } finally {
    globalThis.fetch = key;
  }
}
(test('audioUploadApi: APIMART asset URL 不会重复上传', async () => {
  await withMockFetch(
    async (index) => {
      throw new Error('unexpected fetch url: ' + String(index));
    },
    async () => {
      const processInputAudios2 = await processInputAudios(['asset://seedance/avatar-audio'], 'k_apimart', {
        provider: 'apimart',
      });
      assert.deepEqual(processInputAudios2, ['asset://seedance/avatar-audio']);
    },
  );
}),
  test('audioUploadApi: APIMART 上传携带 API Key', async () => {
    await withMockFetch(
      async (result, dom = {}) => {
        const data = String(result);
        if (data === 'https://audio.example/ref.mp3')
          return new Response(new Blob(['audio'], { type: 'audio/mpeg' }), { status: 200 });
        if (data === '/api/v2/proxy/apimart-upload') {
          const options = Object.fromEntries(dom.body.entries());
          return (
            assert.equal(options.apiKey, 'k_apimart'),
            assert.equal(options.contentType, 'audio/mpeg'),
            assert.equal(options.fileExtension, 'mp3'),
            assert.equal(options.apiUrl, 'https://api.apib.ai'),
            makeJsonResponse({ cdnUrl: 'https://cdn.apimart.ai/files/ref.mp3' })
          );
        }
        throw new Error('unexpected fetch url: ' + data);
      },
      async () => {
        const processInputAudios3 = await processInputAudios(['https://audio.example/ref.mp3'], 'k_apimart', {
          provider: 'apimart',
        });
        assert.deepEqual(processInputAudios3, ['https://cdn.apimart.ai/files/ref.mp3']);
      },
    );
  }));
