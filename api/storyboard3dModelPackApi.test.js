import test from 'node:test';
import assert from 'node:assert/strict';

import {
  fetchStoryboard3DModelPackAssetFile,
  getStoryboard3DModelPackStatus,
} from './storyboard3dModelPackApi.js';

test('storyboard3dModelPackApi: normalizes status and installation progress', async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response(
      JSON.stringify({
        success: true,
        installed: true,
        packId: ' pack-1 ',
        version: '1.0.0',
        downloadBytes: 100,
        assetCount: 2.9,
        assets: [{ name: 'model.obj' }],
        installProgress: {
          state: 'installing',
          downloadedBytes: 50,
          totalBytes: 100,
          percent: 0,
          currentSource: 'cdn',
        },
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  };

  try {
    const status = await getStoryboard3DModelPackStatus();
    assert.equal(status.installed, true);
    assert.equal(status.packId, 'pack-1');
    assert.equal(status.assetCount, 2);
    assert.equal(status.installProgress.percent, 50);
    assert.equal(request.url, '/api/v2/storyboard3d/model-pack/status');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('storyboard3dModelPackApi: rejects unsafe model-pack asset paths', async () => {
  await assert.rejects(
    () =>
      fetchStoryboard3DModelPackAssetFile({
        url: 'https://evil.test/model.obj',
      }),
    /模型包资产地址无效/,
  );
});
