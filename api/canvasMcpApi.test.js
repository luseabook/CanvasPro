import test from 'node:test';
import assert from 'node:assert/strict';

import { requestCanvasMcp } from './canvasMcpApi.js';

test('canvasMcpApi: posts control requests with the caller signal', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  const controller = new AbortController();
  try {
    globalThis.fetch = async (url, options = {}) => {
      calls.push({ url, options });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const result = await requestCanvasMcp({ action: 'status' }, controller.signal);

    assert.deepEqual(result, { success: true });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, '/api/v2/canvas-mcp/control');
    assert.equal(calls[0].options.method, 'POST');
    assert.equal(calls[0].options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(calls[0].options.body), { action: 'status' });
    assert.equal(calls[0].options.signal.aborted, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
