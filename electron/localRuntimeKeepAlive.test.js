import assert from 'node:assert/strict';
import test from 'node:test';
import { createLocalRuntimeKeepAliveController } from './localRuntimeKeepAlive.js';
function createWindowStub(args = {}) {
  return { isDestroyed: () => false, isMinimized: () => false, isVisible: () => true, ...args };
}
(test('local runtime keep-alive pings visible Electron windows and uses app suspension blocker', async () => {
  const list = [],
    list2 = [],
    localRuntimeKeepAliveController = createLocalRuntimeKeepAliveController({
      getWindow: () => createWindowStub(),
      intervalMs: 0xea60,
      requestLocalJson: async (pathname, timeoutMs) => {
        list.push({ pathname: pathname, timeoutMs: timeoutMs });
      },
      setPowerSaveBlocker: (...args2) => list2.push(args2),
    });
  (await localRuntimeKeepAliveController.start('focus'),
    localRuntimeKeepAliveController.stop(),
    assert.deepEqual(list, [{ pathname: '/api/v2/runtime/info', timeoutMs: 0x3e8 }]),
    assert.deepEqual(list2[0], ['local-runtime-keepalive', true, 'prevent-app-suspension']),
    assert.deepEqual(list2.at(-1), ['local-runtime-keepalive', false]));
}),
  test('local runtime keep-alive skips hidden or minimized windows', async () => {
    const list3 = [],
      list4 = [],
      localRuntimeKeepAliveController2 = createLocalRuntimeKeepAliveController({
        getWindow: () => createWindowStub({ isMinimized: () => true }),
        requestLocalJson: async () => list3.push('ping'),
        setPowerSaveBlocker: (...args3) => list4.push(args3),
      }),
      value = await localRuntimeKeepAliveController2.start('minimized');
    (assert.equal(value, false),
      assert.deepEqual(list3, []),
      assert.deepEqual(list4, [['local-runtime-keepalive', false]]));
  }),
  test('local runtime keep-alive logs failed warm pings without throwing', async () => {
    const list5 = [],
      localRuntimeKeepAliveController3 = createLocalRuntimeKeepAliveController({
        getWindow: () => createWindowStub(),
        intervalMs: 0xea60,
        requestLocalJson: async () => {
          throw new Error('offline');
        },
        logDiagnosticEvent: (item) => list5.push(item),
      }),
      key = await localRuntimeKeepAliveController3.start('ready-to-show');
    (localRuntimeKeepAliveController3.stop(),
      assert.equal(key, false),
      assert.equal(list5.length, 1),
      assert.equal(list5[0].type, 'local_runtime.keep_alive_failed'),
      assert.deepEqual(list5[0].context, { reason: 'ready-to-show' }));
  }));
