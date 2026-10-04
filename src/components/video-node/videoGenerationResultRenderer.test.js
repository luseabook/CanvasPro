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
  const videoGenerationResult = normalizeVideoGenerationResult({
    url: 'https://cdn.example.com/final.mp4',
    localPath: 'output/final.mp4',
    thumbUrl: '/output/final.jpg',
  });
  (assert.equal(videoGenerationResult.outputType, 'video'),
    assert.equal(videoGenerationResult.items.length, 1),
    assert.equal(videoGenerationResult.items[0].videoUrl, 'https://cdn.example.com/final.mp4'),
    assert.equal(videoGenerationResult.items[0].localPath, 'output/final.mp4'),
    assert.equal(videoGenerationResult.items[0].thumbUrl, '/output/final.jpg'));
}),
  test('video generation result renderer: builds success patch from batch', () => {
    const videoGenerationResultPatch = buildVideoGenerationResultPatch(
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
    (assert.equal(videoGenerationResultPatch.jobStatus, 'success'),
      assert.equal(videoGenerationResultPatch.jobError, null),
      assert.equal(videoGenerationResultPatch.videos.length, 2),
      assert.equal(videoGenerationResultPatch.videoUrl, '/output/a.mp4'),
      assert.equal(videoGenerationResultPatch.localPath, 'output/a.mp4'),
      assert.equal(videoGenerationResultPatch.displayLocalPath, 'data/assets/derived/video/a.proxy.mp4'),
      assert.equal(videoGenerationResultPatch.posterLocalPath, 'data/assets/derived/video/a.poster.jpg'),
      assert.equal(videoGenerationResultPatch.videoProxyStatus, 'generated'),
      assert.equal(videoGenerationResultPatch.thumbId, 'thumb-a'),
      assert.equal(videoGenerationResultPatch.mainVideoIndex, 0),
      assert.equal(videoGenerationResultPatch.isVideosExpanded, false));
  }),
  test('video generation result renderer: builds failure patch', () => {
    const videoGenerationFailurePatch = buildVideoGenerationFailurePatch({
      error: 'provider rejected',
      startedAt: Date.now() - 10,
    });
    (assert.equal(videoGenerationFailurePatch.jobStatus, 'error'),
      assert.equal(videoGenerationFailurePatch.jobError, 'provider rejected'),
      assert.equal(videoGenerationFailurePatch.videos.length, 1),
      assert.equal(videoGenerationFailurePatch.videos[0].error, 'provider rejected'),
      assert.equal(videoGenerationFailurePatch.videoUrl, ''),
      assert.equal(videoGenerationFailurePatch.localPath, ''),
      assert.equal(getVideoGenerationResultError({ error: 'provider rejected' }), 'provider rejected'),
      assert.deepEqual(getSuccessfulVideoGenerationItems({ error: 'provider rejected' }), []));
  }),
  test('video generation result renderer: failure helper can preserve media fields', () => {
    const videoGenerationFailurePatch2 = buildVideoGenerationFailurePatch({
      error: 'resume failed',
      duration: 0x4b0,
      clearMediaFields: false,
    });
    (assert.equal(videoGenerationFailurePatch2.jobStatus, 'error'),
      assert.equal(videoGenerationFailurePatch2.jobError, 'resume failed'),
      assert.equal(videoGenerationFailurePatch2.videos[0].error, 'resume failed'),
      assert.equal(Object.prototype.hasOwnProperty.call(videoGenerationFailurePatch2, 'videoUrl'), false),
      assert.equal(Object.prototype.hasOwnProperty.call(videoGenerationFailurePatch2, 'localPath'), false));
  }),
  test('video generation result renderer: localizes default failure message', () => {
    setLocale('en-US', { persist: false, notify: false });
    try {
      const videoGenerationFailurePatch3 = buildVideoGenerationFailurePatch();
      (assert.equal(videoGenerationFailurePatch3.jobStatus, 'error'),
        assert.equal(videoGenerationFailurePatch3.jobError, 'Generation failed'),
        assert.equal(videoGenerationFailurePatch3.videos[0].error, 'Generation failed'));
    } finally {
      setLocale('zh-CN', { persist: false, notify: false });
    }
  }));
