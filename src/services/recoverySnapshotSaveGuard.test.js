// Stubbed IPC only; never reads a real project or recovery snapshot.
import test from 'node:test';
import assert from 'node:assert/strict';
import { captureRecoverySnapshotBeforeSave, clearRecoverySnapshotAfterSave } from './recoverySnapshotSaveGuard.js';

const identity = { projectId: 'p', filename: 'p.aicanvas', recentId: 'recent-p', displayPath: 'C:/projects/p.aicanvas' };
const info = { ...identity, exists: true, revision: 'a'.repeat(64) };
const saved = { ...identity, success: true };

test('same project only clears the exact snapshot captured before saving', { concurrency: false }, async () => {
  const prior = globalThis.window;
  let guardedCalls = 0, oldCalls = 0;
  globalThis.window = { ...identity, currentProjectId: identity.projectId, _v2CurrentFile: identity.filename,
    _v2CurrentRecentProjectId: identity.recentId, _v2CurrentProjectDisplayPath: identity.displayPath };
  try {
    const api = { getRecoverySnapshotInfo: async () => info,
      clearRecoverySnapshot: async () => { oldCalls++; },
      clearRecoverySnapshotIfMatch: async token => {
        guardedCalls++;
        assert.deepEqual(token, { projectId: 'p', revision: info.revision });
        return { success: true, cleared: true };
      } };
    const captured = await captureRecoverySnapshotBeforeSave(api);
    assert.deepEqual(await clearRecoverySnapshotAfterSave(api, captured, saved), { retained: false, cleared: true });
    assert.equal(guardedCalls, 1);
    assert.equal(oldCalls, 0);
  } finally {
    if (prior === undefined) delete globalThis.window;
    else globalThis.window = prior;
  }
});

test('different result or newer snapshot is retained without an unsafe retry', { concurrency: false }, async () => {
  const prior = globalThis.window;
  let calls = 0, warnings = 0;
  globalThis.window = { showToast: (_, kind) => { if (kind === 'warning') warnings++; } };
  try {
    const api = { getRecoverySnapshotInfo: async () => info,
      clearRecoverySnapshotIfMatch: async () => { calls++; return { success: false, cleared: false, reason: 'changed' }; } };
    const captured = await captureRecoverySnapshotBeforeSave(api, identity);
    assert.equal((await clearRecoverySnapshotAfterSave(api, captured, { ...saved, projectId: 'other' })).retained, true);
    assert.equal(calls, 0);
    assert.equal((await clearRecoverySnapshotAfterSave(api, captured, saved)).retained, true);
    assert.equal(calls, 1);
    assert.equal(warnings, 1);
  } finally {
    if (prior === undefined) delete globalThis.window;
    else globalThis.window = prior;
  }
});

test('invalid snapshot and older desktop host never call the unguarded clear API', { concurrency: false }, async () => {
  const prior = globalThis.window;
  let oldCalls = 0;
  globalThis.window = { showToast() {} };
  try {
    for (const snapshot of [{ ...info, invalid: true }, info]) {
      const api = { getRecoverySnapshotInfo: async () => snapshot,
        clearRecoverySnapshot: async () => { oldCalls++; } }; // Old host lacks the new guarded method.
      const captured = await captureRecoverySnapshotBeforeSave(api, identity);
      assert.equal(captured.token, null);
      assert.equal((await clearRecoverySnapshotAfterSave(api, captured, saved)).retained, true);
    }
    assert.equal(oldCalls, 0);
  } finally {
    if (prior === undefined) delete globalThis.window;
    else globalThis.window = prior;
  }
});
