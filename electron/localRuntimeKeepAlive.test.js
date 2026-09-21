import assert from 'node:assert/strict';
import test from 'node:test';
import { createLocalRuntimeKeepAliveController } from './localRuntimeKeepAlive.js';
function createWindowStub(_0x218a0f = {}) {
  return { isDestroyed: () => false, isMinimized: () => false, isVisible: () => true, ..._0x218a0f };
}
(test('local runtime keep-alive pings visible Electron windows and uses app suspension blocker', async () => {
  const _0x863e40 = [],
    _0x2411d9 = [],
    _0x553da0 = createLocalRuntimeKeepAliveController({
      getWindow: () => createWindowStub(),
      intervalMs: 0xea60,
      requestLocalJson: async (_0x2c3459, _0x34f4a7) => {
        _0x863e40.push({ pathname: _0x2c3459, timeoutMs: _0x34f4a7 });
      },
      setPowerSaveBlocker: (..._0x328b23) => _0x2411d9.push(_0x328b23),
    });
  (await _0x553da0.start('focus'),
    _0x553da0.stop(),
    assert.deepEqual(_0x863e40, [{ pathname: '/api/v2/runtime/info', timeoutMs: 0x3e8 }]),
    assert.deepEqual(_0x2411d9[0], ['local-runtime-keepalive', true, 'prevent-app-suspension']),
    assert.deepEqual(_0x2411d9.at(-1), ['local-runtime-keepalive', false]));
}),
  test('local runtime keep-alive skips hidden or minimized windows', async () => {
    const _0x4751e7 = [],
      _0x43fe91 = [],
      _0x5f2cb5 = createLocalRuntimeKeepAliveController({
        getWindow: () => createWindowStub({ isMinimized: () => true }),
        requestLocalJson: async () => _0x4751e7.push('ping'),
        setPowerSaveBlocker: (..._0x4fe020) => _0x43fe91.push(_0x4fe020),
      }),
      _0x337e2c = await _0x5f2cb5.start('minimized');
    (assert.equal(_0x337e2c, false),
      assert.deepEqual(_0x4751e7, []),
      assert.deepEqual(_0x43fe91, [['local-runtime-keepalive', false]]));
  }),
  test('local runtime keep-alive logs failed warm pings without throwing', async () => {
    const _0x364e33 = [],
      _0x577e85 = createLocalRuntimeKeepAliveController({
        getWindow: () => createWindowStub(),
        intervalMs: 0xea60,
        requestLocalJson: async () => {
          throw new Error('offline');
        },
        logDiagnosticEvent: (_0x35bc9c) => _0x364e33.push(_0x35bc9c),
      }),
      _0x11e943 = await _0x577e85.start('ready-to-show');
    (_0x577e85.stop(),
      assert.equal(_0x11e943, false),
      assert.equal(_0x364e33.length, 1),
      assert.equal(_0x364e33[0].type, 'local_runtime.keep_alive_failed'),
      assert.deepEqual(_0x364e33[0].context, { reason: 'ready-to-show' }));
  }));
