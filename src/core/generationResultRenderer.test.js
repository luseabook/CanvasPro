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
    const generationCollectionResultPatch = buildGenerationCollectionResultPatch(
      { videos: [{ videoUrl: '/out.mp4', localPath: 'output/out.mp4' }] },
      {
        collectionField: 'videos',
        mainIndexField: 'mainVideoIndex',
        expandedField: 'isVideosExpanded',
        startedAt: Date.now() - 10,
        buildFirstItemPatch: (videoUrl) => ({
          videoUrl: videoUrl.videoUrl,
          localPath: videoUrl.localPath,
        }),
        extraPatch: { rhStatusMessage: null },
      },
    );
    (assert.equal(generationCollectionResultPatch.jobStatus, 'success'),
      assert.equal(generationCollectionResultPatch.mainVideoIndex, 0),
      assert.equal(generationCollectionResultPatch.isVideosExpanded, false),
      assert.equal(generationCollectionResultPatch.videoUrl, '/out.mp4'),
      assert.equal(generationCollectionResultPatch.localPath, 'output/out.mp4'),
      assert.equal(generationCollectionResultPatch.rhStatusMessage, null));
    const generationCollectionResultPatch2 = buildGenerationCollectionResultPatch(
      { error: 'provider failed' },
      { collectionField: 'videos', mainIndexField: 'mainVideoIndex', singleItemFields: ['videoUrl'] },
    );
    (assert.equal(generationCollectionResultPatch2.jobStatus, 'error'),
      assert.equal(generationCollectionResultPatch2.jobError, 'provider failed'),
      assert.equal(generationCollectionResultPatch2.videos.length, 1));
  }),
  test('generationResultRenderer: collection patch can select a nonzero main item', () => {
    const generationCollectionResultPatch3 = buildGenerationCollectionResultPatch(
      { videos: [{ error: 'provider failed' }, { videoUrl: '/out.mp4', localPath: 'output/out.mp4' }] },
      {
        collectionField: 'videos',
        mainIndexField: 'mainVideoIndex',
        selectMainIndex: () => 1,
        buildFirstItemPatch: (videoUrl2) => ({
          videoUrl: videoUrl2.videoUrl,
          localPath: videoUrl2.localPath,
        }),
      },
    );
    (assert.equal(generationCollectionResultPatch3.jobStatus, 'success'),
      assert.equal(generationCollectionResultPatch3.mainVideoIndex, 1),
      assert.equal(generationCollectionResultPatch3.videoUrl, '/out.mp4'),
      assert.equal(generationCollectionResultPatch3.localPath, 'output/out.mp4'));
  }),
  test('generationResultRenderer: builds single result patch without collection fields', () => {
    const generationSingleResultPatch = buildGenerationSingleResultPatch(
      { audioUrl: '/output/final.mp3', localPath: 'output/final.mp3' },
      {
        singleItemFields: ['audioUrl', 'localPath'],
        buildItemPatch: (audioUrl) => ({ audioUrl: audioUrl.audioUrl, localPath: audioUrl.localPath }),
        extraPatch: { rhStatusMessage: null },
      },
    );
    (assert.equal(generationSingleResultPatch.jobStatus, 'success'),
      assert.equal(generationSingleResultPatch.audioUrl, '/output/final.mp3'),
      assert.equal(generationSingleResultPatch.localPath, 'output/final.mp3'),
      assert.equal(generationSingleResultPatch.rhStatusMessage, null));
    const generationSingleResultPatch2 = buildGenerationSingleResultPatch(
      { error: 'provider failed' },
      { singleItemFields: ['audioUrl'] },
    );
    (assert.equal(generationSingleResultPatch2.jobStatus, 'error'),
      assert.equal(generationSingleResultPatch2.jobError, 'provider failed'));
  }));
