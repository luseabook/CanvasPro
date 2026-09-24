import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getRunningHubUploadErrorMessage,
  getRunningHubUploadUrl,
  hasRunningHubUploadFailureCode,
  isRunningHubUploadResponseSuccessful,
} from './runningHubUploadResponse.js';

test('hasRunningHubUploadFailureCode treats missing or blank codes as no failure', () => {
  assert.equal(hasRunningHubUploadFailureCode(undefined), false);
  assert.equal(hasRunningHubUploadFailureCode(null), false);
  assert.equal(hasRunningHubUploadFailureCode({}), false);
  assert.equal(hasRunningHubUploadFailureCode({ code: null }), false);
  assert.equal(hasRunningHubUploadFailureCode({ code: '  ' }), false);
});

test('hasRunningHubUploadFailureCode accepts 0/200/ok/success case-insensitively', () => {
  assert.equal(hasRunningHubUploadFailureCode({ code: 0 }), false);
  assert.equal(hasRunningHubUploadFailureCode({ code: 200 }), false);
  assert.equal(hasRunningHubUploadFailureCode({ code: ' 0 ' }), false);
  assert.equal(hasRunningHubUploadFailureCode({ code: 'OK' }), false);
  assert.equal(hasRunningHubUploadFailureCode({ code: 'Success' }), false);
});

test('hasRunningHubUploadFailureCode flags any other code', () => {
  assert.equal(hasRunningHubUploadFailureCode({ code: 500 }), true);
  assert.equal(hasRunningHubUploadFailureCode({ code: 'error' }), true);
});

test('getRunningHubUploadErrorMessage picks the first non-empty message and appends code', () => {
  assert.equal(getRunningHubUploadErrorMessage({ message: ' boom ', code: 500 }), 'boom (code: 500)');
  assert.equal(getRunningHubUploadErrorMessage({ msg: 'x' }), 'x');
  assert.equal(getRunningHubUploadErrorMessage({ data: { errorMessage: 'e' } }), 'e');
  assert.equal(getRunningHubUploadErrorMessage({ message: 123, msg: 'm' }), 'm');
  assert.equal(getRunningHubUploadErrorMessage({ message: 'top', data: { message: 'nested' } }), 'top');
});

test('getRunningHubUploadErrorMessage falls back to 未知错误', () => {
  assert.equal(getRunningHubUploadErrorMessage({}), '未知错误');
  assert.equal(getRunningHubUploadErrorMessage(null), '未知错误');
  assert.equal(getRunningHubUploadErrorMessage({ code: 1 }), '未知错误 (code: 1)');
});

test('getRunningHubUploadUrl prefers data fields in documented order and trims', () => {
  assert.equal(getRunningHubUploadUrl({ data: { url: 'b', downloadUrl: 'a' } }), 'a');
  assert.equal(getRunningHubUploadUrl({ data: { download_url: 'd', fileUrl: 'f' } }), 'd');
  assert.equal(getRunningHubUploadUrl({ url: 'top', data: { url: 'nested' } }), 'nested');
  assert.equal(getRunningHubUploadUrl({ data: { url: ' u ' } }), 'u');
});

test('getRunningHubUploadUrl falls back to top-level fields, then empty string', () => {
  assert.equal(getRunningHubUploadUrl({ fileUrl: 'f' }), 'f');
  assert.equal(getRunningHubUploadUrl({ file_url: 'g' }), 'g');
  assert.equal(getRunningHubUploadUrl({}), '');
  assert.equal(getRunningHubUploadUrl(null), '');
});

test('isRunningHubUploadResponseSuccessful requires no failure code and a URL', () => {
  assert.equal(isRunningHubUploadResponseSuccessful({ code: 0, data: { url: 'u' } }), true);
  assert.equal(isRunningHubUploadResponseSuccessful({ url: 'u' }), true);
  assert.equal(isRunningHubUploadResponseSuccessful({ code: 500, data: { url: 'u' } }), false);
  assert.equal(isRunningHubUploadResponseSuccessful({ code: 0 }), false);
});
