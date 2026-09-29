import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveAutoPanVelocity } from './viewportAutoPan.js';

test('主对象齐全时原样返回两个分量', () => {
  assert.deepEqual(resolveAutoPanVelocity({ dx: 3, dy: -4 }, { dx: 9, dy: 9 }), { dx: 3, dy: -4 });
});

test('主对象缺分量时逐项回落到兜底对象', () => {
  assert.deepEqual(resolveAutoPanVelocity({ dx: 3 }, { dx: 9, dy: -4 }), { dx: 3, dy: -4 });
  assert.deepEqual(resolveAutoPanVelocity({ dy: 5 }, { dx: 1, dy: 2 }), { dx: 1, dy: 5 });
});

test('零与负数属于有效值，不会被当成缺失而回落', () => {
  assert.deepEqual(resolveAutoPanVelocity({ dx: 0, dy: -0.5 }, { dx: 7, dy: 7 }), { dx: 0, dy: -0.5 });
  assert.deepEqual(resolveAutoPanVelocity({ dx: -0 }, { dx: 8, dy: 8 }).dx, -0);
});

test('缺失用 null 表示时才回落，undefined 同样回落', () => {
  assert.deepEqual(resolveAutoPanVelocity({ dx: null, dy: undefined }, { dx: 2, dy: 3 }), {
    dx: 2,
    dy: 3,
  });
});

test('只返回 dx 与 dy，忽略多余字段', () => {
  const result = resolveAutoPanVelocity({ dx: 1, dy: 2, dz: 3, speed: 4 }, {});
  assert.deepEqual(result, { dx: 1, dy: 2 });
  assert.deepEqual(Object.keys(result), ['dx', 'dy']);
});

test('零 dy 属于有效值，不会被兜底覆盖', () => {
  assert.deepEqual(resolveAutoPanVelocity({ dx: 1, dy: 0 }, { dx: 8, dy: 8 }), { dx: 1, dy: 0 });
});
