import test from 'node:test';
import assert from 'node:assert/strict';
import { requester } from './requester.js';
(test('requester: retryable network errors retry before success', async () => {
  const _0x2c69c1 = globalThis.fetch;
  let _0x357522 = 0;
  try {
    globalThis.fetch = async () => {
      _0x357522++;
      if (_0x357522 < 3) throw new Error('Failed to fetch');
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true }),
        text: async () => JSON.stringify({ success: true }),
      };
    };
    const _0xd1044f = await requester({
      url: 'https://example.test/api',
      provider: 'grsai',
      buildUrl: false,
      retries: 2,
      retryDelay: 1,
    });
    (assert.deepEqual(_0xd1044f, { success: true }), assert.equal(_0x357522, 3));
  } finally {
    globalThis.fetch = _0x2c69c1;
  }
}),
  test('requester: aborted external signals are not retried', async () => {
    const _0x57e533 = globalThis.fetch,
      _0x16fbfd = new AbortController();
    let _0x492095 = 0;
    try {
      ((globalThis.fetch = async () => {
        (_0x492095++, _0x16fbfd.abort());
        throw new DOMException('The operation was aborted.', 'AbortError');
      }),
        await assert.rejects(
          requester({
            url: 'https://example.test/api',
            provider: 'grsai',
            buildUrl: false,
            signal: _0x16fbfd.signal,
            retries: 2,
            retryDelay: 1,
          }),
          (_0x250ded) => _0x250ded?.name === 'ApiError' && _0x250ded?.type === 'TIMEOUT',
        ),
        assert.equal(_0x492095, 1));
    } finally {
      globalThis.fetch = _0x57e533;
    }
  }),
  test('requester: local relative requests carry stable device id header', async () => {
    const _0x3ce608 = globalThis.fetch,
      _0x430f3f = globalThis.window;
    let _0x10843b = null;
    try {
      ((globalThis.window = { __aicDeviceId: 'device-local-1' }),
        (globalThis.fetch = async (_0x40a260, _0x5d09a9) => {
          return (
            (_0x10843b = _0x5d09a9),
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
        assert.equal(_0x10843b.headers['X-AIC-Device-Id'], 'device-local-1'));
    } finally {
      ((globalThis.fetch = _0x3ce608), (globalThis.window = _0x430f3f));
    }
  }));
