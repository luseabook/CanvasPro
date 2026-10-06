import test from 'node:test';
import assert from 'node:assert/strict';

import { projectReplicationObservedShots } from './videoReplicationVisualDelivery.js';

function createContext() {
  return {
    episode: {
      replication: {
        sourceAnalysis: {
          characters: [{ id: 'character-1', name: 'Alice' }],
        },
      },
    },
    project: {
      replication: {
        characterBindings: {},
      },
    },
    assets: [
      {
        id: 'asset-1',
        ref: 'asset-ref-1',
        kind: 'character',
        name: 'Alice',
        replicationSource: { ref: 'character-1' },
      },
    ],
  };
}

test('videoReplicationVisualDelivery projects contiguous observed shots', () => {
  const clip = {
    ref: 'clip-1',
    promptMode: 'seedance-2.0',
    shots: [
      {
        id: 'planned-1',
        durationSec: 2,
        assetUsages: [{ assetRef: 'asset-ref-1', appearanceRef: 'appearance-1' }],
      },
      {
        id: 'planned-2',
        durationSec: 2,
        assetUsages: [{ assetRef: 'asset-ref-1', appearanceRef: 'appearance-1' }],
      },
    ],
  };
  const window = {
    sourceStartSec: 0,
    sourceEndSec: 4,
    durationSec: 4,
    events: [
      {
        id: 'event-1',
        sound: 'wind',
        shots: [
          {
            id: 'observed-1',
            startSec: 0,
            endSec: 2,
            visual: 'Alice enters.',
            camera: 'wide shot',
          },
          {
            id: 'observed-2',
            startSec: 2,
            endSec: 4,
            visual: 'Alice stops.',
            camera: 'close shot',
          },
        ],
      },
    ],
  };

  const shots = projectReplicationObservedShots(clip, window, createContext());

  assert.equal(shots.length, 2);
  assert.equal(shots[0].visual, 'Alice enters.');
  assert.equal(shots[1].camera, 'close shot');
  // 0.8.0 起观察镜头投影会显式清空 sound（音频改由语音管线提供），此处不再保留 event 级 sound
  assert.equal(shots[0].audio, '');
  assert.deepEqual(shots[0].replicationSourceShotIds, ['observed-1']);
  assert.deepEqual(shots[0].assetUsages, [
    { assetRef: 'asset-ref-1', appearanceRef: 'appearance-1' },
  ]);
});

test('videoReplicationVisualDelivery keeps planned shots when evidence has gaps', () => {
  const plannedShots = [
    {
      id: 'planned-1',
      durationSec: 2,
      assetUsages: [],
    },
  ];
  const clip = { ref: 'clip-1', promptMode: 'seedance-2.0', shots: plannedShots };
  const window = {
    sourceStartSec: 0,
    sourceEndSec: 4,
    durationSec: 4,
    events: [
      {
        id: 'event-1',
        shots: [
          {
            id: 'observed-1',
            startSec: 0,
            endSec: 2,
            visual: 'Alice enters.',
            camera: 'wide shot',
          },
        ],
      },
    ],
  };

  const shots = projectReplicationObservedShots(clip, window, createContext());

  assert.equal(shots, plannedShots);
});
