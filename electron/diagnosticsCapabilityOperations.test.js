import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createDiagnosticsCapabilityOperations } from './diagnosticsCapabilityOperations.js';

function createDeps(overrides = {}) {
  const calls = { packages: [], dialogs: [], folders: [] };
  const diagnostics = {
    getSuggestedPackagePath: () => '/logs/suggested-package.zip',
    async createPackage(payload) {
      calls.packages.push(payload);
      return { path: payload.outputPath, bytes: 12 };
    },
  };
  return {
    calls,
    diagnostics,
    deps: {
      diagnostics,
      logDir: overrides.logDir,
      showSaveDialog: async (options) => {
        calls.dialogs.push(options);
        return overrides.dialogResult ?? { canceled: false, filePath: '/picked/diag' };
      },
      openFolder: (folder) => {
        calls.folders.push(folder);
        return { foregroundRequested: overrides.foregroundRequested === true };
      },
    },
  };
}

test('createDiagnosticsCapabilityOperations validates its dependencies', () => {
  const { diagnostics } = createDeps();
  const base = { diagnostics, logDir: '/l', showSaveDialog: () => {}, openFolder: () => {} };
  assert.throws(() => createDiagnosticsCapabilityOperations(), TypeError);
  assert.throws(
    () => createDiagnosticsCapabilityOperations({ ...base, diagnostics: { createPackage: () => {} } }),
    TypeError,
  );
  assert.throws(
    () => createDiagnosticsCapabilityOperations({ ...base, diagnostics: { getSuggestedPackagePath: () => '' } }),
    TypeError,
  );
  assert.throws(
    () => createDiagnosticsCapabilityOperations({ ...base, showSaveDialog: undefined }),
    TypeError,
  );
  assert.throws(
    () => createDiagnosticsCapabilityOperations({ ...base, openFolder: undefined }),
    TypeError,
  );
  assert.equal(typeof createDiagnosticsCapabilityOperations(base).createPackage, 'function');
});

test('createPackage writes to the path picked by the save dialog', async () => {
  const { deps, calls } = createDeps();
  const operations = createDiagnosticsCapabilityOperations(deps);
  const result = await operations.createPackage({ aiAnalysisReport: { summary: 'ok' } });
  assert.deepEqual(result, { success: true, canceled: false, path: '/picked/diag.zip', bytes: 12 });
  assert.deepEqual(calls.dialogs, [
    {
      title: '保存诊断包',
      defaultPath: '/logs/suggested-package.zip',
      filters: [{ name: 'ZIP archive', extensions: ['zip'] }],
    },
  ]);
  assert.deepEqual(calls.packages, [
    { aiAnalysisReport: { summary: 'ok' }, outputPath: '/picked/diag.zip' },
  ]);
});

test('createPackage keeps an existing zip extension and reports cancellation', async () => {
  const kept = createDeps({ dialogResult: { canceled: false, filePath: '/picked/diag.zip' } });
  await createDiagnosticsCapabilityOperations(kept.deps).createPackage();
  assert.equal(kept.calls.packages[0].outputPath, '/picked/diag.zip');

  const canceled = createDeps({ dialogResult: { canceled: true } });
  const result = await createDiagnosticsCapabilityOperations(canceled.deps).createPackage();
  assert.deepEqual(result, { ok: false, success: false, canceled: true });
  assert.equal(canceled.calls.packages.length, 0);
});

test('openLogsFolder creates the log directory and reports foreground state', async () => {
  const logDir = mkdtempSync(path.join(tmpdir(), 'aic-diag-'));
  const nested = path.join(logDir, 'logs');
  try {
    const { deps, calls } = createDeps({ logDir: nested, foregroundRequested: true });
    const operations = createDiagnosticsCapabilityOperations(deps);
    assert.deepEqual(operations.openLogsFolder(), { ok: true, foregroundRequested: true });
    assert.equal(existsSync(nested), true);
    assert.deepEqual(calls.folders, [nested]);
  } finally {
    rmSync(logDir, { recursive: true, force: true });
  }
});
