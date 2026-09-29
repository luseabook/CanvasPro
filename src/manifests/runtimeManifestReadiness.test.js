import test from 'node:test';
import assert from 'node:assert/strict';

import {
  hasPendingRuntimeManifestLoad,
  trackRuntimeManifestLoad,
  waitForRuntimeManifestLoad,
} from './runtimeManifestReadiness.js';

test('runtimeManifestReadiness: tracks loads until they settle', async () => {
  let resolveLoad;
  const load = new Promise((resolve) => {
    resolveLoad = resolve;
  });

  assert.equal(trackRuntimeManifestLoad(load), load);
  assert.equal(hasPendingRuntimeManifestLoad(), true);
  assert.equal(await waitForRuntimeManifestLoad({ timeoutMs: 5 }), false);

  resolveLoad('done');
  await load;
  assert.equal(await waitForRuntimeManifestLoad({ timeoutMs: 50 }), true);
  assert.equal(hasPendingRuntimeManifestLoad(), false);
});

test('runtimeManifestReadiness: swallowed failures still clear pending state', async () => {
  const load = Promise.reject(new Error('manifest load failed'));

  trackRuntimeManifestLoad(load);
  assert.equal(await waitForRuntimeManifestLoad({ timeoutMs: 50 }), true);
  assert.equal(hasPendingRuntimeManifestLoad(), false);
});
