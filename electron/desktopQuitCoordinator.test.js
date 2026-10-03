import test from 'node:test';
import assert from 'node:assert/strict';
import { createDesktopQuitCoordinator } from './desktopQuitCoordinator.js';

function fixture(over = {}) {
  const calls = [];
  let window = { isDestroyed: () => false, close: () => calls.push('close') };
  const coordinator = createDesktopQuitCoordinator({
    platform: 'platform' in over ? over.platform : 'win32',
    app: { quit: () => calls.push('quit') }, getMainWindow: () => window,
    beginShutdown: () => calls.push('shutdown'), cleanup: () => calls.push('cleanup'),
  });
  return { calls, coordinator, closed() { window = null; coordinator.mainWindowClosed(); } };
}
test('quit never tears down backend or hidden windows before main close is approved', () => {
  const f = fixture();
  f.coordinator.beforeQuit({ preventDefault: () => f.calls.push('prevent') });
  assert.deepEqual(f.calls, ['prevent', 'close']);
  f.coordinator.cancelQuit();
  assert.equal(f.coordinator.isQuitting(), false);
  f.coordinator.beforeQuit({ preventDefault() {} });
  f.closed();
  assert.deepEqual(f.calls, ['prevent', 'close', 'close', 'shutdown', 'cleanup', 'quit']);
  f.coordinator.willQuit();
  assert.equal(f.calls.filter(x => x === 'cleanup').length, 1);
});
test('Windows main-window close releases hidden windows before app.quit', () => {
  const f = fixture(); f.closed();
  assert.deepEqual(f.calls, ['shutdown', 'cleanup', 'quit']);
});
test('macOS close keeps app alive, but explicit quit still uses the handshake', () => {
  const f = fixture({ platform: 'darwin' }); f.closed(); assert.deepEqual(f.calls, []);
  f.coordinator.beforeQuit({ preventDefault() {} });
  assert.deepEqual(f.calls, ['shutdown', 'cleanup']);
});


test('one failing shutdown hook cannot strand hidden windows or backend cleanup', () => {
  const calls = [];
  const coordinator = createDesktopQuitCoordinator({
    app: { quit() { calls.push('quit'); } }, getMainWindow: () => null, platform: 'win32',
    beginShutdown() { calls.push('begin'); throw new Error('fixture'); },
    cleanup() { calls.push('cleanup'); }, onError() { calls.push('error'); },
  });
  coordinator.mainWindowClosed(); coordinator.willQuit();
  assert.deepEqual(calls, ['begin','error','cleanup','quit']);
});
test('relaunch is scheduled only after close commits; cancelled close clears intent', () => {
  const calls = [];
  const window = { isDestroyed: () => false, close() { calls.push('close'); } };
  const coordinator = createDesktopQuitCoordinator({
    app: { quit() { calls.push('quit'); }, relaunch() { calls.push('relaunch'); } },
    getMainWindow: () => window, platform: 'darwin',
  });
  coordinator.requestRelaunch();
  coordinator.beforeQuit({ preventDefault() {} });
  assert.equal(calls.includes('relaunch'), false);
  coordinator.cancelQuit(); coordinator.mainWindowClosed();
  assert.equal(calls.includes('relaunch'), false);
  coordinator.requestRelaunch(); coordinator.beforeQuit({ preventDefault() {} }); coordinator.mainWindowClosed();
  assert.equal(calls.filter(x => x === 'relaunch').length, 1);
});
