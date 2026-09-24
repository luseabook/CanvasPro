import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import {
  FUNASR_MODEL_DIR_NAME,
  inferFileSaveRootDirFromManagedPaths,
  resolveFunasrModelRootDir,
} from './funasrModelRoot.js';
import {
  SORTFORMER_MODEL_DIR_NAME,
  resolveSortformerModelRootDir,
} from './sortformerModelRoot.js';

const ROOT = path.resolve('C:/fixtures/root');

test('model directory names match the on-disk cache layout', () => {
  assert.equal(FUNASR_MODEL_DIR_NAME, 'funasr');
  assert.equal(SORTFORMER_MODEL_DIR_NAME, 'sortformer');
});

test('explicit fileSavePathsMeta rootDir wins over every inference path', () => {
  const resolved = resolveFunasrModelRootDir(
    {
      fileSavePathsMeta: { rootDir: ROOT },
      fileSavePaths: { dataDir: path.join(ROOT, 'data') },
    },
    { fallbackDataDir: 'C:/fallback' },
  );
  assert.equal(resolved, path.join(ROOT, FUNASR_MODEL_DIR_NAME));
});

test('rootDir is inferred from managed paths when meta is absent', () => {
  const resolved = resolveFunasrModelRootDir({
    fileSavePaths: {
      canvasDir: path.join(ROOT, 'projects'),
      dataDir: path.join(ROOT, 'data'),
      outputDir: path.join(ROOT, 'output'),
    },
  });
  assert.equal(resolved, path.join(ROOT, FUNASR_MODEL_DIR_NAME));
});

test('a single managed data dir is still enough to infer the root', () => {
  const resolved = resolveFunasrModelRootDir({ fileSavePaths: { dataDir: path.join(ROOT, 'data') } });
  assert.equal(resolved, path.join(ROOT, FUNASR_MODEL_DIR_NAME));
  assert.equal(inferFileSaveRootDirFromManagedPaths({ dataDir: path.join(ROOT, 'data') }), ROOT);
});

test('fallbackDataDir is used only when nothing else is configured', () => {
  assert.equal(
    resolveFunasrModelRootDir({}, { fallbackDataDir: ROOT }),
    path.join(ROOT, FUNASR_MODEL_DIR_NAME),
  );
});

test('empty configuration resolves to an empty string instead of a bogus path', () => {
  assert.equal(resolveFunasrModelRootDir(), '');
  assert.equal(resolveFunasrModelRootDir({}, { fallbackDataDir: '   ' }), '');
  assert.equal(inferFileSaveRootDirFromManagedPaths({}), '');
});

test('disagreeing managed parents do not fabricate a shared root', () => {
  const resolved = resolveFunasrModelRootDir({
    fileSavePaths: { canvasDir: path.join('C:/a', 'projects'), dataDir: path.join('C:/b', 'data') },
  });
  assert.equal(resolved, path.join('C:/b', FUNASR_MODEL_DIR_NAME));
});

test('a managed dir whose basename does not match is ignored', () => {
  assert.equal(inferFileSaveRootDirFromManagedPaths({ dataDir: path.join(ROOT, 'data-copy') }), '');
});

test('sortformer resolves through the same shared inference helper', () => {
  assert.equal(
    resolveSortformerModelRootDir(
      { fileSavePaths: { dataDir: path.join(ROOT, 'data') } },
      { fallbackDataDir: 'C:/fallback' },
    ),
    path.join(ROOT, SORTFORMER_MODEL_DIR_NAME),
  );
  assert.equal(
    resolveSortformerModelRootDir({ fileSavePathsMeta: { rootDir: ROOT } }),
    path.join(ROOT, SORTFORMER_MODEL_DIR_NAME),
  );
  assert.equal(resolveSortformerModelRootDir(), '');
});
