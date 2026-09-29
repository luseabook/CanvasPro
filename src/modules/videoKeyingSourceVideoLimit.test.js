import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  VIDEO_KEYING_MAX_SOURCE_VIDEO_BYTES,
  getVideoKeyingMaxSourceVideoMB,
  isVideoKeyingSourceVideoTooLarge,
  resolveVideoKeyingSourceVideoSizeBytes,
} from './videoKeyingSourceVideoLimit.js';

test('exposes a 30 MiB source video ceiling', () => {
  assert.equal(VIDEO_KEYING_MAX_SOURCE_VIDEO_BYTES, 30 * 1024 * 1024);
  assert.equal(getVideoKeyingMaxSourceVideoMB(), 30);
});

test('resolves the first positive finite size field in priority order', () => {
  assert.equal(resolveVideoKeyingSourceVideoSizeBytes({ videoSizeBytes: 5 }), 5);
  assert.equal(resolveVideoKeyingSourceVideoSizeBytes({ videoByteSize: 7 }), 7);
  assert.equal(resolveVideoKeyingSourceVideoSizeBytes({ fileSize: 9 }), 9);
  assert.equal(resolveVideoKeyingSourceVideoSizeBytes({ sizeBytes: 11 }), 11);
  assert.equal(resolveVideoKeyingSourceVideoSizeBytes({ byteSize: 13 }), 13);
  assert.equal(resolveVideoKeyingSourceVideoSizeBytes({ videoSizeBytes: 1, fileSize: 2, byteSize: 3 }), 1);
});

test('skips non-positive and non-finite size fields', () => {
  assert.equal(
    resolveVideoKeyingSourceVideoSizeBytes({
      videoSizeBytes: 0,
      videoByteSize: -1,
      fileSize: NaN,
      sizeBytes: Infinity,
      byteSize: 42,
    }),
    42,
  );
});

test('coerces numeric strings and falls back to zero', () => {
  assert.equal(resolveVideoKeyingSourceVideoSizeBytes({ fileSize: '2048' }), 2048);
  assert.equal(resolveVideoKeyingSourceVideoSizeBytes({ fileSize: 'not-a-number' }), 0);
  assert.equal(resolveVideoKeyingSourceVideoSizeBytes({}), 0);
  assert.equal(resolveVideoKeyingSourceVideoSizeBytes(), 0);
  assert.equal(resolveVideoKeyingSourceVideoSizeBytes(null), 0);
});

test('flags only sizes strictly above the ceiling', () => {
  assert.equal(
    isVideoKeyingSourceVideoTooLarge({ videoSizeBytes: VIDEO_KEYING_MAX_SOURCE_VIDEO_BYTES }),
    false,
  );
  assert.equal(
    isVideoKeyingSourceVideoTooLarge({ videoSizeBytes: VIDEO_KEYING_MAX_SOURCE_VIDEO_BYTES + 1 }),
    true,
  );
  assert.equal(isVideoKeyingSourceVideoTooLarge({ videoSizeBytes: 0 }), false);
  assert.equal(isVideoKeyingSourceVideoTooLarge({}), false);
});
