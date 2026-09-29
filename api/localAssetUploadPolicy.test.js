import test from 'node:test';
import assert from 'node:assert/strict';

import { assertLocalAssetUploadSize, parseLocalAssetUploadError } from './localAssetUploadPolicy.js';

test('localAssetUploadPolicy: rejects files over the 300 MB client limit', () => {
  assert.doesNotThrow(() => assertLocalAssetUploadSize({ size: 300 * 1024 * 1024 }));
  assert.throws(
    () => assertLocalAssetUploadSize({ size: 300 * 1024 * 1024 + 1 }),
    (error) => error.code === 'UPLOAD_TOO_LARGE' && error.status === 413,
  );
});

test('localAssetUploadPolicy: maps server and filesystem upload failures', () => {
  const tooLarge = parseLocalAssetUploadError('', null, 413);
  assert.equal(tooLarge.code, 'UPLOAD_TOO_LARGE');
  assert.equal(tooLarge.retryable, false);

  const diskFull = parseLocalAssetUploadError(null, 'ENOSPC: no space left on device', 0);
  assert.equal(diskFull.code, 'UPLOAD_DISK_FULL');
  assert.equal(diskFull.retryable, false);

  const incomplete = parseLocalAssetUploadError(null, 'Upload is incomplete', 0);
  assert.equal(incomplete.code, 'UPLOAD_INCOMPLETE');
  assert.equal(incomplete.retryable, true);

  const permission = parseLocalAssetUploadError(null, 'EACCES: permission denied', 0);
  assert.equal(permission.code, 'UPLOAD_PERMISSION_DENIED');

  const staging = parseLocalAssetUploadError(null, 'Unable to allocate staged upload', 0);
  assert.equal(staging.code, 'UPLOAD_STAGING_FAILED');
});
