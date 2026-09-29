import test from 'node:test';
import assert from 'node:assert/strict';

import {
  closeDirectorCameraPairing,
  createDirectorCameraPairing,
  readDirectorCameraPose,
} from './directorCameraApi.js';

test('directorCameraApi: sends pairing, read, and close actions', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  try {
    await createDirectorCameraPairing();
    await readDirectorCameraPose('read-token');
    await closeDirectorCameraPairing('close-token');

    assert.equal(calls.length, 3);
    assert.ok(calls.every(({ url }) => url === '/api/v2/storyboard3d/director-camera'));
    assert.deepEqual(JSON.parse(calls[0].options.body), {
      action: 'create',
      enableLan: true,
    });
    assert.deepEqual(JSON.parse(calls[1].options.body), {
      action: 'read',
      readToken: 'read-token',
    });
    assert.deepEqual(JSON.parse(calls[2].options.body), {
      action: 'close',
      readToken: 'close-token',
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
