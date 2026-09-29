import test from 'node:test';
import assert from 'node:assert/strict';

import { publishDirectorMobilePose } from './directorMobileClientApi.js';

test('directorMobileClientApi: posts pose data with the pairing token', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200 };
  };

  try {
    await publishDirectorMobilePose('token-1', { x: 1, y: 2 });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(calls, [
    {
      url: '/pose',
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Director-Token': 'token-1' },
        body: '{"x":1,"y":2}',
      },
    },
  ]);
});

test('directorMobileClientApi: reports expired pairing and generic failures', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: false, status: 403 });
    await assert.rejects(publishDirectorMobilePose('token-1', {}), /配对已结束/);

    globalThis.fetch = async () => ({ ok: false, status: 500 });
    await assert.rejects(publishDirectorMobilePose('token-1', {}), /发送摄像机数据失败/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
