import test from 'node:test';
import assert from 'node:assert/strict';

import {
  OBJECT_STORAGE_UPLOAD_PATH,
  isConfiguredObjectStoragePublicUrl,
  normalizeObjectStorageConfig,
  uploadToConfiguredObjectStorage,
  validateObjectStorageConfig,
} from './objectStorageApi.js';

const objectStorageConfig = {
  enabled: true,
  providerId: 'cloudflare-r2',
  profiles: {
    'cloudflare-r2': {
      endpoint: 'https://account.r2.cloudflarestorage.com/',
      region: 'auto',
      bucket: 'assets',
      accessKeyId: 'access-key',
      secretAccessKey: 'secret-key',
      publicBaseUrl: 'https://cdn.test/base/',
      connectionVerification: { status: 'passed', verifiedAt: 1 },
    },
  },
};

test('objectStorageApi: normalizes, validates, and scopes public URLs', () => {
  const normalized = normalizeObjectStorageConfig(objectStorageConfig);
  assert.equal(normalized.enabled, true);
  assert.equal(normalized.endpoint, 'https://account.r2.cloudflarestorage.com');
  assert.equal(normalized.publicBaseUrl, 'https://cdn.test/base');
  assert.equal(normalized.pathPrefix, 'SHUO-Canvas');

  assert.equal(validateObjectStorageConfig(objectStorageConfig).bucket, 'assets');
  assert.equal(
    isConfiguredObjectStoragePublicUrl('https://cdn.test/base/images/a.png', objectStorageConfig),
    true,
  );
  assert.equal(
    isConfiguredObjectStoragePublicUrl('https://other.test/base/images/a.png', objectStorageConfig),
    false,
  );
  assert.throws(
    () =>
      validateObjectStorageConfig({
        ...objectStorageConfig,
        profiles: {
          'cloudflare-r2': {
            ...objectStorageConfig.profiles['cloudflare-r2'],
            endpoint: 'file:///tmp/object-store',
          },
        },
      }),
    /Endpoint/,
  );
});

test('objectStorageApi: uploads media through the configured backend', async () => {
  const originalFetch = globalThis.fetch;
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return new Response(JSON.stringify({ url: 'https://cdn.test/base/image.png' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  try {
    const file = new Blob(['image'], { type: 'image/png' });
    const url = await uploadToConfiguredObjectStorage(file, {
      config: objectStorageConfig,
      fileName: 'photo.png',
    });

    assert.equal(url, 'https://cdn.test/base/image.png');
    assert.equal(captured.url, OBJECT_STORAGE_UPLOAD_PATH);
    assert.equal(captured.options.method, 'POST');
    assert.ok(captured.options.body instanceof FormData);
    assert.equal(captured.options.body.get('mediaKind'), 'image');
    assert.equal(JSON.parse(captured.options.body.get('config')).bucket, 'assets');
    assert.equal(captured.options.body.get('file').name, 'photo.png');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
