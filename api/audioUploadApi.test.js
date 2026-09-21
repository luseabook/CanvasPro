import test from 'node:test';
import assert from 'node:assert/strict';
import { processInputAudios } from './audioUploadApi.js';
function makeJsonResponse(_0x1d6145, _0x9cbca8 = 200) {
  return new Response(JSON.stringify(_0x1d6145), {
    status: _0x9cbca8,
    headers: { 'Content-Type': 'application/json' },
  });
}
async function withMockFetch(_0x58d3cd, _0x5b3912) {
  const _0x309482 = globalThis.fetch;
  globalThis.fetch = _0x58d3cd;
  try {
    return await _0x5b3912();
  } finally {
    globalThis.fetch = _0x309482;
  }
}
(test('audioUploadApi: APIMART asset URL 不会重复上传', async () => {
  await withMockFetch(
    async (_0x1717a7) => {
      throw new Error('unexpected fetch url: ' + String(_0x1717a7));
    },
    async () => {
      const _0x249d08 = await processInputAudios(['asset://seedance/avatar-audio'], 'k_apimart', {
        provider: 'apimart',
      });
      assert.deepEqual(_0x249d08, ['asset://seedance/avatar-audio']);
    },
  );
}),
  test('audioUploadApi: APIMART 上传携带 API Key', async () => {
    await withMockFetch(
      async (_0x301fe0, _0x3f63d6 = {}) => {
        const _0x31141f = String(_0x301fe0);
        if (_0x31141f === 'https://audio.example/ref.mp3')
          return new Response(new Blob(['audio'], { type: 'audio/mpeg' }), { status: 200 });
        if (_0x31141f === '/api/v2/proxy/apimart-upload') {
          const _0xe75de = Object.fromEntries(_0x3f63d6.body.entries());
          return (
            assert.equal(_0xe75de.apiKey, 'k_apimart'),
            assert.equal(_0xe75de.contentType, 'audio/mpeg'),
            assert.equal(_0xe75de.fileExtension, 'mp3'),
            assert.equal(_0xe75de.apiUrl, 'https://api.apib.ai'),
            makeJsonResponse({ cdnUrl: 'https://cdn.apimart.ai/files/ref.mp3' })
          );
        }
        throw new Error('unexpected fetch url: ' + _0x31141f);
      },
      async () => {
        const _0xeee17 = await processInputAudios(['https://audio.example/ref.mp3'], 'k_apimart', {
          provider: 'apimart',
        });
        assert.deepEqual(_0xeee17, ['https://cdn.apimart.ai/files/ref.mp3']);
      },
    );
  }));
