import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildReplicationTimingContract,
  getReplicationClipTiming,
  getReplicationVisualGaps,
  inspectReplicationSourceCompleteness,
  isValidIntegerTimelineShot,
} from './videoReplicationTimingContract.js';

test('videoReplicationTimingContract: integer timeline shots require matching duration', () => {
  assert.equal(isValidIntegerTimelineShot({ startSec: 0, endSec: 5, durationSec: 5 }), true);
  assert.equal(isValidIntegerTimelineShot({ startSec: 0, endSec: 5, d: 5 }), true);
  assert.equal(isValidIntegerTimelineShot({ startSec: 0, endSec: 5, durationSec: 4 }), false);
  assert.equal(isValidIntegerTimelineShot({ startSec: 0.5, endSec: 5, durationSec: 4.5 }), false);
  assert.equal(isValidIntegerTimelineShot({ startSec: 5, endSec: 5, durationSec: 0 }), false);
});

test('videoReplicationTimingContract: visual gaps merge overlaps and ignore short gaps', () => {
  const events = [
    { shots: [{ startSec: 0, endSec: 5 }] },
    { shots: [{ startSec: 5.05, endSec: 7 }] },
    { shots: [{ startSec: 9, endSec: 12 }] },
  ];
  assert.deepEqual(getReplicationVisualGaps(events, 0, 14), [
    { startSec: 7, endSec: 9 },
    { startSec: 12, endSec: 14 },
  ]);
  assert.deepEqual(getReplicationVisualGaps(events, 10, 5), []);
});

test('videoReplicationTimingContract: clip timing derives integer boundaries and completeness', () => {
  const clip = {
    ref: 'clip-1',
    durationSec: 10,
    sourceStartSec: 100,
    sourceEndSec: 110,
    events: [
      {
        startSec: 100,
        endSec: 110,
        shots: [
          { startSec: 100, endSec: 104 },
          { startSec: 104, endSec: 110 },
        ],
      },
    ],
  };
  const project = {
    replication: {
      segmentPlan: [clip],
      sourceAnalysis: { events: [] },
    },
  };
  assert.deepEqual(getReplicationClipTiming(clip, project, 'seedance-2.5'), {
    ref: 'clip-1',
    durationSec: 10,
    sourceStartSec: 100,
    sourceEndSec: 110,
    sourceShotsComplete: true,
    observedBoundaries: [4],
  });
  assert.deepEqual(buildReplicationTimingContract(project, 'seedance-2.5'), {
    unit: 'integer-seconds',
    origin: 'clip-start',
    clips: [getReplicationClipTiming(clip, project, 'seedance-2.5')],
  });
});

test('videoReplicationTimingContract: missing shot evidence is reported', () => {
  const clip = {
    ref: 'clip-1',
    durationSec: 10,
    sourceStartSec: 0,
    sourceEndSec: 10,
    events: [{ shots: [] }],
  };
  const result = inspectReplicationSourceCompleteness({ clips: [clip] }, {});
  assert.equal(result.length, 1);
  assert.equal(result[0].clipRef, 'clip-1');
  assert.equal(result[0].code, 'replication_source_shots_missing');
});
