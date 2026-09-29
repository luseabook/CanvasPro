import test from 'node:test';
import assert from 'node:assert/strict';

import {
  canNormalizeStoryRepairTiming,
  getStoryRepairResumeCandidates,
  validateStoryRepairTiming,
} from './storyRepairTimingValidation.js';

test('storyRepairTimingValidation allows only legacy story timing normalization', () => {
  assert.equal(
    canNormalizeStoryRepairTiming(
      { sourceMode: 'story' },
      { promptMode: 'seedance-2.0' },
    ),
    true,
  );
  assert.equal(
    canNormalizeStoryRepairTiming(
      { sourceMode: 'video-replication' },
      { promptMode: 'seedance-2.0' },
    ),
    false,
  );
  assert.equal(
    canNormalizeStoryRepairTiming(
      { sourceMode: 'story' },
      { promptMode: 'seedance-2.5' },
    ),
    false,
  );
});

test('storyRepairTimingValidation avoids a second validation pass when timing is stable', async () => {
  const clips = [{ ref: 'clip-1', shots: [] }];
  const calls = [];
  const validateClips = async (payload) => {
    calls.push(payload);
    return clips;
  };

  const result = await validateStoryRepairTiming({
    validateClips,
    clips,
    project: { sourceMode: 'story' },
    constraints: { promptMode: 'seedance-2.0', sceneMaxSeconds: 15 },
  });

  assert.equal(result, clips);
  assert.equal(calls.length, 1);
});

test('storyRepairTimingValidation resumes rechecks and attempted local timing clips', () => {
  const rechecked = [{ ref: 'rechecked' }];
  const retried = [{ ref: 'retried' }];
  const result = getStoryRepairResumeCandidates(
    {
      pendingRecheck: { 'clip-1': rechecked },
      repairErrorCodes: {
        'clip-2': 'STORY_LOCAL_TIMING',
        'clip-3': 'OTHER',
      },
      attemptedClips: {
        'clip-2': retried,
        'clip-3': [{ ref: 'not-resumed' }],
      },
    },
    ['clip-1', 'clip-2', 'clip-3'],
    { sourceMode: 'story' },
    { promptMode: 'seedance-2.0' },
  );

  assert.deepEqual(Object.keys(result), ['clip-1', 'clip-2']);
  assert.equal(result['clip-1'], rechecked);
  assert.equal(result['clip-2'], retried);
});
