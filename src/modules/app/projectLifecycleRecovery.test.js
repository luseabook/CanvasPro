// Pure fixtures and stubbed browser APIs; no user projects, persistent cache or desktop runtime.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createProjectLifecycle, restoreWorkspacePayloadFromShardRecords } from './projectLifecycle.js';

const meta = { cacheVersion: 2, projectId: 'saved-project', projectName: 'Saved',
  activeCanvasId: 'c1', canvasOrder: [{ id: 'c1', name: 'Canvas 1' }] };
const record = { id: 'c1', name: 'Canvas 1', nodes: [{ id: 'n1' }], edges: [], assets: [] };

function makeLifecycle(resolveCanvasData = () => { throw new Error('unexpected normalization'); },
  onHydrate = () => { throw new Error('unexpected hydration'); }, tabs = {}) {
  return createProjectLifecycle({
    store: { getStateRaw: () => ({ nodes: {} }), updateViewport() {}, subscribeSelector() {} },
    CanvasTabManager: { _canvases: [], init: onHydrate, ...tabs },
    project: { resolveCanvasData, loadProject: async () => { throw new Error('unexpected server load'); } },
    loadCustomPresets() {},
    migrateLegacyThumbnailsInMultiData: async data => ({ changed: false, multiData: data }),
    sanitizeMultiCanvasDataForPersistence: data => data,
    commit() {}, patchStoreSourceNodeNamesFromFileName() {}, applySourceNamesFromFileNameToCanvas() {},
  });
}

test('sharded cache keeps valid canvas nodes and rejects missing or malformed shards', () => {
  const restored = restoreWorkspacePayloadFromShardRecords(meta, [record]);
  assert.equal(restored.projectId, 'saved-project');
  assert.deepEqual(restored.multiData.canvases[0].nodes, record.nodes);
  for (const bad of [[null], [{ ...record, nodes: 'broken' }], [{ ...record, edges: null }],
    [{ ...record, id: 'different' }], []]) {
    assert.equal(restoreWorkspacePayloadFromShardRecords(meta, bad), null);
  }
  assert.equal(restoreWorkspacePayloadFromShardRecords({ ...meta, canvasOrder: [{ id: 'c1' }, { id: 'c1' }] }, [record, record]), null);
  assert.equal(restoreWorkspacePayloadFromShardRecords({ ...meta, activeCanvasId: 'other' }, [record]), null);
  assert.equal(restoreWorkspacePayloadFromShardRecords({ ...meta, canvasOrder: [] }, []), null);
});

