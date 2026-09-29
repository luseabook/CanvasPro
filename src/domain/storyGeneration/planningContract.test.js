import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORY_EPISODE_COUNT_MAX,
  STORY_EPISODE_COUNT_OPTIONS,
  STORY_SCENE_MAX_SECONDS_OPTIONS,
  STORY_SCRIPT_MODE_NARRATION,
  STORY_SCRIPT_MODE_PLOT,
  normalizeStoryPlanningConstraints,
  normalizeStoryScriptMode,
  validateStoryPlanningConstraints,
} from './planningContract.js';

test('planningContract: script mode defaults to plot and only exact narration is accepted', () => {
  assert.equal(normalizeStoryScriptMode(' narration '), STORY_SCRIPT_MODE_NARRATION);
  assert.equal(normalizeStoryScriptMode('NARRATION'), STORY_SCRIPT_MODE_PLOT);
  assert.equal(normalizeStoryScriptMode(''), STORY_SCRIPT_MODE_PLOT);
});

test('planningContract: options expose supported episode and scene limits', () => {
  assert.deepEqual(STORY_EPISODE_COUNT_OPTIONS, [3, 5, 10, 20, 30, 50]);
  assert.deepEqual(STORY_SCENE_MAX_SECONDS_OPTIONS, [15, 30]);
  assert.equal(STORY_EPISODE_COUNT_MAX, 100);
});

test('planningContract: normalization applies defaults for invalid values', () => {
  assert.deepEqual(normalizeStoryPlanningConstraints(), { episodeCount: 3, sceneMaxSeconds: 30 });
  assert.deepEqual(normalizeStoryPlanningConstraints({ episodeCount: 3.5, sceneMaxSeconds: 20 }), {
    episodeCount: 3,
    sceneMaxSeconds: 30,
  });
});

test('planningContract: normalization accepts integer boundaries and scene options', () => {
  assert.deepEqual(normalizeStoryPlanningConstraints({ episodeCount: 1, sceneMaxSeconds: 15 }), {
    episodeCount: 1,
    sceneMaxSeconds: 15,
  });
  assert.deepEqual(normalizeStoryPlanningConstraints({ episodeCount: 100, sceneMaxSeconds: '30' }), {
    episodeCount: 100,
    sceneMaxSeconds: 30,
  });
});

test('planningContract: validation rejects explicit invalid values and returns normalized output', () => {
  assert.throws(() => validateStoryPlanningConstraints({ episodeCount: 0 }), /1-100/);
  assert.throws(() => validateStoryPlanningConstraints({ episodeCount: 101 }), /1-100/);
  assert.throws(() => validateStoryPlanningConstraints({ episodeCount: 1.5 }), /1-100/);
  assert.throws(() => validateStoryPlanningConstraints({ sceneMaxSeconds: 20 }), /15/);
  assert.deepEqual(validateStoryPlanningConstraints({ episodeCount: '5', sceneMaxSeconds: '15' }), {
    episodeCount: 5,
    sceneMaxSeconds: 15,
  });
});
