import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getArrowBendFromPoint,
  getArrowElbowOffsetFromPoint,
  getArrowGeometry,
  getDistanceToArrowPath,
} from './arrowGeometry.js';

function closeTo(actual, expected, label = '') {
  assert.ok(Math.abs(actual - expected) < 1e-9, label + ' expected ' + actual + ' to be near ' + expected);
}

test('直线箭头给出中点、长度与单位切向量', () => {
  const geometry = getArrowGeometry({ x1: 0, y1: 0, x2: 3, y2: 4 });
  assert.equal(geometry.type, 'straight');
  assert.deepEqual(geometry.start, { x: 0, y: 0 });
  assert.deepEqual(geometry.end, { x: 3, y: 4 });
  assert.deepEqual(geometry.middle, { x: 1.5, y: 2 });
  closeTo(geometry.length, 5);
  closeTo(geometry.startTangent.x, 0.6);
  closeTo(geometry.startTangent.y, 0.8);
  assert.deepEqual(geometry.startTangent, geometry.endTangent);
});

test('退化直线用 (1,0) 作为切向量', () => {
  const geometry = getArrowGeometry({ x1: 5, y1: 5, x2: 5, y2: 5 });
  assert.equal(geometry.length, 0);
  assert.deepEqual(geometry.startTangent, { x: 1, y: 0 });
  assert.deepEqual(geometry.middle, { x: 5, y: 5 });
});

test('非法端点坐标按 0 处理', () => {
  const geometry = getArrowGeometry({ x1: 'a', y1: null, x2: 2, y2: undefined });
  assert.deepEqual(geometry.start, { x: 0, y: 0 });
  assert.deepEqual(geometry.end, { x: 2, y: 0 });
});

test('显式 straight 时忽略 bend', () => {
  const geometry = getArrowGeometry({ x1: 0, y1: 0, x2: 10, y2: 0, arrowKind: 'straight', bend: 5 });
  assert.equal(geometry.type, 'straight');
  assert.equal(geometry.bend, undefined);
});

test('elbow 给出四点折线、偏移中点与折线长度', () => {
  const geometry = getArrowGeometry({ x1: 0, y1: 0, x2: 10, y2: 10, arrowKind: 'elbow', elbowOffset: 2 });
  assert.equal(geometry.type, 'elbow');
  assert.equal(geometry.horizontalRoute, true);
  assert.deepEqual(geometry.middle, { x: 7, y: 5 });
  assert.deepEqual(geometry.points, [
    { x: 0, y: 0 },
    { x: 7, y: 0 },
    { x: 7, y: 10 },
    { x: 10, y: 10 },
  ]);
  closeTo(geometry.length, 20);
  assert.deepEqual(geometry.startTangent, { x: 1, y: 0 });
  assert.deepEqual(geometry.endTangent, { x: 1, y: 0 });
});

test('elbow 在纵向为主时走竖直中线', () => {
  const geometry = getArrowGeometry({ x1: 0, y1: 0, x2: 4, y2: 10, arrowKind: 'elbow', elbowOffset: -1 });
  assert.equal(geometry.horizontalRoute, false);
  assert.deepEqual(geometry.points, [
    { x: 0, y: 0 },
    { x: 0, y: 4 },
    { x: 4, y: 4 },
    { x: 4, y: 10 },
  ]);
  closeTo(geometry.length, 4 + 4 + 6);
});

test('arrowKind 前后空格也识别', () => {
  assert.equal(getArrowGeometry({ x1: 0, y1: 0, x2: 1, y2: 0, arrowKind: ' elbow ' }).type, 'elbow');
});

test('无 bend 或 bend 过小时按直线处理', () => {
  assert.equal(getArrowGeometry({ x1: 0, y1: 0, x2: 10, y2: 0 }).type, 'straight');
  assert.equal(getArrowGeometry({ x1: 0, y1: 0, x2: 10, y2: 0, bend: 0.00005 }).type, 'straight');
  assert.equal(getArrowGeometry({ x1: 0, y1: 0, x2: 0, y2: 0, bend: 5 }).type, 'straight');
});

test('bend 生成经过偏移中点的圆弧', () => {
  const geometry = getArrowGeometry({ x1: 0, y1: 0, x2: 10, y2: 0, bend: 5 });
  assert.equal(geometry.type, 'arc');
  assert.deepEqual(geometry.middle, { x: 5, y: 5 });
  assert.equal(geometry.anticlockwise, true);
  closeTo(geometry.center.x, 5);
  closeTo(geometry.center.y, 0);
  closeTo(geometry.radius, 5);
  closeTo(geometry.sweep, Math.PI);
  closeTo(geometry.length, Math.PI * 5);
});

