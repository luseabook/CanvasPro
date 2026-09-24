import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  LEGACY_RENDERER_STORAGE_SCHEMA_VERSION,
  __legacyRendererStorageMigrationForTest,
  buildLegacyRendererStorageMigrationAppUrl,
  createLegacyRendererStorageMigration,
} from './legacyRendererStorageMigration.js';

async function withTempDir(run) {
  const dir = mkdtempSync(path.join(tmpdir(), 'legacy-storage-migration-'));
  try {
    return await run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function createMigration(dir, overrides = {}) {
  return createLegacyRendererStorageMigration({
    userDataDir: dir,
    appUrl: 'http://127.0.0.1:8777/',
    ...overrides,
  });
}

test('buildLegacyRendererStorageMigrationAppUrl toggles the migration flag and preserves query', () => {
  assert.equal(
    buildLegacyRendererStorageMigrationAppUrl('http://127.0.0.1:8777/', { available: true }),
    'http://127.0.0.1:8777/?aicLegacyStorageMigration=1',
  );
  assert.equal(
    buildLegacyRendererStorageMigrationAppUrl('http://127.0.0.1:8777/', { available: false }),
    'http://127.0.0.1:8777/?aicLegacyStorageMigration=0',
  );
  // Default is available:false; other query params survive.
  assert.equal(
    buildLegacyRendererStorageMigrationAppUrl('http://127.0.0.1:8777/?foo=bar'),
    'http://127.0.0.1:8777/?foo=bar&aicLegacyStorageMigration=0',
  );
  // A missing url falls back to the loopback default rather than throwing.
  assert.equal(
    buildLegacyRendererStorageMigrationAppUrl('', { available: true }),
    'http://127.0.0.1:8777/?aicLegacyStorageMigration=1',
  );
});

test('read reports not-prepared when there is no staging file', async () => {
  await withTempDir((dir) => {
    const migration = createMigration(dir);
    assert.deepEqual(migration.read(), { available: false, reason: 'not-prepared' });
    assert.equal(migration.stagingPath, path.join(dir, 'legacy-renderer-storage-migration.json'));
    assert.equal(
      migration.completedPath,
      path.join(dir, 'legacy-renderer-storage-migration.completed.json'),
    );
  });
});

test('read reports not-prepared when the staging file is unreadable or not JSON', async () => {
  await withTempDir((dir) => {
    const migration = createMigration(dir);
    writeFileSync(migration.stagingPath, '{ not json', 'utf8');
    assert.deepEqual(migration.read(), { available: false, reason: 'not-prepared' });
    // A JSON scalar is also rejected, only objects count as a payload.
    writeFileSync(migration.stagingPath, '"just a string"', 'utf8');
    assert.deepEqual(migration.read(), { available: false, reason: 'not-prepared' });
  });
});

test('prepare stages the export from the app-origin window and read returns it', async () => {
  await withTempDir(async (dir) => {
    const calls = [];
    const payload = {
      schemaVersion: LEGACY_RENDERER_STORAGE_SCHEMA_VERSION,
      exportedAt: 1700000000000,
      localStorage: { alpha: '1' },
      databases: [{ name: 'TapNowV2Cache', version: 3, stores: [] }],
      skipped: [],
    };
    const migration = createMigration(dir, {
      createWindow: () => ({
        loadURL: async (url) => calls.push(['loadURL', url]),
        webContents: {
          executeJavaScript: async (script, userGesture) => {
            calls.push(['executeJavaScript', typeof script, userGesture]);
            return payload;
          },
        },
        destroy: () => calls.push(['destroy']),
      }),
    });
    const prepared = await migration.prepare();
    assert.deepEqual(prepared, { available: true, reason: 'prepared' });
    assert.equal(calls[0][0], 'loadURL');
    assert.equal(calls[0][1], 'http://127.0.0.1:8777/electron/legacyStorageMigration.html');
    assert.deepEqual(calls[1], ['executeJavaScript', 'string', true]);
    assert.deepEqual(calls[2], ['destroy']);
    assert.ok(existsSync(migration.stagingPath));
    assert.deepEqual(JSON.parse(readFileSync(migration.stagingPath, 'utf8')), payload);
    assert.deepEqual(migration.read(), { available: true, payload });
  });
});

test('prepare short-circuits when staging exists or the migration already completed', async () => {
  await withTempDir(async (dir) => {
    let windows = 0;
    const createWindow = () => {
      windows += 1;
      return { loadURL: async () => {}, webContents: { executeJavaScript: async () => ({}) } };
    };
    const migration = createMigration(dir, { createWindow });
    // Pre-staged: no window is opened.
    writeFileSync(migration.stagingPath, JSON.stringify({ schemaVersion: 1 }), 'utf8');
    assert.deepEqual(await migration.prepare(), { available: true, reason: 'staged' });
    assert.equal(windows, 0);
    // Completed marker wins over everything.
    assert.deepEqual(migration.complete({ moved: 2 }), { success: true });
    assert.deepEqual(await migration.prepare(), { available: false, reason: 'completed' });
    assert.equal(windows, 0);
  });
});

test('prepare reports window-unavailable when no factory is injected', async () => {
  await withTempDir(async (dir) => {
    const migration = createMigration(dir);
    assert.deepEqual(await migration.prepare(), { available: false, reason: 'window-unavailable' });
  });
});

test('prepare rejects an export whose schema version does not match, and still destroys the window', async () => {
  await withTempDir(async (dir) => {
    let destroyed = false;
    const migration = createMigration(dir, {
      createWindow: () => ({
        loadURL: async () => {},
        webContents: { executeJavaScript: async () => ({ schemaVersion: 99 }) },
        destroy: () => {
          destroyed = true;
        },
      }),
    });
    await assert.rejects(() => migration.prepare(), /unsupported schema/);
    assert.equal(destroyed, true);
    assert.equal(existsSync(migration.stagingPath), false);
  });
});

test('complete writes the completed marker, drops staging, and reports completed afterwards', async () => {
  await withTempDir((dir) => {
    let nowMs = 1234567890;
    const migration = createMigration(dir, { now: () => nowMs });
    writeFileSync(migration.stagingPath, JSON.stringify({ schemaVersion: 1 }), 'utf8');
    assert.deepEqual(migration.complete({ moved: 5 }), { success: true });
    assert.equal(existsSync(migration.stagingPath), false);
    const marker = JSON.parse(readFileSync(migration.completedPath, 'utf8'));
    assert.deepEqual(marker, {
      schemaVersion: LEGACY_RENDERER_STORAGE_SCHEMA_VERSION,
      completedAt: nowMs,
      summary: { moved: 5 },
    });
    assert.deepEqual(migration.read(), { available: false, reason: 'completed' });
    // complete() is idempotent and tolerates a stray/missing staging file.
    assert.deepEqual(migration.complete(), { success: true });
    assert.deepEqual(JSON.parse(readFileSync(migration.completedPath, 'utf8')).summary, {});
  });
});

test('the returned migration handle is frozen and exposes the documented surface', async () => {
  await withTempDir((dir) => {
    const migration = createMigration(dir);
    assert.equal(Object.isFrozen(migration), true);
    assert.deepEqual(Object.keys(migration).sort(), [
      'complete',
      'completedPath',
      'prepare',
      'read',
      'stagingPath',
    ]);
  });
});

test('readJsonFile only accepts JSON objects', () => {
  const { readJsonFile } = __legacyRendererStorageMigrationForTest;
  assert.deepEqual(readJsonFile('ignored', () => '{"a":1}'), { a: 1 });
  assert.equal(readJsonFile('ignored', () => 'null'), null);
  assert.equal(readJsonFile('ignored', () => '3'), null);
  assert.equal(readJsonFile('ignored', () => 'oops'), null);
  assert.equal(
    readJsonFile('ignored', () => {
      throw new Error('missing');
    }),
    null,
  );
});

test('the embedded export script is a self-invoking async function', async () => {
  const { LEGACY_STORAGE_EXPORT_SCRIPT } = __legacyRendererStorageMigrationForTest;
  assert.equal(typeof LEGACY_STORAGE_EXPORT_SCRIPT, 'string');
  assert.ok(LEGACY_STORAGE_EXPORT_SCRIPT.startsWith('('));
  assert.ok(LEGACY_STORAGE_EXPORT_SCRIPT.endsWith(')()'));
  assert.ok(LEGACY_STORAGE_EXPORT_SCRIPT.includes('async function exportLegacyRendererStorage'));
  // A fresh copy parses and self-invokes; it only fails on the browser globals
  // absent under Node, which proves it is not a bare function expression.
  await assert.rejects(
    () => new Function(`return ${LEGACY_STORAGE_EXPORT_SCRIPT}`)(),
    /localStorage is not defined/,
  );
});
