import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  AssetIndexReadError,
  readAssetIndexFile,
  writeAssetIndexFile,
} from './assetIndexFileStore.js';

function createTempIndexPath() {
  return path.join(mkdtempSync(path.join(tmpdir(), 'aic-asset-index-')), 'assets.index.json');
}

test('a missing index file reads as an empty version 1 index', () => {
  const indexPath = createTempIndexPath();
  assert.deepEqual(readAssetIndexFile(indexPath), { version: 1, assets: {} });
});

test('a written index round-trips through the real filesystem', () => {
  const indexPath = createTempIndexPath(),
    assets = { abc: { assetId: 'abc', kind: 'image', assetRevision: 3 } };
  writeAssetIndexFile(indexPath, { version: 1, assets: assets });
  assert.deepEqual(readAssetIndexFile(indexPath), { version: 1, assets: assets });
  const raw = readFileSync(indexPath, 'utf8');
  assert.ok(raw.endsWith('\n'));
  assert.equal(JSON.parse(raw).version, 1);
});

test('the writer creates missing parent directories and leaves no temp files behind', () => {
  const indexPath = path.join(createTempIndexPath(), 'nested', 'deeper', 'assets.index.json');
  writeAssetIndexFile(indexPath, { assets: {} });
  assert.deepEqual(readAssetIndexFile(indexPath), { version: 1, assets: {} });
  assert.deepEqual(readdirSync(path.dirname(indexPath)), ['assets.index.json']);
});

test('a non-object assets field is dropped instead of failing the write', () => {
  const indexPath = createTempIndexPath();
  writeAssetIndexFile(indexPath, { assets: ['nope'] });
  assert.deepEqual(readAssetIndexFile(indexPath), { version: 1, assets: {} });
  writeAssetIndexFile(indexPath, null);
  assert.deepEqual(readAssetIndexFile(indexPath), { version: 1, assets: {} });
});

test('a JSON array root is rejected as an AssetIndexReadError', () => {
  const indexPath = createTempIndexPath();
  writeFileSync(indexPath, '[1,2,3]', 'utf8');
  assert.throws(
    () => readAssetIndexFile(indexPath),
    (error) => {
      assert.ok(error instanceof AssetIndexReadError);
      assert.equal(error.name, 'AssetIndexReadError');
      assert.equal(error.code, 'ASSET_INDEX_READ_FAILED');
      assert.equal(error.indexPath, indexPath);
      assert.ok(error.cause instanceof TypeError);
      assert.match(error.message, /Asset index root must be an object/);
      return true;
    },
  );
});

test('a non-object assets field makes the read fail loudly', () => {
  const indexPath = createTempIndexPath();
  writeFileSync(indexPath, JSON.stringify({ version: 1, assets: 7 }), 'utf8');
  assert.throws(() => readAssetIndexFile(indexPath), /Asset index assets must be an object/);
});

test('malformed JSON surfaces as an AssetIndexReadError', () => {
  const indexPath = createTempIndexPath();
  writeFileSync(indexPath, '{ not json', 'utf8');
  assert.throws(() => readAssetIndexFile(indexPath), (error) => {
    assert.equal(error.name, 'AssetIndexReadError');
    assert.equal(error.code, 'ASSET_INDEX_READ_FAILED');
    return true;
  });
});
