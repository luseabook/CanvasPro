import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVideoGenerationFailurePatch,
  buildVideoGenerationResultPatch,
  getSuccessfulVideoGenerationItems,
  getVideoGenerationResultError,
  normalizeVideoGenerationResult,
} from './videoGenerationResultRenderer.js';
import { setLocale } from '../../i18n/index.js';
(test('video generation result renderer: normalizes single video result', () => {
  const _0x563ae4 = normalizeVideoGenerationResult({
    url: 'https://cdn.example.com/final.mp4',
    localPath: 'output/final.mp4',
    thumbUrl: '/output/final.jpg',
  });
  (assert.equal(_0x563ae4.outputType, 'video'),
    assert.equal(_0x563ae4.items.length, 1),
    assert.equal(_0x563ae4.items[0].videoUrl, 'https://cdn.example.com/final.mp4'),
    assert.equal(_0x563ae4.items[0].localPath, 'output/final.mp4'),
    assert.equal(_0x563ae4.items[0].thumbUrl, '/output/final.jpg'));
}),
  test('video generation result renderer: builds success patch from batch', () => {
    const _0x43382d = buildVideoGenerationResultPatch(
      {
        isBatch: true,
        videos: [
          {
            videoUrl: '/output/a.mp4',
            localPath: 'output/a.mp4',
            displayLocalPath: 'data/assets/derived/video/a.proxy.mp4',
            posterLocalPath: 'data/assets/derived/video/a.poster.jpg',
            videoProxyStatus: 'generated',
            thumbId: 'thumb-a',
          },
          { videoUrl: '/output/b.mp4', localPath: 'output/b.mp4' },
        ],
      },
      { startedAt: Date.now() - 10 },
    );
    (assert.equal(_0x43382d.jobStatus, 'success'),
      assert.equal(_0x43382d.jobError, null),
      assert.equal(_0x43382d.videos.length, 2),
      assert.equal(_0x43382d.videoUrl, '/output/a.mp4'),
      assert.equal(_0x43382d.localPath, 'output/a.mp4'),
      assert.equal(_0x43382d.displayLocalPath, 'data/assets/derived/video/a.proxy.mp4'),
      assert.equal(_0x43382d.posterLocalPath, 'data/assets/derived/video/a.poster.jpg'),
      assert.equal(_0x43382d.videoProxyStatus, 'generated'),
      assert.equal(_0x43382d.thumbId, 'thumb-a'),
      assert.equal(_0x43382d.mainVideoIndex, 0),
      assert.equal(_0x43382d.isVideosExpanded, false));
  }),
  test('video generation result renderer: builds failure patch', () => {
    const _0x3cc897 = buildVideoGenerationFailurePatch({
      error: 'provider rejected',
      startedAt: Date.now() - 10,
    });
    (assert.equal(_0x3cc897.jobStatus, 'error'),
      assert.equal(_0x3cc897.jobError, 'provider rejected'),
      assert.equal(_0x3cc897.videos.length, 1),
      assert.equal(_0x3cc897.videos[0].error, 'provider rejected'),
      assert.equal(_0x3cc897.videoUrl, ''),
      assert.equal(_0x3cc897.localPath, ''),
      assert.equal(getVideoGenerationResultError({ error: 'provider rejected' }), 'provider rejected'),
      assert.deepEqual(getSuccessfulVideoGenerationItems({ error: 'provider rejected' }), []));
  }),
  test('video generation result renderer: failure helper can preserve media fields', () => {
    const _0x1a4e2a = buildVideoGenerationFailurePatch({
      error: 'resume failed',
      duration: 0x4b0,
      clearMediaFields: false,
    });
    (assert.equal(_0x1a4e2a.jobStatus, 'error'),
      assert.equal(_0x1a4e2a.jobError, 'resume failed'),
      assert.equal(_0x1a4e2a.videos[0].error, 'resume failed'),
      assert.equal(Object.prototype.hasOwnProperty.call(_0x1a4e2a, 'videoUrl'), false),
      assert.equal(Object.prototype.hasOwnProperty.call(_0x1a4e2a, 'localPath'), false));
  }),
  test('video generation result renderer: localizes default failure message', () => {
    setLocale('en-US', { persist: false, notify: false });
    try {
      const _0x58b1c7 = buildVideoGenerationFailurePatch();
      (assert.equal(_0x58b1c7.jobStatus, 'error'),
        assert.equal(_0x58b1c7.jobError, 'Generation failed'),
        assert.equal(_0x58b1c7.videos[0].error, 'Generation failed'));
    } finally {
      setLocale('zh-CN', { persist: false, notify: false });
    }
  }));
