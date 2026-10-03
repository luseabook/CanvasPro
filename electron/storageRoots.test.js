import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createStorageRoots } from './storageRoots.js';
test('an explicit storage override never falls back to user works or legacy paths', () => {
  const isolated = path.resolve('fixture-independent-storage');
  const result = createStorageRoots({ appIsPackaged: false, appRoot: '/application', userDataRoot: '/normal-user-data', storageRootOverride: isolated });
  assert.equal(result.storageRoot, isolated); assert.deepEqual(result.legacyFilesRoots, []);
});
test('default development layout remains backwards compatible', () => {
  const root = path.resolve('fixture-app');
  const result = createStorageRoots({ appIsPackaged: false, appRoot: root });
  assert.equal(result.storageRoot, path.join(root, 'user-data')); assert.deepEqual(result.legacyFilesRoots, [root]);
});
