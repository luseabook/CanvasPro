import test from 'node:test';
import assert from 'node:assert/strict';

import { VideoCutServiceError, cutVideoRangeToLocal } from './videoCutService.js';

test('videoCutService: rejects missing sources with a structured error', async () => {
  await assert.rejects(cutVideoRangeToLocal({ src: '   ', startSec: 0, endSec: 1 }), (error) => {
    assert.equal(error instanceof VideoCutServiceError, true);
    assert.equal(error.name, 'VideoCutServiceError');
    assert.equal(error.code, 'invalid_range');
    assert.match(error.message, /Invalid video cut range/);
    return true;
  });
});

test('videoCutService: rejects empty or reversed ranges', async () => {
  await assert.rejects(
    cutVideoRangeToLocal({ src: 'C:/video.mp4', startSec: 2, endSec: 2 }),
    /Invalid video cut range/,
  );
  await assert.rejects(
    cutVideoRangeToLocal({ src: 'C:/video.mp4', startSec: 3, endSec: 1 }),
    /Invalid video cut range/,
  );
});
