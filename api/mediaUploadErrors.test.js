import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING,
  RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING_MESSAGE,
  createRunningHubMediaUploadApiKeyMissingError,
  isRunningHubMediaUploadApiKeyMissingError,
} from './mediaUploadErrors.js';

test('exposes the stable error code and user-facing message', () => {
  assert.equal(RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING, 'RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING');
  assert.equal(
    RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING_MESSAGE,
    '需要配置 RunningHub API Key 用于上传视频/音频',
  );
});

test('createRunningHubMediaUploadApiKeyMissingError builds a tagged, non-retryable Error', () => {
  const error = createRunningHubMediaUploadApiKeyMissingError('video');
  assert.ok(error instanceof Error);
  assert.equal(error.name, 'RunningHubMediaUploadApiKeyMissingError');
  assert.equal(error.message, RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING_MESSAGE);
  assert.equal(error.code, RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING);
  assert.equal(error.provider, 'runninghub');
  assert.equal(error.kind, 'video');
  assert.equal(error.retryable, false);
});

test('createRunningHubMediaUploadApiKeyMissingError defaults kind to empty string', () => {
  assert.equal(createRunningHubMediaUploadApiKeyMissingError().kind, '');
});

test('isRunningHubMediaUploadApiKeyMissingError recognises the code only', () => {
  assert.equal(
    isRunningHubMediaUploadApiKeyMissingError(createRunningHubMediaUploadApiKeyMissingError('audio')),
    true,
  );
  assert.equal(
    isRunningHubMediaUploadApiKeyMissingError({ code: RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING }),
    true,
  );
  assert.equal(isRunningHubMediaUploadApiKeyMissingError(new Error('other')), false);
  assert.equal(isRunningHubMediaUploadApiKeyMissingError({}), false);
  assert.equal(isRunningHubMediaUploadApiKeyMissingError(null), false);
});
