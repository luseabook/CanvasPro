import test from 'node:test';
import assert from 'node:assert/strict';
const originalFetch = globalThis.fetch;
function createJsonResponse(_0x43d1fd, _0x2cdf1e, _0x17e21a = 'GET', _0x534e5d = null) {
  globalThis.fetch = async (_0x11b9de, _0x25f00b = {}) => {
    return (
      assert.equal(String(_0x11b9de), _0x2cdf1e),
      assert.equal(String(_0x25f00b?.method || 'GET'), _0x17e21a),
      typeof _0x534e5d === 'function' && _0x534e5d(_0x25f00b?.body),
      {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => _0x43d1fd,
        text: async () => JSON.stringify(_0x43d1fd),
      }
    );
  };
}
(test('dreaminaCliApi: fetch status with refresh', async () => {
  try {
    createJsonResponse({ installed: true, loggedIn: true }, '/api/v2/dreamina/status?refresh=1');
    const { fetchDreaminaCliStatusFromServer: _0x4b2310 } = await import('./dreaminaCliApi.js'),
      _0x7be289 = await _0x4b2310({ refresh: true });
    (assert.equal(_0x7be289.installed, true), assert.equal(_0x7be289.loggedIn, true));
  } finally {
    globalThis.fetch = originalFetch;
  }
}),
  test('dreaminaCliApi: start headless login posts mode only', async () => {
    try {
      createJsonResponse({ success: true }, '/api/v2/dreamina/login', 'POST', (_0x2a4ba4) => {
        const _0x1a2260 = JSON.parse(String(_0x2a4ba4 || '{}'));
        (assert.equal(_0x1a2260.mode, 'headless'), assert.equal('commandPath' in _0x1a2260, false));
      });
      const { startDreaminaHeadlessLoginFromServer: _0x58095b } = await import('./dreaminaCliApi.js'),
        _0x5f5c30 = await _0x58095b();
      assert.equal(_0x5f5c30.success, true);
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
        (_0x1370fd) => {
          const _0x4119a8 = JSON.parse(String(_0x1370fd || '{}'));
          (assert.equal(_0x4119a8.mode, 'web'), assert.equal(_0x4119a8.force, true));
        },
      );
      const { startDreaminaWebLoginFromServer: _0x332495 } = await import('./dreaminaCliApi.js'),
        _0x2c5223 = await _0x332495({ force: true });
      (assert.equal(_0x2c5223.success, true), assert.equal(_0x2c5223.runtime.loginMode, 'web'));
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
        (_0xb2a9dd) => {
          const _0x582f32 = JSON.parse(String(_0xb2a9dd || '{}'));
          (assert.equal(typeof _0x582f32.loginResponse, 'object'),
            assert.equal(_0x582f32.loginResponse.submit_id, 'abc123'));
        },
      );
      const { importDreaminaLoginResponseFromServer: _0x8edcea } = await import('./dreaminaCliApi.js'),
        _0x33622f = await _0x8edcea({ submit_id: 'abc123', ok: true });
      (assert.equal(_0x33622f.success, true), assert.equal(_0x33622f.runtime.phase, 'starting'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaCliApi: logout posts to logout endpoint', async () => {
    try {
      createJsonResponse({ success: true }, '/api/v2/dreamina/logout', 'POST');
      const { logoutDreaminaFromServer: _0x47f9c8 } = await import('./dreaminaCliApi.js'),
        _0x33b5ba = await _0x47f9c8();
      assert.equal(_0x33b5ba.success, true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  }));
