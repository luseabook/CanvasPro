import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_MODEL_API_MEDIA_UPLOAD_PROVIDERS,
  isPublicHttpMediaUrl,
  isReusableModelApiMediaUrl,
  resolveRunningHubMediaUploadApiKey,
  resolveUserMediaStorageUploadTarget,
  uploadModelApiMediaInputs,
} from './mediaInputUploadRouter.js';

test('mediaInputUploadRouter: classifies public and provider-reusable media URLs', () => {
  assert.equal(isPublicHttpMediaUrl('https://cdn.test/a.png'), true);
  assert.equal(isPublicHttpMediaUrl('http://8.8.8.8/a.png'), true);
  assert.equal(isPublicHttpMediaUrl('http://localhost/a.png'), false);
  assert.equal(isPublicHttpMediaUrl('http://127.0.0.1/a.png'), false);
  assert.equal(isPublicHttpMediaUrl('http://10.1.2.3/a.png'), false);
  assert.equal(isPublicHttpMediaUrl('http://192.168.1.2/a.png'), false);
  assert.equal(isPublicHttpMediaUrl('https://printer.local/a.png'), false);
  assert.equal(isPublicHttpMediaUrl('file:///tmp/a.png'), false);
  assert.equal(isReusableModelApiMediaUrl('asset://provider/123'), true);
  assert.equal(isReusableModelApiMediaUrl('https://cdn.test/a.png'), true);
  assert.equal(isReusableModelApiMediaUrl('http://127.0.0.1/a.png'), false);
});

test('mediaInputUploadRouter: resolves configured, custom, and fallback providers', () => {
  assert.equal(DEFAULT_MODEL_API_MEDIA_UPLOAD_PROVIDERS.image, 'freeImageHost');
  assert.equal(DEFAULT_MODEL_API_MEDIA_UPLOAD_PROVIDERS.video, 'runninghub');
  assert.deepEqual(
    resolveUserMediaStorageUploadTarget(
      {
        resolveUserMediaStorageUploadTarget: () => ({ provider: 'custom-provider' }),
      },
      {},
      'image',
    ),
    { provider: 'custom-provider' },
  );
  assert.deepEqual(
    resolveUserMediaStorageUploadTarget({}, { forceProviderUpload: true, mediaKind: 'video' }),
    { provider: 'runninghub' },
  );
  assert.deepEqual(
    resolveUserMediaStorageUploadTarget(
      {},
      { forceProviderUpload: true, fallbackProvider: 'fallback-provider' },
      'audio',
    ),
    { provider: 'fallback-provider' },
  );
});

test('mediaInputUploadRouter: resolves RunningHub keys from inline and provider config', () => {
  assert.equal(resolveRunningHubMediaUploadApiKey({}, { apiKey: ' Bearer abc ' }), 'abc');
  assert.equal(
    resolveRunningHubMediaUploadApiKey(
      {
        getProviderConfig(profileId) {
          assert.equal(profileId, 'profile-1');
          return { modelApiKey: 'Bearer config-key' };
        },
      },
      { providerProfileId: 'profile-1' },
    ),
    'config-key',
  );
  assert.equal(resolveRunningHubMediaUploadApiKey({}, {}), '');
});

test('mediaInputUploadRouter: reuses asset URLs and uploads only unresolved media', async () => {
  const calls = [];
  const result = await uploadModelApiMediaInputs(
    'image',
    ['asset://provider/a', 'https://cdn.test/b.png', 'https://cdn.test/c.png'],
    {
      resolveUserMediaStorageUploadTarget: () => ({ provider: 'custom-provider', apiKey: 'key-1' }),
      async processInputImages(urls, apiKey, options) {
        calls.push({ urls, apiKey, options });
        return ['https://uploaded.test/1.png', 'https://uploaded.test/2.png'];
      },
    },
    {
      uploadOptions: { folder: 'images' },
    },
  );

  assert.deepEqual(result, [
    'asset://provider/a',
    'https://uploaded.test/1.png',
    'https://uploaded.test/2.png',
  ]);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].urls, ['https://cdn.test/b.png', 'https://cdn.test/c.png']);
  assert.equal(calls[0].apiKey, 'key-1');
  assert.equal(calls[0].options.provider, 'custom-provider');
  assert.equal(calls[0].options.strictUpload, true);
  assert.equal(calls[0].options.folder, 'images');
});

test('mediaInputUploadRouter: validates kind and strict upload completeness', async () => {
  assert.deepEqual(await uploadModelApiMediaInputs('image', [], {}, {}), []);
  await assert.rejects(
    () => uploadModelApiMediaInputs('document', ['https://cdn.test/a'], {}, {}),
    /Unsupported media upload kind/,
  );
  await assert.rejects(
    () =>
      uploadModelApiMediaInputs(
        'video',
        ['https://cdn.test/a.mp4', 'https://cdn.test/b.mp4'],
        {
          resolveUserMediaStorageUploadTarget: () => ({ provider: 'runninghub', apiKey: 'key' }),
          async processInputVideos() {
            return ['https://uploaded.test/a.mp4'];
          },
        },
        {
          reusePublicUrls: false,
        },
      ),
    /第 2 项未返回有效地址/,
  );
  await assert.rejects(
    () =>
      uploadModelApiMediaInputs(
        'audio',
        ['https://cdn.test/a.mp3'],
        {
          resolveUserMediaStorageUploadTarget: () => ({ provider: 'runninghub' }),
          async processInputAudios() {},
        },
        {
          reusePublicUrls: false,
        },
      ),
    /RunningHub API Key/,
  );
});