test('saved v2/legacy cache errors stop load instead of silently falling back', { concurrency: false }, async () => {
  const originalWindow = globalThis.window, originalWarn = console.warn;
  globalThis.window = {};
  console.warn = () => {};
  try {
    const cache = makeLifecycle().V2LocalCache;
    cache.getRecord = async key => key === 'workspace_meta' ? meta : null;
    cache.getRecords = async () => [{ ...record, nodes: 'broken' }];
    await assert.rejects(cache.load(), error => error.code === 'UNSAFE_PROJECT_RECOVERY');
    cache.getRecord = async key => key === 'current_state'
      ? { projectId: 'saved-project', multiData: { canvases: [{ id: 'c1', nodes: 'broken', edges: [] }] } } : null;
    await assert.rejects(cache.load(), error => error.code === 'UNSAFE_PROJECT_RECOVERY');
    cache.getRecord = async key => key === 'workspace_meta' ? meta : null;
    cache.getRecords = async () => [record];
    assert.equal((await cache.load()).multiData.canvases[0].nodes[0].id, 'n1');
    cache.getRecord = async key => key === 'workspace_meta' ? { ...meta, canvasOrder: [] } : null;
    await assert.rejects(cache.load(), error => error.code === 'UNSAFE_PROJECT_RECOVERY');
    cache.getRecord = async () => { throw new Error('IndexedDB read failed'); };
    await assert.rejects(cache.load(), error => error.code === 'UNSAFE_PROJECT_RECOVERY');
  } finally {
    console.warn = originalWarn;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});

test('invalid recovery or damaged cache blocks startup and blank autosave', { concurrency: false }, async () => {
  const originalWindow = globalThis.window, originalDocument = globalThis.document;
  const originalTimeout = globalThis.setTimeout, originalError = console.error, originalWarn = console.warn;
  globalThis.document = { getElementById: () => null, querySelector: () => null };
  globalThis.setTimeout = callback => { callback(); return 0; }; // Close the failed-start loader synchronously.
  console.error = () => {};
  console.warn = () => {};
  try {
    for (const info of [{ exists: true, invalid: true }, { exists: false, error: 'IPC read failed' },
      { exists: true, isNewerThanProject: true }, { exists: true, isNewerThanProject: true, validData: true }]) {
      let reads = 0, clears = 0, fallback = 0, hydrations = 0, toasts = 0;
      globalThis.window = {
        currentProjectId: 'keep', _v2CurrentFile: 'keep.aicanvas', _isAppLoaded: true,
        electronAPI: { project: {
          getRecoverySnapshotInfo: async () => info,
          readRecoverySnapshot: async () => { reads++; return { success: true, data: info.validData
            ? { canvases: [{ id: 'c1', nodes: [], edges: [] }], activeCanvasId: 'c1' } : {} }; },
          clearRecoverySnapshot: async () => { clears++; },
        } },
        showToast: (_, kind) => { if (kind === 'error') toasts++; },
      };
      const lifecycle = makeLifecycle(data => data, () => { hydrations++; });
      lifecycle.V2LocalCache.load = async () => {
        fallback++;
        if (info.validData) throw Object.assign(new Error('bad cache'), { code: 'UNSAFE_PROJECT_RECOVERY' });
        return null;
      };
      await lifecycle.initApp();
      assert.equal(reads, info.isNewerThanProject === true ? 1 : 0);
      assert.equal(clears, 0);
      assert.equal(fallback, info.validData ? 1 : 0);
      assert.equal(hydrations, 0);
      assert.equal(toasts, 1);
      assert.equal(globalThis.window._isAppLoaded, false);
      assert.equal(globalThis.window.currentProjectId, '');
      assert.equal(globalThis.window._v2CurrentFile, '');
    }
  } finally {
    console.warn = originalWarn;
    console.error = originalError;
    globalThis.setTimeout = originalTimeout;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});

test('dropping unsupported JSON leaves the original project identity and canvas untouched', { concurrency: false }, () => {
  const originalWindow = globalThis.window, originalReader = globalThis.FileReader, originalError = console.error;
  let normalizations = 0, errors = 0;
  globalThis.window = { currentProjectId: 'keep', _v2CurrentFile: 'keep.json',
    showToast: (_, kind) => { if (kind === 'error') errors++; } };
  globalThis.FileReader = class { readAsText(file) { this.onload({ target: { result: file.body } }); } };
  console.error = () => {};
  try {
    const lifecycle = makeLifecycle(() => { normalizations++; return {}; });
    for (const body of ['{}', '{"canvases":[]}']) {
      lifecycle.onDocumentDrop({ preventDefault() {}, dataTransfer: { files: [{ name: 'unknown.json', body }] } });
    }
    assert.equal(normalizations, 0);
    assert.equal(errors, 2);
    assert.equal(globalThis.window.currentProjectId, 'keep');
    assert.equal(globalThis.window._v2CurrentFile, 'keep.json');
  } finally {
    console.error = originalError;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
    if (originalReader === undefined) delete globalThis.FileReader;
    else globalThis.FileReader = originalReader;
  }
});

test('an older desktop host never receives an unguarded recovery write', { concurrency: false }, async () => {
  const prior = globalThis.window;
  let legacyWrites = 0, warnings = 0;
  globalThis.window = { currentProjectId: 'p',
    electronAPI: { project: { writeRecoverySnapshot: async () => { legacyWrites++; return { success: true }; } } },
    addEventListener() {}, showToast: (_, kind) => { if (kind === 'warning') warnings++; },
  };
  try {
    makeLifecycle().bindPersistRevisionAutoSave();
    const response = await globalThis.window.__aiCanvasWriteRecoverySnapshotForClose();
    assert.equal(response.code, 'RECOVERY_SNAPSHOT_PROTECTED');
    assert.equal(response.reason, 'guard-unavailable');
    assert.equal(legacyWrites, 0);
    assert.equal(warnings, 1);
  } finally {
    if (prior === undefined) delete globalThis.window;
    else globalThis.window = prior;
  }
});

test('a protected host write warns once and never falls back to the legacy writer', { concurrency: false }, async () => {
  const priorWindow = globalThis.window, priorDocument = globalThis.document;
  let guardedWrites = 0, legacyWrites = 0, warnings = 0;
  globalThis.document = { getElementById: () => ({ textContent: 'Example' }) };
  globalThis.window = { currentProjectId: 'p',
    electronAPI: { project: {
      writeRecoverySnapshot: async () => { legacyWrites++; return { success: true }; },
      writeRecoverySnapshotIfCompatible: async () => {
        guardedWrites++;
        return { success: false, code: 'RECOVERY_SNAPSHOT_PROTECTED' };
      },
    } },
    addEventListener() {}, showToast: (_, kind) => { if (kind === 'warning') warnings++; },
  };
  try {
    const tabs = { hasDirtyCanvases: () => true,
      getMultiDataSnapshot: () => ({ activeCanvasId: 'c1', canvases: [{ id: 'c1', nodes: {}, edges: [] }] }) };
    makeLifecycle(undefined, undefined, tabs).bindPersistRevisionAutoSave();
    for (let i = 0; i < 2; i++) {
      const response = await globalThis.window.__aiCanvasWriteRecoverySnapshotForClose();
      assert.equal(response.code, 'RECOVERY_SNAPSHOT_PROTECTED');
    }
    assert.equal(guardedWrites, 2);
    assert.equal(legacyWrites, 0);
    assert.equal(warnings, 1);
  } finally {
    if (priorWindow === undefined) delete globalThis.window;
    else globalThis.window = priorWindow;
    if (priorDocument === undefined) delete globalThis.document;
    else globalThis.document = priorDocument;
  }
});
