import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { scheduleStoredThumbObjectUrl } from './storedThumbObjectUrl.js';
import { __mediaObjectUrlRegistryForTest } from '../../services/mediaObjectUrlRegistry.js';

afterEach(() => {
  __mediaObjectUrlRegistryForTest.clear();
});

async function withObjectUrlRuntime(run) {
  const originalURL = globalThis.URL;
  const created = [];
  const revoked = [];
  globalThis.URL = {
    createObjectURL(blob) {
      created.push(blob);
      return `blob:thumb-${created.length}`;
    },
    revokeObjectURL(url) {
      revoked.push(url);
    },
  };
  try {
    return await run({ created, revoked });
  } finally {
    globalThis.URL = originalURL;
  }
}

function waitForQueue() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

test('storedThumbObjectUrl: resolves and tracks a new object URL once', async () => {
  await withObjectUrlRuntime(async ({ created, revoked }) => {
    const objectUrls = new Map();
    const pendingLoads = new Map();
    const resolved = [];
    const blob = { size: 12, type: 'image/png' };

    scheduleStoredThumbObjectUrl({
      thumbId: ' thumb-1 ',
      objectUrls,
      pendingLoads,
      getImage: async () => blob,
      onResolved: (url) => resolved.push(url),
      ownerId: 'owner-1',
      isCurrent: () => true,
    });

    assert.equal(pendingLoads.size, 1);
    await waitForQueue();

    assert.deepEqual(created, [blob]);
    assert.deepEqual(revoked, []);
    assert.deepEqual(resolved, ['blob:thumb-1']);
    assert.equal(objectUrls.get('thumb-1'), 'blob:thumb-1');
    assert.equal(pendingLoads.size, 0);
  });
});

test('storedThumbObjectUrl: revokes a stale object URL without publishing it', async () => {
  await withObjectUrlRuntime(async ({ revoked }) => {
    const objectUrls = new Map();
    const pendingLoads = new Map();

    scheduleStoredThumbObjectUrl({
      thumbId: 'thumb-stale',
      objectUrls,
      pendingLoads,
      getImage: async () => ({ size: 1, type: 'image/png' }),
      isCurrent: () => false,
    });
    await waitForQueue();

    assert.deepEqual(revoked, ['blob:thumb-1']);
    assert.equal(objectUrls.size, 0);
    assert.equal(pendingLoads.size, 0);
  });
});

test('storedThumbObjectUrl: skips loads that are already present or pending', () => {
  const objectUrls = new Map([['thumb-1', 'blob:existing']]);
  const pendingLoads = new Map([['thumb-2', Promise.resolve()]]);
  let calls = 0;

  for (const thumbId of ['thumb-1', 'thumb-2']) {
    scheduleStoredThumbObjectUrl({
      thumbId,
      objectUrls,
      pendingLoads,
      getImage: async () => {
        calls += 1;
      },
    });
  }

  assert.equal(calls, 0);
});
