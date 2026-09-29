import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { __mediaObjectUrlRegistryForTest } from '../../services/mediaObjectUrlRegistry.js';
import { disposeImageObjectUrls, hydrateStoredImageThumbsInBackground } from './imageObjectUrlLifecycle.js';

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
      return `blob:test-${created.length}`;
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

function waitForAsyncWork() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

test('imageObjectUrlLifecycle: dispose revokes cached and pending blob URLs', async () => {
  await withObjectUrlRuntime(async ({ revoked }) => {
    const context = {
      _imageObjectUrlLifecycleEpoch: 4,
      _imageDisplayLoadToken: 7,
      _cachedThumbUrl: 'blob:cached-thumb',
      _cachedSourceUrl: 'https://example.com/source.png',
      _thumbObjectUrls: new Map([['thumb', 'blob:thumb']]),
      _refThumbObjectUrls: new Map([['ref', 'blob:ref']]),
      _pendingImageObjectUrlReleases: ['blob:pending', 'https://example.com/pending.png'],
      _activeRefThumbIds: new Set(['ref']),
      _thumbObjectUrlLoads: new Map([['thumb', Promise.resolve()]]),
      _refThumbObjectUrlLoads: new Map([['ref', Promise.resolve()]]),
      _imageObjectUrlReleaseCallbacks: new Map([['thumb', () => {}]]),
    };

    disposeImageObjectUrls(context);

    assert.equal(context._imageObjectUrlsDisposed, true);
    assert.equal(context._imageObjectUrlLifecycleEpoch, 5);
    assert.equal(context._imageDisplayLoadToken, 8);
    assert.deepEqual(revoked, ['blob:cached-thumb', 'blob:thumb', 'blob:ref', 'blob:pending']);
    assert.equal(context._cachedThumbUrl, null);
    assert.equal(context._cachedSourceUrl, null);
    assert.equal(context._thumbObjectUrls.size, 0);
    assert.equal(context._refThumbObjectUrls.size, 0);
    assert.equal(context._activeRefThumbIds.size, 0);
    assert.equal(context._thumbObjectUrlLoads.size, 0);
    assert.equal(context._refThumbObjectUrlLoads.size, 0);
    assert.equal(context._imageObjectUrlReleaseCallbacks.size, 0);
  });
});

test('imageObjectUrlLifecycle: hydrates unique stored thumbs once', async () => {
  await withObjectUrlRuntime(async ({ created, revoked }) => {
    const context = {
      nodeId: 'node-thumbs',
      _thumbObjectUrls: new Map(),
      _resolvedUrlsKey: 'resolved-key',
      _imageObjectUrlLifecycleEpoch: 0,
      imgEl: null,
    };

    hydrateStoredImageThumbsInBackground(
      context,
      ['thumb-b', 'thumb-a', 'thumb-b'],
      'resolved-key',
      async (thumbId) => ({ id: thumbId, size: 4, type: 'image/png' }),
    );
    await waitForAsyncWork();

    assert.deepEqual(
      created.map((blob) => blob.id),
      ['thumb-b', 'thumb-a'],
    );
    assert.equal(context._thumbObjectUrls.get('thumb-a'), 'blob:test-2');
    assert.equal(context._thumbObjectUrls.get('thumb-b'), 'blob:test-1');
    assert.equal(context._thumbObjectUrlLoads.size, 0);
    assert.deepEqual(revoked, []);
  });
});

test('imageObjectUrlLifecycle: revokes hydrated thumbs when the resolved key is stale', async () => {
  await withObjectUrlRuntime(async ({ revoked }) => {
    const context = {
      nodeId: 'node-stale-thumbs',
      _thumbObjectUrls: new Map(),
      _resolvedUrlsKey: 'new-key',
      _imageObjectUrlLifecycleEpoch: 2,
      imgEl: null,
    };

    hydrateStoredImageThumbsInBackground(context, ['thumb-stale'], 'old-key', async () => ({
      size: 1,
      type: 'image/png',
    }));
    await waitForAsyncWork();

    assert.equal(context._thumbObjectUrls.size, 0);
    assert.deepEqual(revoked, ['blob:test-1']);
  });
});