test('反向 bend 走另一侧且顺逆时针翻转', () => {
  const geometry = getArrowGeometry({ x1: 0, y1: 0, x2: 10, y2: 0, bend: -5 });
  assert.equal(geometry.type, 'arc');
  assert.deepEqual(geometry.middle, { x: 5, y: -5 });
  assert.equal(geometry.anticlockwise, false);
  closeTo(geometry.radius, 5);
  closeTo(geometry.sweep, Math.PI);
});

test('getArrowElbowOffsetFromPoint 按主方向取偏移', () => {
  assert.equal(getArrowElbowOffsetFromPoint({ x1: 0, y1: 0, x2: 10, y2: 10 }, { x: 9, y: 100 }), 4);
  assert.equal(getArrowElbowOffsetFromPoint({ x1: 0, y1: 0, x2: 4, y2: 10 }, { x: 100, y: 12 }), 7);
  assert.equal(getArrowElbowOffsetFromPoint({ x1: 0, y1: 0, x2: 10, y2: 10 }, { x: 'a', y: 0 }), -5);
});

test('getArrowBendFromPoint 给出带符号的垂距', () => {
  closeTo(getArrowBendFromPoint({ x1: 0, y1: 0, x2: 10, y2: 0 }, { x: 5, y: 3 }), 3);
  closeTo(getArrowBendFromPoint({ x1: 0, y1: 0, x2: 10, y2: 0 }, { x: 5, y: -2 }), -2);
  closeTo(getArrowBendFromPoint({ x1: 0, y1: 0, x2: 10, y2: 0 }, { x: 0, y: 4 }), 4);
});

test('getArrowBendFromPoint 在退化线段上返回 0', () => {
  assert.equal(getArrowBendFromPoint({ x1: 2, y1: 2, x2: 2, y2: 2 }, { x: 9, y: 9 }), 0);
});

test('点到直线路径的距离等于点到线段距离', () => {
  closeTo(getDistanceToArrowPath({ x: 5, y: 3 }, { x1: 0, y1: 0, x2: 10, y2: 0 }), 3);
  closeTo(getDistanceToArrowPath({ x: -4, y: 0 }, { x1: 0, y1: 0, x2: 10, y2: 0 }), 4);
  closeTo(getDistanceToArrowPath({ x: 5, y: 5 }, { x1: 0, y1: 0, x2: 10, y2: 0 }), 5);
});

test('点到折线路径的距离取各段最小值', () => {
  const arrow = { x1: 0, y1: 0, x2: 10, y2: 10, arrowKind: 'elbow', elbowOffset: 2 };
  closeTo(getDistanceToArrowPath({ x: 7, y: 5 }, arrow), 0);
  closeTo(getDistanceToArrowPath({ x: 7, y: 20 }, arrow), 10);
  closeTo(getDistanceToArrowPath({ x: 12, y: 10 }, arrow), 2);
});

test('点到圆弧路径：在扇区内取径向偏差，扇区外取端点距离', () => {
  const arc = { x1: 0, y1: 0, x2: 10, y2: 0, bend: 5 };
  closeTo(getDistanceToArrowPath({ x: 5, y: 5 }, arc), 0);
  closeTo(getDistanceToArrowPath({ x: 5, y: 7 }, arc), 2);
  closeTo(getDistanceToArrowPath({ x: 5, y: -5 }, arc), Math.hypot(5, 5));
});

test('点到路径的距离对非法坐标按 0 处理', () => {
  closeTo(getDistanceToArrowPath({ x: null, y: 'a' }, { x1: 0, y1: 0, x2: 10, y2: 0 }), 0);
});

test('轻微 bend 仍按圆弧处理，说明直线阈值保持很小', () => {
  assert.equal(getArrowGeometry({ x1: 0, y1: 0, x2: 10, y2: 0, bend: 0.3 }).type, 'arc');
});

test('圆弧端点切向量按顺逆时针方向给出', () => {
  const geometry = getArrowGeometry({ x1: 0, y1: 0, x2: 10, y2: 0, bend: 5 });
  closeTo(geometry.startTangent.x, 0);
  closeTo(geometry.startTangent.y, 1);
  closeTo(geometry.endTangent.x, 0);
  closeTo(geometry.endTangent.y, -1);
});

test('退化线段的点到路径距离退化为端点点距', () => {
  closeTo(getDistanceToArrowPath({ x: 5, y: 3 }, { x1: 2, y1: 2, x2: 2, y2: 2 }), Math.hypot(3, 1));
});
