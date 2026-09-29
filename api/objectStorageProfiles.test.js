import test from 'node:test';
import assert from 'node:assert/strict';

import {
  detectObjectStorageProviderId,
  isObjectStorageProviderVerified,
  markObjectStorageProviderVerified,
  normalizeObjectStorageProfile,
  normalizeObjectStorageSettings,
  resolveObjectStorageConfig,
  updateObjectStorageProviderProfile,
} from './objectStorageProfiles.js';

test('objectStorageProfiles: detects provider ids from explicit values and endpoints', () => {
  assert.equal(detectObjectStorageProviderId({ providerId: 'tencent-cos' }), 'tencent-cos');
  assert.equal(
    detectObjectStorageProviderId({ endpoint: 'https://account.r2.cloudflarestorage.com' }),
    'cloudflare-r2',
  );
  assert.equal(
    detectObjectStorageProviderId({ endpoint: 'https://cos.ap-shanghai.myqcloud.com' }),
    'tencent-cos',
  );
  assert.equal(detectObjectStorageProviderId({ endpoint: 'https://s3.example.test' }), 's3-compatible');
  assert.equal(detectObjectStorageProviderId({}), 'cloudflare-r2');
});

test('objectStorageProfiles: normalizes provider defaults and verification state', () => {
  assert.deepEqual(normalizeObjectStorageProfile({ endpoint: 'https://r2.test///' }, 'cloudflare-r2'), {
    endpoint: 'https://r2.test',
    region: 'auto',
    bucket: '',
    accessKeyId: '',
    secretAccessKey: '',
    sessionToken: '',
    publicBaseUrl: '',
    addressingStyle: 'path',
  });

  const verified = markObjectStorageProviderVerified(
    {
      enabled: true,
      providerId: 'tencent-cos',
      profiles: {
        'tencent-cos': {
          endpoint: 'https://cos.example.test',
          region: 'ap-shanghai',
          bucket: 'assets',
        },
      },
    },
    'tencent-cos',
    { verifiedAt: 123 },
  );
  assert.equal(isObjectStorageProviderVerified(verified), true);
  assert.equal(normalizeObjectStorageSettings({ ...verified, enabled: true }).enabled, true);
});

test('objectStorageProfiles: changing credentials invalidates verification and resolves native endpoints', () => {
  const initial = {
    enabled: true,
    providerId: 'tencent-cos',
    profiles: {
      'tencent-cos': {
        endpoint: 'https://ignored.example.test',
        region: 'ap-shanghai',
        bucket: 'assets',
        connectionVerification: { status: 'passed', verifiedAt: 10 },
      },
    },
  };

  const changed = updateObjectStorageProviderProfile(initial, 'tencent-cos', {
    accessKeyId: 'new-key',
  });
  assert.equal(isObjectStorageProviderVerified(changed), false);
  assert.deepEqual(resolveObjectStorageConfig(changed), {
    enabled: false,
    provider: 's3',
    providerId: 'tencent-cos',
    endpoint: 'https://cos.ap-shanghai.myqcloud.com',
    region: 'ap-shanghai',
    location: 'ap-shanghai',
    bucket: 'assets',
    accessKeyId: 'new-key',
    secretAccessKey: '',
    sessionToken: '',
    publicBaseUrl: '',
    pathPrefix: 'SHUO-Canvas',
    addressingStyle: 'virtual-hosted',
  });
});
