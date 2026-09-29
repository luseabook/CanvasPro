import test from 'node:test';
import assert from 'node:assert/strict';

import { reportRendererStartupFailure } from './rendererStartupApi.js';

test('rendererStartupApi: posts renderer startup diagnostics', async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  try {
    const result = await reportRendererStartupFailure({
      reason: 'renderer-crashed',
    });
    assert.equal(result.success, true);
    assert.equal(request.url, '/api/v2/desktop/diagnostics/log-event');
    assert.equal(request.options.method, 'POST');
    assert.equal(request.options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(request.options.body), {
      reason: 'renderer-crashed',
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
