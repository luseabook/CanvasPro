import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveFixedInputSlotForRef } from './fixedInputAssetRefs.js';
function createConfig() {
  return {
    slotById: {
      firstFrame: { id: 'firstFrame', kind: 'image' },
      lastFrame: { id: 'lastFrame', kind: 'image' },
      referenceVideo: { id: 'referenceVideo', kind: 'video' },
    },
    slotKindById: { firstFrame: 'image', lastFrame: 'image', referenceVideo: 'video' },
    slotOrderByType: { image: ['firstFrame', 'lastFrame'], video: ['referenceVideo'] },
    visibleSlots: ['firstFrame', 'referenceVideo'],
  };
}
(test('fixed input slot resolver keeps visible explicit slots', () => {
  const fixedInputSlotForRef = resolveFixedInputSlotForRef({
    fixedInputConfig: createConfig(),
    refSlot: 'firstFrame',
    kind: 'image',
  });
  assert.deepEqual(fixedInputSlotForRef, {
    slot: 'firstFrame',
    reason: 'explicit',
    explicitSlot: 'firstFrame',
  });
}),
  test('fixed input slot resolver ignores current hidden slots', () => {
    const fixedInputSlotForRef2 = resolveFixedInputSlotForRef({
      fixedInputConfig: createConfig(),
      refSlot: 'lastFrame',
      kind: 'image',
    });
    (assert.equal(fixedInputSlotForRef2.slot, ''),
      assert.equal(fixedInputSlotForRef2.reason, 'hidden'),
      assert.equal(fixedInputSlotForRef2.knownSlot, true));
  }),
  test('fixed input slot resolver migrates stale unknown slots by kind', () => {
    const fixedInputSlotForRef3 = resolveFixedInputSlotForRef({
      fixedInputConfig: createConfig(),
      refSlot: 'refImage',
      kind: 'image',
    });
    (assert.equal(fixedInputSlotForRef3.slot, 'firstFrame'),
      assert.equal(fixedInputSlotForRef3.reason, 'stale'));
  }),
  test('fixed input slot resolver respects occupied slots', () => {
    const fixedInputSlotForRef4 = resolveFixedInputSlotForRef({
      fixedInputConfig: createConfig(),
      refSlot: 'refImage',
      kind: 'image',
      occupiedSlots: { firstFrame: true },
    });
    (assert.equal(fixedInputSlotForRef4.slot, ''), assert.equal(fixedInputSlotForRef4.reason, 'overflow'));
  }));
