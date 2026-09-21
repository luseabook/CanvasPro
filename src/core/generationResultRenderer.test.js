import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGenerationCollectionResultPatch,
  buildGenerationSingleResultPatch,
  firstNonEmptyString,
  getFirstGenerationResultError,
  normalizeGenerationResultItems,
} from './generationResultRenderer.js';
(test('generationResultRenderer: normalizes canonical, collection, array, and single results', () => {
  (assert.deepEqual(normalizeGenerationResultItems({ outputType: 'image', items: [{ url: '/a.png' }] }), [
    { url: '/a.png' },
  ]),
    assert.deepEqual(
      normalizeGenerationResultItems({ videos: [{ videoUrl: '/a.mp4' }] }, { collectionField: 'videos' }),
      [{ videoUrl: '/a.mp4' }],
    ),
    assert.deepEqual(normalizeGenerationResultItems([{ audioUrl: '/a.mp3' }]), [{ audioUrl: '/a.mp3' }]),
    assert.deepEqual(
      normalizeGenerationResultItems({ audioUrl: '/a.mp3' }, { singleItemFields: ['audioUrl'] }),
      [{ audioUrl: '/a.mp3' }],
    ));
}),
  test('generationResultRenderer: result error is read from normalized items', () => {
    (assert.equal(
      getFirstGenerationResultError(
        { videos: [{ error: 'provider failed' }] },
        { collectionField: 'videos' },
      ),
      'provider failed',
    ),
      assert.equal(firstNonEmptyString('', null, ' ok '), 'ok'));
  }),
  test('generationResultRenderer: builds success and failure collection patches', () => {
    const _0x19b82a = buildGenerationCollectionResultPatch(
      { videos: [{ videoUrl: '/out.mp4', localPath: 'output/out.mp4' }] },
      {
        collectionField: 'videos',
        mainIndexField: 'mainVideoIndex',
        expandedField: 'isVideosExpanded',
        startedAt: Date.now() - 10,
        buildFirstItemPatch: (_0x12ab1c) => ({
          videoUrl: _0x12ab1c.videoUrl,
          localPath: _0x12ab1c.localPath,
        }),
        extraPatch: { rhStatusMessage: null },
      },
    );
    (assert.equal(_0x19b82a.jobStatus, 'success'),
      assert.equal(_0x19b82a.mainVideoIndex, 0),
      assert.equal(_0x19b82a.isVideosExpanded, false),
      assert.equal(_0x19b82a.videoUrl, '/out.mp4'),
      assert.equal(_0x19b82a.localPath, 'output/out.mp4'),
      assert.equal(_0x19b82a.rhStatusMessage, null));
    const _0x3f22c7 = buildGenerationCollectionResultPatch(
      { error: 'provider failed' },
      { collectionField: 'videos', mainIndexField: 'mainVideoIndex', singleItemFields: ['videoUrl'] },
    );
    (assert.equal(_0x3f22c7.jobStatus, 'error'),
      assert.equal(_0x3f22c7.jobError, 'provider failed'),
      assert.equal(_0x3f22c7.videos.length, 1));
  }),
  test('generationResultRenderer: collection patch can select a nonzero main item', () => {
    const _0x246f1d = buildGenerationCollectionResultPatch(
      { videos: [{ error: 'provider failed' }, { videoUrl: '/out.mp4', localPath: 'output/out.mp4' }] },
      {
        collectionField: 'videos',
        mainIndexField: 'mainVideoIndex',
        selectMainIndex: () => 1,
        buildFirstItemPatch: (_0x4f12ea) => ({
          videoUrl: _0x4f12ea.videoUrl,
          localPath: _0x4f12ea.localPath,
        }),
      },
    );
    (assert.equal(_0x246f1d.jobStatus, 'success'),
      assert.equal(_0x246f1d.mainVideoIndex, 1),
      assert.equal(_0x246f1d.videoUrl, '/out.mp4'),
      assert.equal(_0x246f1d.localPath, 'output/out.mp4'));
  }),
  test('generationResultRenderer: builds single result patch without collection fields', () => {
    const _0x19c968 = buildGenerationSingleResultPatch(
      { audioUrl: '/output/final.mp3', localPath: 'output/final.mp3' },
      {
        singleItemFields: ['audioUrl', 'localPath'],
        buildItemPatch: (_0x21c058) => ({ audioUrl: _0x21c058.audioUrl, localPath: _0x21c058.localPath }),
        extraPatch: { rhStatusMessage: null },
      },
    );
    (assert.equal(_0x19c968.jobStatus, 'success'),
      assert.equal(_0x19c968.audioUrl, '/output/final.mp3'),
      assert.equal(_0x19c968.localPath, 'output/final.mp3'),
      assert.equal(_0x19c968.rhStatusMessage, null));
    const _0x1bd89e = buildGenerationSingleResultPatch(
      { error: 'provider failed' },
      { singleItemFields: ['audioUrl'] },
    );
    (assert.equal(_0x1bd89e.jobStatus, 'error'), assert.equal(_0x1bd89e.jobError, 'provider failed'));
  }));
