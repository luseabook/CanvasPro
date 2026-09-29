import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyLegacyLocalStorage,
  decodeLegacyStorageValue,
  migrateLegacyRendererStorageIfNeeded,
} from './legacyRendererStorageMigration.js';

test('legacyRendererStorageMigration: decodes nested legacy storage values', () => {
  const base64 = Buffer.from([1, 2, 3]).toString('base64');
  const arrayBuffer = decodeLegacyStorageValue({ __aicStorageType: 'array-buffer', base64 });
  const typedArray = decodeLegacyStorageValue({
    __aicStorageType: 'typed-array',
    constructorName: 'Uint8Array',
    base64,
  });
  const blob = decodeLegacyStorageValue({
    __aicStorageType: 'blob',
    mimeType: 'text/plain',
    base64: Buffer.from('hello').toString('base64'),
  });
  const decoded = decodeLegacyStorageValue({
    nested: [{ __aicStorageType: 'date', value: '2026-09-29T00:00:00.000Z' }],
  });

  assert.deepEqual([...new Uint8Array(arrayBuffer)], [1, 2, 3]);
  assert.deepEqual([...typedArray], [1, 2, 3]);
  assert.equal(blob instanceof Blob, true);
  assert.equal(blob.type, 'text/plain');
  assert.equal(decoded.nested[0] instanceof Date, true);
  assert.equal(decoded.nested[0].toISOString(), '2026-09-29T00:00:00.000Z');
});

test('legacyRendererStorageMigration: writes only missing localStorage entries', () => {
  const values = new Map([['existing', 'kept']]);
  const storage = {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };

  const written = applyLegacyLocalStorage(
    { existing: 'ignored', added: 'value', empty: null, missing: undefined },
    storage,
  );

  assert.equal(written, 1);
  assert.deepEqual(
    [...values.entries()],
    [
      ['existing', 'kept'],
      ['added', 'value'],
    ],
  );
});

test('legacyRendererStorageMigration: migrates databases, localStorage, and completion marker', async () => {
  const values = new Map();
  let completedSummary = null;
  let importCalls = 0;
  const storage = {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };

  const result = await migrateLegacyRendererStorageIfNeeded({
    bridge: {
      isAvailable: () => true,
      read: async () => ({
        available: true,
        payload: {
          databases: [{ name: 'legacy' }],
          localStorage: { restored: 'yes' },
          skipped: ['one'],
        },
      }),
      complete: async (summary) => {
        completedSummary = summary;
      },
    },
    storage,
    indexedDBApi: { open() {} },
    importDatabases: async (databases, indexedDBApi, options) => {
      importCalls += 1;
      assert.deepEqual(databases, [{ name: 'legacy' }]);
      assert.equal(typeof indexedDBApi.open, 'function');
      assert.equal(options.signal instanceof AbortSignal, true);
      return 7;
    },
    locationObject: { search: '?aicLegacyStorageMigration=1' },
    timeoutMs: 100,
  });

  assert.equal(importCalls, 1);
  assert.deepEqual(result, {
    migrated: true,
    localStorageCount: 1,
    indexedDbCount: 7,
    skippedCount: 1,
  });
  assert.deepEqual(completedSummary, {
    localStorageCount: 1,
    indexedDbCount: 7,
    skippedCount: 1,
  });
  assert.equal(values.get('aic_legacy_renderer_storage_migration_completed'), '1');
});

test('legacyRendererStorageMigration: skips when the bridge is unavailable', async () => {
  const result = await migrateLegacyRendererStorageIfNeeded({
    bridge: { isAvailable: () => false },
  });

  assert.deepEqual(result, { migrated: false, reason: 'unavailable' });
});
