import test from 'node:test';
import assert from 'node:assert/strict';

import { groupStoryEpisodeRepairClips } from './storyEpisodeRepairGrouping.js';

const assets = [
  {
    id: 'scene-1',
    ref: 'scene-ref',
    planningRef: 'scene-plan',
    kind: 'scene',
  },
];

function createShot(durationSec, assetRef = 'scene-ref') {
  return {
    durationSec,
    assetUsages: [{ assetRef, appearanceRef: 'appearance-a' }],
  };
}

function createClip(ref, durationSec) {
  return {
    ref,
    script: ref,
    creativeIntent: '',
    transition: '',
    shots: [createShot(durationSec)],
    durationSec,
    assetRefs: ['scene-ref'],
  };
}

test('storyEpisodeRepairGrouping merges adjacent clips from one scene', () => {
  const clips = [createClip('clip-1', 3), createClip('clip-2', 4), createClip('clip-3', 2)];
  const result = groupStoryEpisodeRepairClips(clips, {
    promptMode: 'seedance-2.0',
    maxSeconds: 10,
    assets,
    rawClips: [
      { ref: 'clip-2', startsNewNarrativeBeat: false },
      { ref: 'clip-3', startsNewNarrativeBeat: true },
    ],
  });

  assert.equal(result.length, 2);
  assert.equal(result[0].ref, 'clip-1');
  assert.equal(result[0].shots.length, 2);
  assert.equal(result[0].durationSec, 7);
  assert.deepEqual(result[0].assetRefs, ['scene-ref']);
  assert.equal(result[1].ref, 'clip-3');
});

test('storyEpisodeRepairGrouping leaves other prompt modes untouched', () => {
  const clips = [createClip('clip-1', 3), createClip('clip-2', 3)];
  const result = groupStoryEpisodeRepairClips(clips, {
    promptMode: 'minimax-h3',
    assets,
  });

  assert.equal(result, clips);
});
