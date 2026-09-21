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
  const _0x52006c = Date.now() - 25,
    _0x53bd4d = buildImageGenerationResultPatch(
      {
        imageUrl: '/output/final.png',
        sourceUrl: 'https://img.example.com/final.png',
        thumbUrl: '/output/final-thumb.png',
        localPath: 'output/final.png',
        originalWidth: 0x500,
        originalHeight: 0x2d0,
      },
      { startedAt: _0x52006c },
    );
  (assert.equal(_0x53bd4d.jobStatus, 'success'),
    assert.equal(_0x53bd4d.jobError, null),
    assert.equal(_0x53bd4d.images.length, 1),
    assert.equal(_0x53bd4d.imageUrl, '/output/final.png'),
    assert.equal(_0x53bd4d.sourceUrl, 'https://img.example.com/final.png'),
    assert.equal(_0x53bd4d.thumbUrl, '/output/final-thumb.png'),
    assert.equal(_0x53bd4d.localPath, 'output/final.png'),
    assert.equal(_0x53bd4d.originalWidth, 0x500),
    assert.equal(_0x53bd4d.originalHeight, 0x2d0),
    assert.equal(_0x53bd4d.mainImageIndex, 0),
    assert.equal(_0x53bd4d.isImagesExpanded, false));
}),
  test('image generation result renderer: legacy batch result writes images and first item', () => {
    const _0x4c7a31 = buildImageGenerationResultPatch(
      {
        isBatch: true,
        images: [
          { imageUrl: '/output/a.png', localPath: 'output/a.png' },
          { imageUrl: '/output/b.png', localPath: 'output/b.png' },
        ],
      },
      { startedAt: Date.now() - 10 },
    );
    (assert.equal(_0x4c7a31.jobStatus, 'success'),
      assert.equal(_0x4c7a31.images.length, 2),
      assert.equal(_0x4c7a31.imageUrl, '/output/a.png'),
      assert.equal(_0x4c7a31.localPath, 'output/a.png'),
      assert.equal(_0x4c7a31.images[1].imageUrl, '/output/b.png'));
  }),
  test('image generation result renderer: mixed batch keeps successful images', () => {
    const _0x382fd7 = {
        isBatch: true,
        images: [
          { error: 'policy rejected', imageUrl: '', thumbUrl: '' },
          { imageUrl: '/output/a.png', localPath: 'output/a.png' },
          { imageUrl: '/output/b.png', localPath: 'output/b.png' },
        ],
      },
      _0x1b6e0c = buildImageGenerationResultPatch(_0x382fd7, { startedAt: Date.now() - 10 });
    (assert.equal(getImageGenerationResultError(_0x382fd7), ''),
      assert.equal(_0x1b6e0c.jobStatus, 'success'),
      assert.equal(_0x1b6e0c.jobError, null),
      assert.equal(_0x1b6e0c.images.length, 3),
      assert.equal(_0x1b6e0c.mainImageIndex, 1),
      assert.equal(_0x1b6e0c.imageUrl, '/output/a.png'),
      assert.equal(_0x1b6e0c.localPath, 'output/a.png'),
      assert.equal(_0x1b6e0c.images[0].error, 'policy rejected'),
      assert.deepEqual(
        getSuccessfulImageGenerationItems(_0x382fd7).map((_0x1d6200) => _0x1d6200.imageUrl),
        ['/output/a.png', '/output/b.png'],
      ));
  }),
  test('image generation result renderer: canonical image result is accepted', () => {
    const _0x1ba959 = normalizeImageGenerationResult({
        outputType: 'image',
        items: [
          {
            url: 'https://img.example.com/a.png',
            localPath: 'output/a.png',
            metadata: { provider: 'apimart' },
          },
        ],
      }),
      _0x55be28 = buildImageGenerationResultPatch(_0x1ba959, { startedAt: Date.now() - 10 });
    (assert.equal(_0x1ba959.outputType, 'image'),
      assert.equal(_0x1ba959.items[0].url, 'https://img.example.com/a.png'),
      assert.deepEqual(_0x1ba959.items[0].metadata, { provider: 'apimart' }),
      assert.equal(_0x55be28.imageUrl, 'https://img.example.com/a.png'),
      assert.equal(_0x55be28.sourceUrl, 'https://img.example.com/a.png'),
      assert.equal(_0x55be28.localPath, 'output/a.png'));
  }),
  test('image generation result renderer: error item writes failure patch', () => {
    const _0x27e4e0 = buildImageGenerationResultPatch(
      { error: 'provider rejected' },
      { startedAt: Date.now() - 10 },
    );
    (assert.equal(_0x27e4e0.jobStatus, 'error'),
      assert.equal(_0x27e4e0.jobError, 'provider rejected'),
      assert.equal(_0x27e4e0.images.length, 1),
      assert.equal(getImageGenerationResultError({ error: 'provider rejected' }), 'provider rejected'),
      assert.deepEqual(getSuccessfulImageGenerationItems({ error: 'provider rejected' }), []));
  }),
  test('image generation result renderer: explicit failure helper builds image failure patch', () => {
    const _0x36cd03 = buildImageGenerationFailurePatch({ error: 'provider rejected', duration: 0x4b0 });
    (assert.equal(_0x36cd03.jobStatus, 'error'),
      assert.equal(_0x36cd03.jobError, 'provider rejected'),
      assert.equal(_0x36cd03.generationDuration, 0x4b0),
      assert.equal(_0x36cd03.images.length, 1),
      assert.equal(_0x36cd03.images[0].error, 'provider rejected'),
      assert.equal(_0x36cd03.mainImageIndex, 0),
      assert.equal(_0x36cd03.imageUrl, ''),
      assert.equal(_0x36cd03.thumbUrl, ''));
  }),
  test('image generation result renderer: failure helper can preserve media fields', () => {
    const _0x549076 = buildImageGenerationFailurePatch({
      error: 'resume failed',
      duration: 0x4b0,
      clearMediaFields: false,
    });
    (assert.equal(_0x549076.jobStatus, 'error'),
      assert.equal(_0x549076.jobError, 'resume failed'),
      assert.equal(_0x549076.images[0].error, 'resume failed'),
      assert.equal(Object.prototype.hasOwnProperty.call(_0x549076, 'imageUrl'), false),
      assert.equal(Object.prototype.hasOwnProperty.call(_0x549076, 'localPath'), false));
  }),
  test('image generation result renderer: empty result returns empty normalized result and no patch', () => {
    const _0x501690 = normalizeImageGenerationResult({});
    (assert.deepEqual(_0x501690, { outputType: 'image', items: [] }),
      assert.equal(buildImageGenerationResultPatch(_0x501690), null));
  }));
