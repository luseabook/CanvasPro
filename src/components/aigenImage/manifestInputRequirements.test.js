import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildFixedSlotOccupancy,
  countManifestInputRecords,
  getMissingManifestInputRequirement,
} from './manifestInputRequirements.js';

test('manifestInputRequirements: counts only supported input kinds', () => {
  assert.deepEqual(
    countManifestInputRecords([
      { kind: 'image' },
      { kind: 'video' },
      { kind: 'image' },
      { kind: 'unknown' },
      null,
    ]),
    { text: 0, image: 2, video: 1, audio: 0 },
  );
});

test('manifestInputRequirements: explicit slots win before kind fallback', () => {
  const occupancy = buildFixedSlotOccupancy({
    fixedInputConfig: {
      visibleSlots: ['image-a', 'image-b', 'video-a'],
      fixedSlots: [
        { id: 'image-a', kind: 'image' },
        { id: 'image-b', kind: 'image' },
        { id: 'video-a', kind: 'video' },
        { id: 'hidden', kind: 'image' },
      ],
    },
    inputRecords: [
      { kind: 'image', refSlot: 'image-b' },
      { kind: 'image', refSlot: 'missing' },
      { kind: 'video' },
    ],
  });

  assert.deepEqual(occupancy, {
    'image-b': true,
    'image-a': true,
    'video-a': true,
  });
});

test('manifestInputRequirements: reports a missing required fixed slot first', () => {
  const result = getMissingManifestInputRequirement({
    fixedInputConfig: {
      visibleSlots: ['required-image'],
      fixedSlots: [{ id: 'required-image', kind: 'image', required: true }],
    },
    occupiedFixedSlots: {},
    inputSlots: { minByKind: { text: 1 } },
    inputCounts: { text: 0, image: 0, video: 0, audio: 0 },
  });

  assert.deepEqual(result, {
    kind: 'image',
    slotId: 'required-image',
    required: 1,
    actual: 0,
    source: 'fixedSlot',
  });
});

test('manifestInputRequirements: reports minByKind requirements and returns null when satisfied', () => {
  assert.deepEqual(
    getMissingManifestInputRequirement({
      inputSlots: { minByKind: { image: 2, audio: 1 } },
      inputCounts: { image: 1, audio: 1 },
    }),
    { kind: 'image', slotId: '', required: 2, actual: 1, source: 'minByKind' },
  );
  assert.equal(
    getMissingManifestInputRequirement({
      inputSlots: { minByKind: { image: 1 } },
      inputCounts: { image: 1 },
    }),
    null,
  );
});
