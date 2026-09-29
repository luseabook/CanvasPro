import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GROUP_NODE_CONTENT_INSETS,
  createGroupNodeLayout,
  calculateGroupNodeBounds,
} from './groupNodeLayout.js';

test('freezes the content insets', () => {
  assert.equal(Object.isFrozen(GROUP_NODE_CONTENT_INSETS), true);
  assert.deepEqual({ ...GROUP_NODE_CONTENT_INSETS }, { top: 80, right: 32, bottom: 32, left: 32 });
});

test('pads the content box with the group insets', () => {
  const layout = createGroupNodeLayout({ x: 10, y: 20, contentWidth: 100, contentHeight: 50 });
  assert.deepEqual(layout, {
    x: 10,
    y: 20,
    width: 164,
    height: 162,
    contentX: 42,
    contentY: 100,
  });
});

test('never shrinks below the minimun size', () => {
  const layout = createGroupNodeLayout({
    contentWidth: 10,
    contentHeight: 10,
    minWidth: 500,
    minHeight: 400,
  });
  assert.equal(layout.width, 500);
  assert.equal(layout.height, 400);
  assert.equal(layout.contentX, 32);
  assert.equal(layout.contentY, 80);
});

test('lets the padded content win when it exceeds the minimum', () => {
  const layout = createGroupNodeLayout({
    contentWidth: 300,
    contentHeight: 10,
    minWidth: 100,
    minHeight: 100,
  });
  assert.equal(layout.width, 364);
  assert.equal(layout.height, 122);
});

test('floors the content size at zero for negative and non-numeric input', () => {
  assert.deepEqual(createGroupNodeLayout({ contentWidth: -50, contentHeight: -1 }), {
    x: 0,
    y: 0,
    width: 64,
    height: 112,
    contentX: 32,
    contentY: 80,
  });
  assert.deepEqual(createGroupNodeLayout({ x: 'abc', y: {}, contentWidth: NaN, contentHeight: 'nope' }), {
    x: 0,
    y: 0,
    width: 64,
    height: 112,
    contentX: 32,
    contentY: 80,
  });
});

test('accepts numeric strings and negative offsets', () => {
  const layout = createGroupNodeLayout({ x: '-40', y: '15.5', contentWidth: '20', contentHeight: '30' });
  assert.deepEqual(layout, {
    x: -40,
    y: 15.5,
    width: 84,
    height: 142,
    contentX: -8,
    contentY: 95.5,
  });
});

test('defaults every field when called with no argument', () => {
  assert.deepEqual(createGroupNodeLayout(), {
    x: 0,
    y: 0,
    width: 64,
    height: 112,
    contentX: 32,
    contentY: 80,
  });
});

test('rejects an empty or non-array node list', () => {
  for (const input of [[], null, undefined, 'nope', {}]) {
    assert.throws(() => calculateGroupNodeBounds(input), /requires at least one node/);
  }
});

test('ignores falsy entries when measuring the bounds', () => {
  const withHoles = calculateGroupNodeBounds([null, { x: 100, y: 200, width: 40, height: 30 }, undefined]);
  const without = calculateGroupNodeBounds([{ x: 100, y: 200, width: 40, height: 30 }]);
  assert.deepEqual(withHoles, without);
});

test('wraps a single node with the insets and no inner padding', () => {
  assert.deepEqual(calculateGroupNodeBounds([{ x: 100, y: 200, width: 40, height: 30 }]), {
    x: 68,
    y: 120,
    width: 104,
    height: 142,
  });
});

test('spans the full extent of a node cluster', () => {
  const bounds = calculateGroupNodeBounds([
    { x: 0, y: 0, width: 100, height: 50 },
    { x: 300, y: 400, width: 20, height: 20 },
  ]);
  assert.deepEqual(bounds, { x: -32, y: -80, width: 384, height: 532 });
});

test('falls back to the default node size when width or height is missing or zero', () => {
  assert.deepEqual(calculateGroupNodeBounds([{ x: 0, y: 0 }]), { x: -32, y: -80, width: 324, height: 212 });
  assert.deepEqual(calculateGroupNodeBounds([{ x: 0, y: 0, width: 0, height: 0 }]), {
    x: -32,
    y: -80,
    width: 324,
    height: 212,
  });
});

test('honors custom default node sizes', () => {
  assert.deepEqual(
    calculateGroupNodeBounds([{ x: 0, y: 0 }], { defaultNodeWidth: 10, defaultNodeHeight: 10 }),
    {
      x: -32,
      y: -80,
      width: 74,
      height: 122,
    },
  );
});

test('applies the minimum size to the measured bounds', () => {
  assert.deepEqual(
    calculateGroupNodeBounds([{ x: 0, y: 0, width: 1, height: 1 }], { minWidth: 400, minHeight: 300 }),
    { x: -32, y: -80, width: 400, height: 300 },
  );
});

test('returns only the four rectangle keys', () => {
  const bounds = calculateGroupNodeBounds([{ x: 0, y: 0, width: 1, height: 1 }]);
  assert.deepEqual(Object.keys(bounds).sort(), ['height', 'width', 'x', 'y']);
});

test('ignores non-numeric coordinates and sizes inside a node', () => {
  assert.deepEqual(calculateGroupNodeBounds([{ x: 'abc', y: null, width: 'oops', height: undefined }]), {
    x: -32,
    y: -80,
    width: 324,
    height: 212,
  });
});
