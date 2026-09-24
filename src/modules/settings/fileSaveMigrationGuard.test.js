import assert from 'node:assert/strict';
import test from 'node:test';
import { fileSavePathChanges } from './fileSaveMigrationGuard.js';

test('no path change returns an empty list (including derived uploads)', () => {
  const previous = {
    canvasDir: 'C:\\files\\projects', dataDir: 'C:\\files\\data',
    outputDir: 'C:\\files\\output', tempDir: 'C:\\files\\data\\uploads',
  };
  assert.deepEqual(fileSavePathChanges(previous, {
    canvasDir: 'C:\\files\\projects\\', dataDir: 'C:\\files\\data',
    outputDir: 'C:\\files\\output',
  }), []);
});

test('changed data or old custom upload path requires confirmation', () => {
  const previous = {
    canvasDir: '/old/projects', dataDir: '/old/data',
    outputDir: '/old/output', tempDir: '/old/uploads',
  };
  const changes = fileSavePathChanges(previous, {
    canvasDir: '/old/projects', dataDir: '/new/data', outputDir: '/old/output',
  });
  assert.deepEqual(changes.map((change) => change.key), ['dataDir', 'tempDir']);
  assert.equal(changes[1].to, '/new/data/uploads');
});

test('case-only changes request confirmation instead of silently bypassing backend', () => {
  assert.equal(fileSavePathChanges({ canvasDir: '/a/Project' }, { canvasDir: '/a/project' })
    .some((change) => change.key === 'canvasDir'), true);
});
