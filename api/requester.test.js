import test from 'node:test';
import assert from 'node:assert/strict';
import { requester } from './requester.js';
(test('requester: retryable network errors retry before success', async () => {
  const value = globalThis.fetch;
  let count = 0;
  try {
    globalThis.fetch = async () => {
      count++;
      if (count < 3) throw new Error('Failed to fetch');
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true }),
        text: async () => JSON.stringify({ success: true }),
      };
    };
    const requester2 = await requester({
      url: 'https://example.test/api',
      provider: 'grsai',
      buildUrl: false,
      retries: 2,
      retryDelay: 1,
    });
    (assert.deepEqual(requester2, { success: true }), assert.equal(count, 3));
  } finally {
    globalThis.fetch = value;
  }
}),
  test('requester: aborted external signals are not retried', async () => {
    const item = globalThis.fetch,
      signal = new AbortController();
    let key = 0;
    try {
      ((globalThis.fetch = async () => {
        (key++, signal.abort());
        throw new DOMException('The operation was aborted.', 'AbortError');
      }),
        await assert.rejects(
          requester({
            url: 'https://example.test/api',
            provider: 'grsai',
            buildUrl: false,
            signal: signal.signal,
            retries: 2,
            retryDelay: 1,
          }),
          (error) => error?.name === 'ApiError' && error?.type === 'TIMEOUT',
        ),
        assert.equal(key, 1));
    } finally {
      globalThis.fetch = item;
    }
  }),
  test('requester: local relative requests carry stable device id header', async () => {
    const index = globalThis.fetch,
      result = globalThis.window;
    let response = null;
    try {
      ((globalThis.window = { __aicDeviceId: 'device-local-1' }),
        (globalThis.fetch = async (data, options) => {
          return (
            (response = options),
            {
              ok: true,
              status: 200,
              headers: { get: () => 'application/json' },
              json: async () => ({ success: true }),
              text: async () => JSON.stringify({ success: true }),
            }
          );
        }),
        await requester({ url: '/api/v2/subscription/status', provider: 'local' }),
        assert.equal(response.headers['X-AIC-Device-Id'], 'device-local-1'));
    } finally {
      ((globalThis.fetch = index), (globalThis.window = result));
    }
  }));
