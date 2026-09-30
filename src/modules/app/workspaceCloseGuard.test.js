import test from 'node:test';
import assert from 'node:assert/strict';
import { installWorkspaceCloseGuard } from './workspaceCloseGuard.js';
function fixture(workspaces) {
  const events = new Map(); const calls = [];
  const windowObject = {
    addEventListener: (name, fn) => events.set(name, fn),
    removeEventListener: name => events.delete(name),
    __aiCanvasWriteRecoverySnapshotForClose: async () => { calls.push('canvas'); return { success: false, reason: 'clean' }; },
  };
  const guard = installWorkspaceCloseGuard({ windowObject, getWorkspaces: () => workspaces });
  return { events, calls, guard, windowObject };
}
test('workspace flush is awaited before canvas snapshot and close', async () => {
  let resolve; const saved = new Promise(r => { resolve = r; });
  const f = fixture([{ prepareForClose: async () => { await saved; return { success: true }; } }]);
  const result = f.guard.prepareForClose();
  assert.equal(f.guard.prepareForClose(), result);
  assert.deepEqual(f.calls, []); resolve();
  assert.deepEqual(await result, { success: true }); assert.deepEqual(f.calls, ['canvas']);
});
test('workspace save failure is surfaced without destroying the workspace', async () => {
  const f = fixture([{ prepareForClose: async () => { throw new Error('disk full'); } }]);
  assert.equal((await f.guard.prepareForClose()).success, false);
  assert.deepEqual(f.calls, []);
});
test('cancelable unload warns for dirty workspace and does not tear it down', () => {
  let prevented = false;
  const f = fixture([{ hasUnsavedChanges: () => true, prepareForClose: async () => ({ success: true }) }]);
  const event = { preventDefault() { prevented = true; } };
  f.events.get('beforeunload')(event);
  assert.equal(prevented, true); assert.equal(event.returnValue, '');
  assert.equal(typeof f.windowObject.__aiCanvasPrepareForClose, 'function');
  f.guard.destroy(); assert.equal(f.events.size, 0);
});


test('edits arriving while the canvas snapshot is written cancel close instead of being lost', async () => {
  let changed = false;
  const f = fixture([{ prepareForClose: async () => ({ success: true }), hasUnsavedChanges: () => changed }]);
  f.windowObject.__aiCanvasWriteRecoverySnapshotForClose = async () => { changed = true; return { success: true }; };
  assert.deepEqual(await f.guard.prepareForClose(), { success: false, reason: 'workspace-changed-during-close' });
});
test('a failed dirty-state probe is fail-closed for browser navigation', () => {
  const f = fixture([{ hasUnsavedChanges() { throw new Error('fixture probe failure'); } }]);
  let prevented = false;
  f.events.get('beforeunload')({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
});
