import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORY_EPISODE_SPLIT_CAMERA_PRESETS,
  buildStoryEpisodeSplitBatchResponseSchema,
  buildStoryEpisodeSplitBlueprintResponseSchema,
  buildStoryEpisodeSplitSingleResponseSchema,
} from './episodeSplitContract.js';

test('episodeSplitContract: blueprint schema can enforce scene duration and include scene assets', () => {
  const schema = buildStoryEpisodeSplitBlueprintResponseSchema({
    sceneMaxSeconds: 15,
    enforceMaxDuration: true,
    includeSceneAssetRef: true,
    includeDirectorContinuity: true,
  });
  const clip = schema.properties.clipPlans.items;

  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(schema.required, ['episodeRef', 'clipPlans']);
  assert.equal(clip.properties.targetDurationSec.maximum, 15);
  assert.ok(clip.required.includes('sceneAssetRef'));
  assert.ok(clip.required.includes('openingShotIntent'));
  assert.ok(clip.required.includes('closingShotIntent'));
});

test('episodeSplitContract: batch schema fixes clip count and shot requirements', () => {
  const schema = buildStoryEpisodeSplitBatchResponseSchema({
    clipCount: 3,
    maxDurationSeconds: 12,
    minimumShotsPerClip: 2,
    maximumShotsPerClip: 4,
    includeTimeline: true,
    includeDirectorContinuity: true,
  });
  const clips = schema.properties.clips;
  const shot = clips.items.properties.shots.items;

  assert.equal(clips.minItems, 3);
  assert.equal(clips.maxItems, 3);
  assert.deepEqual(shot.required, [
    'durationSec',
    'assetUsages',
    'visual',
    'camera',
    'dialogue',
    'voiceover',
    'audio',
  ]);
  assert.equal(shot.properties.durationSec.maximum, 12);
  assert.equal(shot.properties.assetUsages.items.required.length, 2);
  assert.equal(shot.properties.startSec.type, 'integer');
  assert.equal(shot.properties.transitionFromPrevious.type, 'string');
});

test('episodeSplitContract: compact single schema exposes the abbreviated shot contract', () => {
  const schema = buildStoryEpisodeSplitSingleResponseSchema();
  const shot = schema.properties.clips.items.properties.shots.items;

  assert.deepEqual(schema.properties.clips.items.required, ['s', 'shots']);
  assert.deepEqual(shot.required, ['v']);
  assert.equal(shot.properties.c.maximum, STORY_EPISODE_SPLIT_CAMERA_PRESETS.length - 1);
  assert.equal(shot.properties.d.minimum, 0.1);
});

test('episodeSplitContract: compact clip schemas preserve only compact fields', () => {
  const schema = buildStoryEpisodeSplitBatchResponseSchema({
    clipCount: 0,
    compactExperimental: true,
  });
  const clip = schema.properties.clips.items;
  const shot = clip.properties.shots.items;

  assert.equal(schema.properties.clips.minItems, 1);
  assert.equal(schema.properties.clips.maxItems, 1);
  assert.deepEqual(clip.required, ['ref', 'shots']);
  assert.equal(Object.hasOwn(clip.properties, 'script'), false);
  assert.ok(shot.properties.assetRefs);
  assert.equal(Object.hasOwn(shot.properties, 'assetUsages'), false);
});
