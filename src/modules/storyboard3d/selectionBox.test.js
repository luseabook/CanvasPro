import assert from 'node:assert/strict';
import test from 'node:test';

import {
  STORYBOARD_3D_SELECTION_DRAG_THRESHOLD,
  createStoryboard3DSelectionRect,
  hasStoryboard3DSelectionDragMoved,
  mergeStoryboard3DBoxSelection,
} from './selectionBox.js';

test('框选矩形：两角点归一为左上右下并给出宽高', () => {
  assert.equal(STORYBOARD_3D_SELECTION_DRAG_THRESHOLD, 4);
  assert.deepEqual(
    createStoryboard3DSelectionRect({ clientX: 10, clientY: 20 }, { clientX: 30, clientY: 5 }),
    {
      left: 10,
      top: 5,
      right: 30,
      bottom: 20,
      width: 20,
      height: 15,
    },
  );
  assert.deepEqual(
    createStoryboard3DSelectionRect({ clientX: 30, clientY: 5 }, { clientX: 10, clientY: 20 }),
    {
      left: 10,
      top: 5,
      right: 30,
      bottom: 20,
      width: 20,
      height: 15,
    },
  );
});

test('框选矩形：缺省角点回落到起点，非有限值回落为 0', () => {
  assert.deepEqual(createStoryboard3DSelectionRect({ clientX: 10, clientY: 20 }, {}), {
    left: 10,
    top: 20,
    right: 10,
    bottom: 20,
    width: 0,
    height: 0,
  });
  assert.deepEqual(createStoryboard3DSelectionRect(), {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
  });
  const nan = createStoryboard3DSelectionRect(
    { clientX: 'x', clientY: 7 },
    { clientX: 'y', clientY: undefined },
  );
  assert.deepEqual(nan, { left: 0, top: 7, right: 0, bottom: 7, width: 0, height: 0 });
});

test('拖动判定：宽或高达到 4 像素阈值即为已拖动', () => {
  assert.equal(hasStoryboard3DSelectionDragMoved({ width: 3, height: 0 }), false);
  assert.equal(hasStoryboard3DSelectionDragMoved({ width: 4, height: 0 }), true);
  assert.equal(hasStoryboard3DSelectionDragMoved({ width: 0, height: 5 }), true);
  assert.equal(hasStoryboard3DSelectionDragMoved({ width: 4 }), true);
  assert.equal(hasStoryboard3DSelectionDragMoved({}), false);
  assert.equal(hasStoryboard3DSelectionDragMoved(undefined), false);
  assert.equal(hasStoryboard3DSelectionDragMoved(null), false);
});

test('框选合并：默认取命中集合且去重去空', () => {
  assert.deepEqual(
    mergeStoryboard3DBoxSelection({
      initialObjectIds: ['a', 'b'],
      hitObjectIds: ['c', 'c', 'a', '', null],
    }),
    ['c', 'a'],
  );
  assert.deepEqual(mergeStoryboard3DBoxSelection({}), []);
  assert.deepEqual(mergeStoryboard3DBoxSelection(), []);
});

test('框选合并：加选保持初始集合在前并去重', () => {
  assert.deepEqual(
    mergeStoryboard3DBoxSelection({
      initialObjectIds: ['a', 'b', 'a'],
      hitObjectIds: ['b', 'c'],
      additive: true,
    }),
    ['a', 'b', 'c'],
  );
});

test('框选合并：切换模式对命中项取对称差', () => {
  assert.deepEqual(
    mergeStoryboard3DBoxSelection({
      initialObjectIds: ['a', 'b'],
      hitObjectIds: ['b', 'c'],
      toggle: true,
    }),
    ['a', 'c'],
  );
  assert.deepEqual(
    mergeStoryboard3DBoxSelection({
      initialObjectIds: ['a', 'b'],
      hitObjectIds: ['a', 'b'],
      toggle: true,
    }),
    [],
  );
  assert.deepEqual(
    mergeStoryboard3DBoxSelection({ initialObjectIds: [], hitObjectIds: ['x', 'y'], toggle: true }),
    ['x', 'y'],
  );
});

test('框选合并：切换优先于加选', () => {
  assert.deepEqual(
    mergeStoryboard3DBoxSelection({
      initialObjectIds: ['a'],
      hitObjectIds: ['a', 'b'],
      additive: true,
      toggle: true,
    }),
    ['b'],
  );
});
