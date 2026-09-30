import test from 'node:test';
import assert from 'node:assert/strict';
import { createRendererNavigationGuard } from './rendererNavigationGuard.js';
const window = { isDestroyed: () => false };
test('reload awaits workspace save before navigation', async () => {
  const calls = []; let finish;
  const guard = createRendererNavigationGuard({ getMainWindow: () => window,
    requestSnapshot: () => new Promise(resolve => { finish = resolve; calls.push('save'); }) });
  const pending = guard.run('reload', () => calls.push('reload'));
  assert.deepEqual(calls, ['save']);
  assert.equal(await guard.run('reload', () => calls.push('duplicate')), false);
  finish({ success: true }); assert.equal(await pending, true);
  assert.deepEqual(calls, ['save','reload']);
});
test('failed or exceptional save leaves the backend and renderer alone', async () => {
  let actions = 0, failures = 0;
  for (const requestSnapshot of [async () => ({ success: false }), async () => { throw new Error('fixture'); }]) {
    const guard = createRendererNavigationGuard({ getMainWindow: () => window, requestSnapshot, onFailure: () => failures++ });
    assert.equal(await guard.run('backend-restart', () => actions++), false);
  }
  assert.equal(actions, 0); assert.equal(failures, 2);
});
test('window closed during save is not navigated', async () => {
  let destroyed = false, actions = 0;
  const guard = createRendererNavigationGuard({ getMainWindow: () => ({ isDestroyed: () => destroyed }),
    requestSnapshot: async () => { destroyed = true; return { success: true }; } });
  assert.equal(await guard.run('reload', () => actions++), false); assert.equal(actions, 0);
});
