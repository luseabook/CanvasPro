import test from 'node:test';
import assert from 'node:assert/strict';

import { ErrorType } from './errors/ApiError.js';
import { createMediaUploadError, getMediaKindLabel } from './mediaUploadErrorDetails.js';

test('mediaUploadErrorDetails: labels supported media kinds', () => {
  assert.equal(getMediaKindLabel('image'), '图片');
  assert.equal(getMediaKindLabel('video'), '视频');
  assert.equal(getMediaKindLabel('audio'), '音频');
  assert.equal(getMediaKindLabel('unknown'), '素材');
});

test('mediaUploadErrorDetails: preserves cancellation errors', () => {
  const aborted = new DOMException('Request aborted', 'AbortError');
  assert.equal(createMediaUploadError(aborted), aborted);

  const cancelled = new Error('CANCELLED');
  assert.equal(createMediaUploadError(cancelled), cancelled);
});

test('mediaUploadErrorDetails: creates actionable timeout errors and preserves metadata', () => {
  const original = Object.assign(new Error('gateway timeout'), {
    type: ErrorType.TIMEOUT,
    code: 'UPSTREAM_TIMEOUT',
    status: 504,
    provider: 'remote',
    retryable: true,
  });
  const error = createMediaUploadError(original, { kind: 'video', label: '源视频上传失败' });

  assert.match(error.message, /源视频上传失败：请求超时/);
  assert.match(error.message, /视频较大时可先压缩或裁剪/);
  assert.match(error.message, /HTTP 504/);
  assert.equal(error.cause, original);
  assert.equal(error.type, ErrorType.TIMEOUT);
  assert.equal(error.code, 'UPSTREAM_TIMEOUT');
  assert.equal(error.status, 504);
  assert.equal(error.provider, 'remote');
  assert.equal(error.retryable, true);
});
