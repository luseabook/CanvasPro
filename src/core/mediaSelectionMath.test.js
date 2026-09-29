import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizedMediaDragRect, resolveNormalizedMediaCrop } from './mediaSelectionMath.js';

test('mediaSelectionMath: resolves normalized crop values and rejects invalid ranges', () => {
  assert.deepEqual(resolveNormalizedMediaCrop(null, 101, 51), {
    x: 0,
    y: 0,
    width: 101,
    height: 51,
  });
  assert.deepEqual(resolveNormalizedMediaCrop({ x: 0.1, y: 0.2, width: 0.5, height: 0.25 }, 101, 101), {
    x: 10,
    y: 20,
    width: 51,
    height: 25,
  });
  assert.throws(
    () => resolveNormalizedMediaCrop({ x: 0.9, y: 0, width: 0.2, height: 0.5 }, 100, 100),
    /裁剪范围无效/,
  );
  assert.throws(
    () => resolveNormalizedMediaCrop({ x: 0, y: 0, width: 0, height: 0.5 }, 100, 100),
    /裁剪范围无效/,
  );
});

test('mediaSelectionMath: clamps drag rectangles and normalizes reverse drags', () => {
  const bounds = { left: 10, top: 20, width: 200, height: 100 };
  assert.deepEqual(normalizedMediaDragRect(bounds, { x: -10, y: 50 }, { x: 310, y: -10 }), {
    x: 0,
    y: 0,
    width: 1,
    height: 0.3,
  });
  assert.deepEqual(normalizedMediaDragRect(bounds, { x: 110, y: 70 }, { x: 60, y: 40 }), {
    x: 0.25,
    y: 0.2,
    width: 0.25,
    height: 0.3,
  });
});
