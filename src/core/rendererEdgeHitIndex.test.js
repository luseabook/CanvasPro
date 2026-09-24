import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEdgeHitSpatialIndex,
  distanceToCubicBezierSquared,
  distanceToPolylineSquared,
  evaluateCubicBezier,
} from './rendererEdgeHitIndex.js';

const STRAIGHT_LINE = {
  startX: 0,
  startY: 0,
  control1X: 0,
  control1Y: 0,
  control2X: 10,
  control2Y: 0,
  endX: 10,
  endY: 0,
};

test('rendererEdgeHitIndex: 缺失几何求值返回 null，t 被夹到 0..1', () => {
  assert.equal(evaluateCubicBezier(null, 0.5), null);
  assert.equal(evaluateCubicBezier(undefined, 0.5), null);
  assert.deepEqual(evaluateCubicBezier(STRAIGHT_LINE, -5), { x: 0, y: 0 });
  assert.deepEqual(evaluateCubicBezier(STRAIGHT_LINE, 5), { x: 10, y: 0 });
  assert.deepEqual(evaluateCubicBezier(STRAIGHT_LINE, 0.5), { x: 5, y: 0 });
});

test('rendererEdgeHitIndex: 空几何坐标归零、hitPoints 为 null 时回落到曲线分支', () => {
  assert.deepEqual(evaluateCubicBezier({}, 0), { x: 0, y: 0 });
  assert.deepEqual(evaluateCubicBezier({}, 1), { x: 0, y: 0 });
  assert.deepEqual(evaluateCubicBezier({ pathStyle: '', endX: 'abc' }, 1), { x: 0, y: 0 });
});

test('rendererEdgeHitIndex: 三次贝塞尔点到线距离平方逼近解析值', () => {
  const d = distanceToCubicBezierSquared(STRAIGHT_LINE, 5, 7);
  assert.ok(Math.abs(d - 49) < 1e-6, `d=${d}`);
  assert.equal(distanceToCubicBezierSquared(STRAIGHT_LINE, 5, -7), d);
  assert.equal(distanceToCubicBezierSquared(STRAIGHT_LINE, 5, 0), 0);
});

test('rendererEdgeHitIndex: 贝塞尔距离对非法几何给 +Infinity、采样数下限为 8', () => {
  assert.equal(distanceToCubicBezierSquared(null, 1, 1), Number.POSITIVE_INFINITY);
  assert.equal(distanceToCubicBezierSquared({}, 1, 1), 2);
  const coarse = distanceToCubicBezierSquared(STRAIGHT_LINE, 4.7, 3.3, { refinements: 0 });
  const refined = distanceToCubicBezierSquared(STRAIGHT_LINE, 4.7, 3.3);
  assert.ok(refined <= coarse + 1e-9, `refined=${refined} coarse=${coarse}`);
  assert.equal(distanceToCubicBezierSquared(STRAIGHT_LINE, 5, 7, { samples: 1 }), 49);
  assert.equal(distanceToCubicBezierSquared(STRAIGHT_LINE, 5, 7, { samples: Number.NaN }), 49);
});

test('rendererEdgeHitIndex: 折线距离平方与退化输入', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
  ];
  assert.equal(distanceToPolylineSquared(points, 5, 3), 9);
  assert.equal(distanceToPolylineSquared(points, 20, 0), 100);
  assert.equal(distanceToPolylineSquared(points, Number.NaN, 0), 0);
  assert.equal(distanceToPolylineSquared([{ x: 0, y: 0 }], 0, 0), Number.POSITIVE_INFINITY);
  assert.equal(distanceToPolylineSquared(null, 0, 0), Number.POSITIVE_INFINITY);
});

test('rendererEdgeHitIndex: upsert 拒绝空 id / 空几何，重复挂载不增计数', () => {
  const index = createEdgeHitSpatialIndex();
  assert.equal(index.upsert({ edgeId: '', geometry: STRAIGHT_LINE }), false);
  assert.equal(index.upsert({ edgeId: 'e1', geometry: null }), false);
  assert.equal(index.upsert({}), false);
  assert.equal(index.upsert({ edgeId: 'e1', geometry: STRAIGHT_LINE }), true);
  const first = index.getStats();
  assert.equal(first.edgeCount, 1);
  assert.ok(first.cellCount >= 1);
  assert.ok(first.membershipCount >= 1);
  assert.equal(index.upsert({ edgeId: 'e1', geometry: { ...STRAIGHT_LINE, endX: 20 } }), true);
  assert.equal(index.getStats().edgeCount, 1);
});

test('rendererEdgeHitIndex: hitTest 先按 order 降序再按 id 降序命中，并尊重容差', () => {
  const index = createEdgeHitSpatialIndex();
  index.upsert({ edgeId: 'a', geometry: STRAIGHT_LINE, order: 1 });
  index.upsert({ edgeId: 'b', geometry: STRAIGHT_LINE, order: 5 });
  assert.equal(index.hitTest(5, 0, 0).edgeId, 'b');
  assert.equal(index.hitTest(5, 0, 4).edgeId, 'b');
  assert.equal(index.hitTest(5, 0.5, 0), null);
  assert.equal(index.hitTest(5, 0.5, 0.5).edgeId, 'b');
  assert.equal(index.hitTest(5, 0.6, 0.5), null);
});

test('rendererEdgeHitIndex: queryCandidates 输出归一化记录，remove/clear 后失效', () => {
  const index = createEdgeHitSpatialIndex();
  index.upsert({ edgeId: 'a', geometry: STRAIGHT_LINE, order: 2 });
  index.upsert({ edgeId: 'b', geometry: STRAIGHT_LINE, order: 9 });
  assert.deepEqual(
    index.queryCandidates(5, 0, 4).map((record) => record.edgeId),
    ['b', 'a'],
  );
  assert.equal(typeof index.queryCandidates(5, 0, 4)[0].geometry.pathStyle, 'string');
  assert.equal(index.remove('b'), true);
  assert.deepEqual(
    index.queryCandidates(5, 0, 4).map((record) => record.edgeId),
    ['a'],
  );
  assert.equal(index.hitTest(5, 0, 1).edgeId, 'a');
  index.remove('a');
  assert.equal(index.hitTest(5, 0, 100), null);
  assert.deepEqual(index.getStats(), { edgeCount: 0, cellCount: 0, membershipCount: 0 });
  index.upsert({ edgeId: 'c', geometry: STRAIGHT_LINE });
  index.clear();
  assert.deepEqual(index.getStats(), { edgeCount: 0, cellCount: 0, membershipCount: 0 });
});

test('rendererEdgeHitIndex: hitPoints 存在时走折线分支，单点列表回落曲线', () => {
  const index = createEdgeHitSpatialIndex({ cellSize: 64, subdivisionFlatness: 1, maxSubdivisionDepth: 3 });
  index.upsert({
    edgeId: 'poly',
    geometry: {
      ...STRAIGHT_LINE,
      hitPoints: [
        { x: 0, y: 0 },
        { x: 0, y: 100 },
      ],
    },
  });
  const hit = index.hitTest(2, 50, 5);
  assert.equal(hit.edgeId, 'poly');
  assert.equal(hit.geometry.hitPoints.length, 2);
  assert.equal(index.hitTest(2, 50, 1), null);

  const degenerate = createEdgeHitSpatialIndex();
  degenerate.upsert({ edgeId: 'd', geometry: { ...STRAIGHT_LINE, hitPoints: [{ x: 0, y: 0 }] } });
  assert.equal(degenerate.hitTest(2, 50, 5), null);
  assert.equal(degenerate.hitTest(5, 0, 1).edgeId, 'd');
});
