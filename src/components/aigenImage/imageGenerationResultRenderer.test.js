import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildImageGenerationFailurePatch,
  buildImageGenerationResultPatch,
  getImageGenerationResultError,
  getSuccessfulImageGenerationItems,
  normalizeImageGenerationResult,
} from './imageGenerationResultRenderer.js';
(test('image generation result renderer: legacy single image builds node patch', () => {
  const startedAt = Date.now() - 25,
    imageGenerationResultPatch = buildImageGenerationResultPatch(
      {
        imageUrl: '/output/final.png',
        sourceUrl: 'https://img.example.com/final.png',
        thumbUrl: '/output/final-thumb.png',
        localPath: 'output/final.png',
        originalWidth: 0x500,
        originalHeight: 0x2d0,
      },
      { startedAt: startedAt },
    );
  (assert.equal(imageGenerationResultPatch.jobStatus, 'success'),
    assert.equal(imageGenerationResultPatch.jobError, null),
    assert.equal(imageGenerationResultPatch.images.length, 1),
    assert.equal(imageGenerationResultPatch.imageUrl, '/output/final.png'),
    assert.equal(imageGenerationResultPatch.sourceUrl, 'https://img.example.com/final.png'),
    assert.equal(imageGenerationResultPatch.thumbUrl, '/output/final-thumb.png'),
    assert.equal(imageGenerationResultPatch.localPath, 'output/final.png'),
    assert.equal(imageGenerationResultPatch.originalWidth, 0x500),
    assert.equal(imageGenerationResultPatch.originalHeight, 0x2d0),
    assert.equal(imageGenerationResultPatch.mainImageIndex, 0),
    assert.equal(imageGenerationResultPatch.isImagesExpanded, false));
}),
  test('image generation result renderer: legacy batch result writes images and first item', () => {
    const imageGenerationResultPatch2 = buildImageGenerationResultPatch(
      {
        isBatch: true,
        images: [
          { imageUrl: '/output/a.png', localPath: 'output/a.png' },
          { imageUrl: '/output/b.png', localPath: 'output/b.png' },
        ],
      },
      { startedAt: Date.now() - 10 },
    );
    (assert.equal(imageGenerationResultPatch2.jobStatus, 'success'),
      assert.equal(imageGenerationResultPatch2.images.length, 2),
      assert.equal(imageGenerationResultPatch2.imageUrl, '/output/a.png'),
      assert.equal(imageGenerationResultPatch2.localPath, 'output/a.png'),
      assert.equal(imageGenerationResultPatch2.images[1].imageUrl, '/output/b.png'));
  }),
  test('image generation result renderer: mixed batch keeps successful images', () => {
    const value = {
        isBatch: true,
        images: [
          { error: 'policy rejected', imageUrl: '', thumbUrl: '' },
          { imageUrl: '/output/a.png', localPath: 'output/a.png' },
          { imageUrl: '/output/b.png', localPath: 'output/b.png' },
        ],
      },
      imageGenerationResultPatch3 = buildImageGenerationResultPatch(value, { startedAt: Date.now() - 10 });
    (assert.equal(getImageGenerationResultError(value), ''),
      assert.equal(imageGenerationResultPatch3.jobStatus, 'success'),
      assert.equal(imageGenerationResultPatch3.jobError, null),
      assert.equal(imageGenerationResultPatch3.images.length, 3),
      assert.equal(imageGenerationResultPatch3.mainImageIndex, 1),
      assert.equal(imageGenerationResultPatch3.imageUrl, '/output/a.png'),
      assert.equal(imageGenerationResultPatch3.localPath, 'output/a.png'),
      assert.equal(imageGenerationResultPatch3.images[0].error, 'policy rejected'),
      assert.deepEqual(
        getSuccessfulImageGenerationItems(value).map((item) => item.imageUrl),
        ['/output/a.png', '/output/b.png'],
      ));
  }),
  test('image generation result renderer: canonical image result is accepted', () => {
    const imageGenerationResult = normalizeImageGenerationResult({
        outputType: 'image',
        items: [
          {
            url: 'https://img.example.com/a.png',
            localPath: 'output/a.png',
            metadata: { provider: 'apimart' },
          },
        ],
      }),
      imageGenerationResultPatch4 = buildImageGenerationResultPatch(imageGenerationResult, {
        startedAt: Date.now() - 10,
      });
    (assert.equal(imageGenerationResult.outputType, 'image'),
      assert.equal(imageGenerationResult.items[0].url, 'https://img.example.com/a.png'),
      assert.deepEqual(imageGenerationResult.items[0].metadata, { provider: 'apimart' }),
      assert.equal(imageGenerationResultPatch4.imageUrl, 'https://img.example.com/a.png'),
      assert.equal(imageGenerationResultPatch4.sourceUrl, 'https://img.example.com/a.png'),
      assert.equal(imageGenerationResultPatch4.localPath, 'output/a.png'));
  }),
  test('image generation result renderer: error item writes failure patch', () => {
    const imageGenerationResultPatch5 = buildImageGenerationResultPatch(
      { error: 'provider rejected' },
      { startedAt: Date.now() - 10 },
    );
    (assert.equal(imageGenerationResultPatch5.jobStatus, 'error'),
      assert.equal(imageGenerationResultPatch5.jobError, 'provider rejected'),
      assert.equal(imageGenerationResultPatch5.images.length, 1),
      assert.equal(getImageGenerationResultError({ error: 'provider rejected' }), 'provider rejected'),
      assert.deepEqual(getSuccessfulImageGenerationItems({ error: 'provider rejected' }), []));
  }),
  test('image generation result renderer: explicit failure helper builds image failure patch', () => {
    const imageGenerationFailurePatch = buildImageGenerationFailurePatch({
      error: 'provider rejected',
      duration: 0x4b0,
    });
    (assert.equal(imageGenerationFailurePatch.jobStatus, 'error'),
      assert.equal(imageGenerationFailurePatch.jobError, 'provider rejected'),
      assert.equal(imageGenerationFailurePatch.generationDuration, 0x4b0),
      assert.equal(imageGenerationFailurePatch.images.length, 1),
      assert.equal(imageGenerationFailurePatch.images[0].error, 'provider rejected'),
      assert.equal(imageGenerationFailurePatch.mainImageIndex, 0),
      assert.equal(imageGenerationFailurePatch.imageUrl, ''),
      assert.equal(imageGenerationFailurePatch.thumbUrl, ''));
  }),
  test('image generation result renderer: failure helper can preserve media fields', () => {
    const imageGenerationFailurePatch2 = buildImageGenerationFailurePatch({
      error: 'resume failed',
      duration: 0x4b0,
      clearMediaFields: false,
    });
    (assert.equal(imageGenerationFailurePatch2.jobStatus, 'error'),
      assert.equal(imageGenerationFailurePatch2.jobError, 'resume failed'),
      assert.equal(imageGenerationFailurePatch2.images[0].error, 'resume failed'),
      assert.equal(Object.prototype.hasOwnProperty.call(imageGenerationFailurePatch2, 'imageUrl'), false),
      assert.equal(Object.prototype.hasOwnProperty.call(imageGenerationFailurePatch2, 'localPath'), false));
  }),
  test('image generation result renderer: empty result returns empty normalized result and no patch', () => {
    const imageGenerationResult2 = normalizeImageGenerationResult({});
    (assert.deepEqual(imageGenerationResult2, { outputType: 'image', items: [] }),
      assert.equal(buildImageGenerationResultPatch(imageGenerationResult2), null));
  }));
