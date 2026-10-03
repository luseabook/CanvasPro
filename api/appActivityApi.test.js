import test from 'node:test';
import assert from 'node:assert/strict';

import { reportAppStartupActivity } from './appActivityApi.js';

test('appActivityApi: skips the request when the device id is missing', async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  try {
    globalThis.fetch = async () => {
      called = true;
      throw new Error('fetch should not be called');
    };

    assert.deepEqual(await reportAppStartupActivity({}), {
      success: false,
      recorded: false,
      reason: 'missing_device_id',
    });
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('appActivityApi: does not call an unavailable backend unless explicitly enabled', async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  try {
    globalThis.fetch = async () => {
      called = true;
      throw new Error('fetch should not be called');
    };

    assert.deepEqual(
      await reportAppStartupActivity({
        deviceId: 'device-1',
        appVersion: '0.4.12',
        os: 'win32',
      }),
      {
        success: false,
        recorded: false,
        reason: 'disabled',
      },
    );
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('appActivityApi: posts normalized startup activity when explicitly enabled', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  try {
    globalThis.fetch = async (url, options = {}) => {
      calls.push({ url, options });
      return new Response(JSON.stringify({ success: true, recorded: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const result = await reportAppStartupActivity({
      enabled: true,
      deviceId: ' device-1 ',
      appVersion: ' 0.4.12 ',
      os: ' win32 ',
    });

    assert.deepEqual(result, { success: true, recorded: true });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, '/api/v2/app-activity/startup');
    assert.equal(calls[0].options.method, 'POST');
    assert.equal(calls[0].options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(calls[0].options.body), {
      deviceId: 'device-1',
      appVersion: '0.4.12',
      os: 'win32',
      productCode: 'aicanvas',
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
