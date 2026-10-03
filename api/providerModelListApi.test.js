import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchProviderModelList } from './providerModelListApi.js';

function withFetch(handler, run) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return handler(String(url), init);
  };
  return Promise.resolve()
    .then(run)
    .finally(() => {
      globalThis.fetch = original;
    })
    .then(() => calls);
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

test('providerModelListApi: fetches the vendor list through the local proxy', async () => {
  let seen = null;
  const calls = await withFetch(
    (url, init) => {
      seen = { url, init };
      return jsonResponse({ data: [{ id: 'agnes-3.0-flash' }, { id: 'agnes-image-2.5-flash' }] });
    },
    async () => {
      const result = await fetchProviderModelList({
        providerId: 'agnes',
        apiUrl: 'https://apihub.agnes-ai.com',
        apiKey: 'sk-test',
      });
      assert.equal(result.success, true);
      assert.deepEqual(
        result.models.map((entry) => entry.id),
        ['agnes-3.0-flash', 'agnes-image-2.5-flash'],
      );
    },
  );
  assert.equal(calls.length, 1);
  assert.match(seen.url, /^\/api\/v2\/proxy\/task\?apiUrl=/);
  assert.equal(
    decodeURIComponent(seen.url.split('apiUrl=')[1]),
    'https://apihub.agnes-ai.com/v1/models',
  );
  assert.equal(seen.init.headers.Authorization, 'Bearer sk-test');
});

test('providerModelListApi: refuses to call without a key', async () => {
  const calls = await withFetch(
    () => jsonResponse({ data: [] }),
    async () => {
      const result = await fetchProviderModelList({
        providerId: 'agnes-domestic',
        apiUrl: 'https://api.agnes-ai.cn/v1',
        apiKey: '   ',
      });
      assert.equal(result.success, false);
      assert.equal(result.error, 'MODEL_LIST_API_KEY_MISSING');
      assert.equal(result.modelsUrl, 'https://api.agnes-ai.cn/v1/models');
    },
  );
  assert.equal(calls.length, 0);
});

test('providerModelListApi: surfaces proxy failures', async () => {
  await withFetch(
    () => jsonResponse({ error: { message: 'invalid api key' } }, 401),
    async () => {
      const result = await fetchProviderModelList({
        providerId: 'agnes-domestic',
        apiUrl: 'https://api.agnes-ai.cn',
        apiKey: 'sk-bad',
      });
      assert.equal(result.success, false);
      assert.equal(result.status, 401);
      assert.match(result.error, /401/);
    },
  );
});

test('providerModelListApi: rejects an unusable base url', async () => {
  const result = await fetchProviderModelList({
    providerId: 'agnes',
    apiUrl: 'https://example.com/v1beta/models/gemini:generateContent',
    apiKey: 'sk-test',
  });
  assert.equal(result.success, false);
  assert.equal(result.error, 'MODEL_LIST_URL_UNSUPPORTED');
});
