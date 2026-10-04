import test from 'node:test';
import assert from 'node:assert/strict';
const originalFetch = globalThis.fetch;
function createJsonResponse(value, item, key = 'GET', handler = null) {
  globalThis.fetch = async (index, dom = {}) => {
    return (
      assert.equal(String(index), item),
      assert.equal(String(dom?.method || 'GET'), key),
      typeof handler === 'function' && handler(dom?.body),
      {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => value,
        text: async () => JSON.stringify(value),
      }
    );
  };
}
(test('dreaminaCliApi: fetch status with refresh', async () => {
  try {
    createJsonResponse({ installed: true, loggedIn: true }, '/api/v2/dreamina/status?refresh=1');
    const { fetchDreaminaCliStatusFromServer: fetchDreaminaCliStatusFromServer } =
        await import('./dreaminaCliApi.js'),
      result = await fetchDreaminaCliStatusFromServer({ refresh: true });
    (assert.equal(result.installed, true), assert.equal(result.loggedIn, true));
  } finally {
    globalThis.fetch = originalFetch;
  }
}),
  test('dreaminaCliApi: start headless login posts mode only', async () => {
    try {
      createJsonResponse({ success: true }, '/api/v2/dreamina/login', 'POST', (data) => {
        const options = JSON.parse(String(data || '{}'));
        (assert.equal(options.mode, 'headless'), assert.equal('commandPath' in options, false));
      });
      const { startDreaminaHeadlessLoginFromServer: startDreaminaHeadlessLoginFromServer } =
          await import('./dreaminaCliApi.js'),
        response = await startDreaminaHeadlessLoginFromServer();
      assert.equal(response.success, true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaCliApi: start web login posts web mode and force flag', async () => {
    try {
      createJsonResponse(
        { success: true, runtime: { loginMode: 'web' } },
        '/api/v2/dreamina/login/web',
        'POST',
        (target) => {
          const source = JSON.parse(String(target || '{}'));
          (assert.equal(source.mode, 'web'), assert.equal(source.force, true));
        },
      );
      const { startDreaminaWebLoginFromServer: startDreaminaWebLoginFromServer } =
          await import('./dreaminaCliApi.js'),
        response2 = await startDreaminaWebLoginFromServer({ force: true });
      (assert.equal(response2.success, true), assert.equal(response2.runtime.loginMode, 'web'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaCliApi: import login response posts JSON payload', async () => {
    try {
      createJsonResponse(
        { success: true, runtime: { phase: 'starting' } },
        '/api/v2/dreamina/login/import',
        'POST',
        (next) => {
          const current = JSON.parse(String(next || '{}'));
          (assert.equal(typeof current.loginResponse, 'object'),
            assert.equal(current.loginResponse.submit_id, 'abc123'));
        },
      );
      const { importDreaminaLoginResponseFromServer: importDreaminaLoginResponseFromServer } =
          await import('./dreaminaCliApi.js'),
        response3 = await importDreaminaLoginResponseFromServer({ submit_id: 'abc123', ok: true });
      (assert.equal(response3.success, true), assert.equal(response3.runtime.phase, 'starting'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaCliApi: logout posts to logout endpoint', async () => {
    try {
      createJsonResponse({ success: true }, '/api/v2/dreamina/logout', 'POST');
      const { logoutDreaminaFromServer: logoutDreaminaFromServer } = await import('./dreaminaCliApi.js'),
        response4 = await logoutDreaminaFromServer();
      assert.equal(response4.success, true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  }));
