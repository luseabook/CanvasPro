import test from 'node:test';
import assert from 'node:assert/strict';

import { REPLICATION_IMAGE_APPEARANCE_GUIDANCE } from '../../domain/storyGeneration/videoReplicationGenerationAssets.js';
import { runStoryEpisodeSplitQualityReview } from './storyEpisodeSplitQualityApplication.js';

test('storyEpisodeSplitQualityApplication: returns the result unchanged without a review function', async () => {
  const result = { clips: [] };
  assert.equal(await runStoryEpisodeSplitQualityReview({ result }), result);
});

test('storyEpisodeSplitQualityApplication: forwards project, assets, execution and callbacks', async () => {
  const project = {
    sourceMode: 'video-replication',
    planning: { clipMinSeconds: 4 },
  };
  const episode = { id: 'episode-1' };
  const result = { clips: [{ id: 'clip-1' }] };
  const splitRun = {
    execution: {
      modelId: 'model-1',
      provider: 'provider-1',
      providerProfileId: 'profile-1',
    },
    qualityReview: { draft: true },
    saveQualityReview() {},
    onInvocation() {},
  };
  const clipDurationConstraints = { maxSeconds: 15 };
  const onProgress = () => {};
  const calls = [];
  const reviewed = { clips: [{ id: 'clip-1', approved: true }] };

  const actual = await runStoryEpisodeSplitQualityReview({
    reviewEpisodeSplit: async (payload) => {
      calls.push(payload);
      return reviewed;
    },
    result,
    episode,
    context: { project },
    projectData: {
      assets: [
        {
          kind: 'character',
          description: 'old description',
          appearances: [
            {
              sourceOrigin: 'library',
              imageUrl: 'asset://reference-image',
              name: 'old name',
              prompt: 'old prompt',
            },
          ],
        },
      ],
    },
    splitRun,
    clipDurationConstraints,
    onProgress,
  });

  assert.equal(actual, reviewed);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].project, project);
  assert.equal(calls[0].episode, episode);
  assert.equal(calls[0].result, result);
  assert.equal(calls[0].constraints, project.planning);
  assert.equal(calls[0].model, 'model-1');
  assert.equal(calls[0].provider, 'provider-1');
  assert.equal(calls[0].providerProfileId, 'profile-1');
  assert.equal(calls[0].clipDurationConstraints, clipDurationConstraints);
  assert.equal(calls[0].resumeDraft, splitRun.qualityReview);
  assert.equal(calls[0].onCheckpoint, splitRun.saveQualityReview);
  assert.equal(calls[0].onInvocation, splitRun.onInvocation);
  assert.equal(calls[0].onProgress, onProgress);
  assert.equal(calls[0].assets[0].description, REPLICATION_IMAGE_APPEARANCE_GUIDANCE);
  assert.equal(calls[0].assets[0].appearances[0].name, '参考形象1');
  assert.equal(calls[0].assets[0].appearances[0].prompt, '');
});
