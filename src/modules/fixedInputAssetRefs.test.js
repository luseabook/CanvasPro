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
  const _0x18420a = resolveFixedInputSlotForRef({
    fixedInputConfig: createConfig(),
    refSlot: 'firstFrame',
    kind: 'image',
  });
  assert.deepEqual(_0x18420a, { slot: 'firstFrame', reason: 'explicit', explicitSlot: 'firstFrame' });
}),
  test('fixed input slot resolver ignores current hidden slots', () => {
    const _0x2738f8 = resolveFixedInputSlotForRef({
      fixedInputConfig: createConfig(),
      refSlot: 'lastFrame',
      kind: 'image',
    });
    (assert.equal(_0x2738f8.slot, ''),
      assert.equal(_0x2738f8.reason, 'hidden'),
      assert.equal(_0x2738f8.knownSlot, true));
  }),
  test('fixed input slot resolver migrates stale unknown slots by kind', () => {
    const _0xeef357 = resolveFixedInputSlotForRef({
      fixedInputConfig: createConfig(),
      refSlot: 'refImage',
      kind: 'image',
    });
    (assert.equal(_0xeef357.slot, 'firstFrame'), assert.equal(_0xeef357.reason, 'stale'));
  }),
  test('fixed input slot resolver respects occupied slots', () => {
    const _0x3e8462 = resolveFixedInputSlotForRef({
      fixedInputConfig: createConfig(),
      refSlot: 'refImage',
      kind: 'image',
      occupiedSlots: { firstFrame: true },
    });
    (assert.equal(_0x3e8462.slot, ''), assert.equal(_0x3e8462.reason, 'overflow'));
  }));
