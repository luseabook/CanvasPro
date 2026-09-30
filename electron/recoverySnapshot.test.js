// In-memory window only. Never opens Electron or touches a real project.
import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { installRecoverySnapshotBeforeClose } from './recoverySnapshot.js';

function fakeWindow() {
  const win = new EventEmitter();
  win.closed = 0;
  win.isDestroyed = () => false;
  win.close = () => {
    win.closed++;
    win.emit('close', { preventDefault() {} });
  };
  return win;
}

const flush = () => new Promise(resolve => setImmediate(resolve));

test('protected recovery does not close over unsaved changes without explicit confirmation', async () => {
  const win = fakeWindow();
  let approve = false, prompts = 0, prevented = 0;
  installRecoverySnapshotBeforeClose(win, {
    getRendererProjectState: () => ({ hasUnsavedChanges: true }),
    requestSnapshot: async () => ({ success: false, code: 'RECOVERY_SNAPSHOT_PROTECTED' }),
    confirmCloseWithoutSnapshot: async () => { prompts++; return approve; },
  });
  win.emit('close', { preventDefault() { prevented++; } });
  await flush();
  assert.equal(win.closed, 0);
  assert.equal(prompts, 1);
  approve = true;
  win.emit('close', { preventDefault() { prevented++; } });
  await flush();
  assert.equal(win.closed, 1);
  assert.equal(prompts, 2);
  assert.equal(prevented, 2);
});

test('a successful dirty-state snapshot closes normally without a discard prompt', async () => {
  const win = fakeWindow();
  let prompted = false;
  installRecoverySnapshotBeforeClose(win, {
    getRendererProjectState: () => ({ hasUnsavedChanges: true }),
    requestSnapshot: async () => ({ success: true }),
    confirmCloseWithoutSnapshot: async () => { prompted = true; return false; },
  });
  win.emit('close', { preventDefault() {} });
  await flush();
  assert.equal(win.closed, 1);
  assert.equal(prompted, false);
});

for (const [name, requestSnapshot] of [
  ['ordinary failure', async () => ({ success: false, reason: 'disk-full' })],
  ['timeout', async () => ({ success: false, reason: 'timeout' })],
  ['exception', async () => { throw new Error('renderer gone'); }],
  ['missing acknowledgement', async () => undefined],
]) {
  test(`close remains cancelable after ${name}`, async () => {
    const win = fakeWindow(); let cancelled = 0;
    installRecoverySnapshotBeforeClose(win, {
      getRendererProjectState: () => ({ hasUnsavedChanges: true }), requestSnapshot,
      onCloseCancelled: () => cancelled++,
    });
    win.emit('close', { preventDefault() {} }); await flush();
    assert.equal(win.closed, 0); assert.equal(cancelled, 1);
  });
}
test('workspace preparation is requested even when the canvas is clean', async () => {
  const win = fakeWindow(); let asked = false;
  installRecoverySnapshotBeforeClose(win, {
    getRendererProjectState: () => ({ hasUnsavedChanges: false }),
    shouldPrepareRenderer: () => true,
    requestSnapshot: async () => { asked = true; return { success: true }; },
  });
  win.emit('close', { preventDefault() {} }); await flush();
  assert.equal(asked, true); assert.equal(win.closed, 1);
});


test('explicit discard closes even when renderer beforeunload would veto, without weakening the default', async () => {
  const win = fakeWindow(); let destroyed = 0;
  win.destroy = () => { destroyed++; };
  installRecoverySnapshotBeforeClose(win, {
    shouldPrepareRenderer: () => true,
    requestSnapshot: async () => ({ success: false, reason: 'fixture-save-failure' }),
    confirmCloseWithoutSnapshot: async () => true,
  });
  win.emit('close', { preventDefault() {} }); await flush();
  assert.equal(destroyed, 1); assert.equal(win.closed, 0);
});
