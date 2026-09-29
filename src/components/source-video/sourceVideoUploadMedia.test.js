import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSourceVideoUploadSizePatch,
  createVideoCapturePreviewUrl,
  readVideoFileNaturalSize,
  waitForNextPaint,
} from './sourceVideoUploadMedia.js';

function withGlobals(values, callback) {
  const previous = new Map();
  for (const [key, value] of Object.entries(values)) {
    previous.set(key, globalThis[key]);
    globalThis[key] = value;
  }
  return Promise.resolve(callback()).finally(() => {
    for (const [key, value] of previous) {
      if (typeof value === 'undefined') delete globalThis[key];
      else globalThis[key] = value;
    }
  });
}

test('sourceVideoUploadMedia: builds an auto-resized upload size patch', () => {
  assert.deepEqual(buildSourceVideoUploadSizePatch(null, { width: 1920, height: 1080 }), {
    width: 512,
    height: 288,
    videoWidth: 1920,
    videoHeight: 1080,
    needsAutoResize: false,
  });
  assert.deepEqual(buildSourceVideoUploadSizePatch({ width: 0, height: 1 }), {
    needsAutoResize: true,
  });
});

test('sourceVideoUploadMedia: reads metadata and revokes the object URL', async () => {
  let revoked = '';
  let loadCount = 0;
  const video = {
    preload: '',
    muted: false,
    videoWidth: 1920,
    videoHeight: 1080,
    duration: 5,
    onloadedmetadata: null,
    onerror: null,
    _src: '',
    removeAttribute(name) {
      if (name === 'src') this._src = '';
    },
    load() {
      loadCount += 1;
    },
    set src(value) {
      this._src = value;
      queueMicrotask(() => this.onloadedmetadata?.());
    },
    get src() {
      return this._src;
    },
  };
  const documentLike = {
    createElement(tagName) {
      assert.equal(tagName, 'video');
      return video;
    },
  };
  const windowLike = {
    URL: {
      createObjectURL() {
        return 'blob:video-source';
      },
      revokeObjectURL(value) {
        revoked = value;
      },
    },
  };

  const result = await withGlobals({ document: documentLike, window: windowLike }, () =>
    readVideoFileNaturalSize({ name: 'clip.mp4' }),
  );

  assert.deepEqual(result, { width: 1920, height: 1080, duration: 5 });
  assert.equal(video.preload, 'metadata');
  assert.equal(video.muted, true);
  assert.equal(loadCount, 1);
  assert.equal(revoked, 'blob:video-source');
});

test('sourceVideoUploadMedia: returns null when object URLs are unavailable', async () => {
  const result = await withGlobals(
    {
      document: { createElement: () => ({}) },
      window: { URL: {} },
    },
    () => readVideoFileNaturalSize({ name: 'clip.mp4' }),
  );

  assert.equal(result, null);
});

test('sourceVideoUploadMedia: creates preview URLs only for video files', async () => {
  const windowLike = {
    URL: {
      createObjectURL(file) {
        return `blob:${file.type}`;
      },
    },
  };

  await withGlobals({ window: windowLike }, () => {
    assert.equal(createVideoCapturePreviewUrl({ type: 'video/mp4' }), 'blob:video/mp4');
    assert.equal(createVideoCapturePreviewUrl({ type: 'image/png' }), '');
    assert.equal(createVideoCapturePreviewUrl(null), '');
  });
});

test('sourceVideoUploadMedia: waits for the next animation frame', async () => {
  let frames = 0;
  await withGlobals(
    {
      window: {
        requestAnimationFrame(callback) {
          frames += 1;
          callback();
        },
      },
    },
    () => waitForNextPaint(),
  );

  assert.equal(frames, 1);
});
