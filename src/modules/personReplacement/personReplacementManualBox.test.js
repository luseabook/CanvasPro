import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePersonReplacementManualBoxEdit,
  normalizePersonReplacementManualSelection,
  resolvePersonReplacementSourceImageSize,
} from './personReplacementManualBox.js';

test('normalizePersonReplacementManualSelection orders the two corners', () => {
  assert.deepEqual(normalizePersonReplacementManualSelection({ x: 0.2, y: 0.3 }, { x: 0.6, y: 0.8 }), {
    x: 0.2,
    y: 0.3,
    width: 0.4,
    height: 0.5,
  });
  assert.deepEqual(normalizePersonReplacementManualSelection({ x: 0.6, y: 0.8 }, { x: 0.2, y: 0.3 }), {
    x: 0.2,
    y: 0.3,
    width: 0.4,
    height: 0.5,
  });
});

test('normalizePersonReplacementManualSelection clamps both corners into the frame', () => {
  assert.deepEqual(normalizePersonReplacementManualSelection({ x: -1, y: 2 }, { x: 5, y: -5 }), {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  });
});

test('normalizePersonReplacementManualSelection discards a selection below the minimum size', () => {
  assert.equal(normalizePersonReplacementManualSelection({ x: 0, y: 0 }, { x: 0.01, y: 0.01 }), null);
  assert.equal(normalizePersonReplacementManualSelection({ x: 0.5, y: 0.5 }, { x: 0.52, y: 0.9 }), null);
});

test('normalizePersonReplacementManualSelection honours a custom minimum size', () => {
  assert.deepEqual(
    normalizePersonReplacementManualSelection(
      { x: 0, y: 0 },
      { x: 0.01, y: 0.01 },
      { minWidth: 0.005, minHeight: 0.005 },
    ),
    { x: 0, y: 0, width: 0.01, height: 0.01 },
  );
});

test('normalizePersonReplacementManualSelection falls back to zero for unusable coordinates', () => {
  assert.equal(normalizePersonReplacementManualSelection({ x: 'nope' }, {}), null);
  assert.equal(normalizePersonReplacementManualSelection(), null);
});

test('normalizePersonReplacementManualSelection rounds to six decimals', () => {
  const result = normalizePersonReplacementManualSelection({ x: 0, y: 0 }, { x: 1 / 3, y: 0.5 });
  assert.equal(result.width, Math.round((1 / 3) * 1000000) / 1000000);
  assert.equal(result.height, 0.5);
});

test('resolvePersonReplacementSourceImageSize prefers the natural size', () => {
  assert.deepEqual(
    resolvePersonReplacementSourceImageSize(
      { naturalWidth: 800, naturalHeight: 600 },
      { frame: { width: 1, height: 1 } },
    ),
    { width: 800, height: 600 },
  );
});

test('resolvePersonReplacementSourceImageSize falls back to the frame size', () => {
  assert.deepEqual(
    resolvePersonReplacementSourceImageSize(
      { naturalWidth: 0, naturalHeight: 600 },
      { frame: { width: 320, height: 240 } },
    ),
    { width: 320, height: 240 },
  );
  assert.deepEqual(resolvePersonReplacementSourceImageSize(null, { frame: { width: 320, height: 240 } }), {
    width: 320,
    height: 240,
  });
});

test('resolvePersonReplacementSourceImageSize reports a zero box when nothing is usable', () => {
  assert.deepEqual(resolvePersonReplacementSourceImageSize(null, null), { width: 0, height: 0 });
  assert.deepEqual(
    resolvePersonReplacementSourceImageSize(
      { naturalWidth: -5, naturalHeight: 600 },
      { frame: { width: 0, height: 240 } },
    ),
    { width: 0, height: 0 },
  );
});

test('normalizePersonReplacementManualBoxEdit moves the box inside the frame', () => {
  assert.deepEqual(
    normalizePersonReplacementManualBoxEdit(
      { x: 0.2, y: 0.2, width: 0.4, height: 0.4 },
      { x: 0.1, y: -0.1 },
      'move',
    ),
    { x: 0.3, y: 0.1, width: 0.4, height: 0.4 },
  );
  assert.deepEqual(
    normalizePersonReplacementManualBoxEdit(
      { x: 0.7, y: 0.2, width: 0.4, height: 0.4 },
      { x: 0.5, y: 0 },
      'move',
    ),
    { x: 0.7, y: 0.2, width: 0.3, height: 0.4 },
  );
});

test('normalizePersonReplacementManualBoxEdit clamps the initial box into the frame', () => {
  assert.deepEqual(
    normalizePersonReplacementManualBoxEdit({ x: -0.5, y: 0.5, width: 5, height: 5 }, {}, 'move'),
    { x: 0, y: 0.5, width: 1, height: 0.5 },
  );
});

test('normalizePersonReplacementManualBoxEdit resizes the east edge', () => {
  assert.deepEqual(
    normalizePersonReplacementManualBoxEdit(
      { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
      { x: 0.5, y: 0 },
      'e',
    ),
    { x: 0.1, y: 0.1, width: 0.7, height: 0.2 },
  );
});

test('normalizePersonReplacementManualBoxEdit keeps the west edge outside the minimum width', () => {
  assert.deepEqual(
    normalizePersonReplacementManualBoxEdit(
      { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
      { x: 0.26, y: 0 },
      'w',
    ),
    { x: 0.275, y: 0.1, width: 0.025, height: 0.2 },
  );
});

test('normalizePersonReplacementManualBoxEdit resizes the north and south edges', () => {
  assert.deepEqual(
    normalizePersonReplacementManualBoxEdit(
      { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
      { x: 0, y: 0.5 },
      's',
    ),
    { x: 0.1, y: 0.1, width: 0.2, height: 0.7 },
  );
  assert.deepEqual(
    normalizePersonReplacementManualBoxEdit(
      { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
      { x: 0, y: -0.5 },
      'n',
    ),
    { x: 0.1, y: 0, width: 0.2, height: 0.3 },
  );
});

test('normalizePersonReplacementManualBoxEdit treats an unknown direction as no resize', () => {
  assert.deepEqual(
    normalizePersonReplacementManualBoxEdit(
      { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
      { x: 0.4, y: 0.4 },
      'x',
    ),
    { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
  );
});

test('normalizePersonReplacementManualBoxEdit ignores unusable deltas', () => {
  assert.deepEqual(
    normalizePersonReplacementManualBoxEdit(
      { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
      { x: 'a', y: null },
      'move',
    ),
    { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
  );
});

test('normalizePersonReplacementManualBoxEdit defaults to moving the whole box', () => {
  assert.deepEqual(
    normalizePersonReplacementManualBoxEdit({ x: 0.2, y: 0.2, width: 0.4, height: 0.4 }, { x: 0.1, y: 0 }),
    { x: 0.3, y: 0.2, width: 0.4, height: 0.4 },
  );
});
