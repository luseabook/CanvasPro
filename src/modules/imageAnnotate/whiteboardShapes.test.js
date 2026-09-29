import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getWhiteboardShapeBounds,
  isClosedWhiteboardShape,
  traceWhiteboardShapePath,
} from './whiteboardShapes.js';

const makeCtx = () => {
  const calls = [];
  const ctx = { calls };
  for (const name of [
    'moveTo',
    'lineTo',
    'closePath',
    'rect',
    'ellipse',
    'quadraticCurveTo',
    'bezierCurveTo',
  ]) {
    ctx[name] = (...args) => calls.push([name, ...args]);
  }
  ctx.count = (name) => calls.filter((call) => call[0] === name).length;
  return ctx;
};

const roundNumbers = (calls) =>
  calls.map((call) =>
    call.map((value) => (typeof value === 'number' ? Math.round(value * 1e6) / 1e6 : value)),
  );

const WIDE = { x: 0, y: 0, width: 100, height: 50 };
const FLAT = { x: 0, y: 0, width: 100, height: 40 };

test('getWhiteboardShapeBounds normalizes a reversed rectangle', () => {
  assert.deepEqual(getWhiteboardShapeBounds({ x1: 10, y1: 20, x2: 0, y2: 0 }), {
    x: 0,
    y: 0,
    width: 10,
    height: 20,
  });
});

test('getWhiteboardShapeBounds coerces missing coordinates to zero', () => {
  assert.deepEqual(getWhiteboardShapeBounds({}), { x: 0, y: 0, width: 0, height: 0 });
  assert.deepEqual(getWhiteboardShapeBounds({ x1: 'a', y1: 'b', x2: 3, y2: 4 }), {
    x: 0,
    y: 0,
    width: 3,
    height: 4,
  });
});

test('isClosedWhiteboardShape reports open shapes as unclosed', () => {
  assert.equal(isClosedWhiteboardShape('line'), false);
  assert.equal(isClosedWhiteboardShape('frame'), false);
  assert.equal(isClosedWhiteboardShape('circle'), true);
  assert.equal(isClosedWhiteboardShape('rectangle'), true);
});

test('traceWhiteboardShapePath refuses to draw without a context', () => {
  assert.equal(traceWhiteboardShapePath(null, 'circle', WIDE), false);
});

test('traceWhiteboardShapePath draws a centred ellipse for circles', () => {
  const ctx = makeCtx();
  assert.equal(traceWhiteboardShapePath(ctx, 'circle', WIDE), true);
  assert.deepEqual(ctx.calls, [['ellipse', 50, 25, 50, 25, 0, 0, Math.PI * 2], ['closePath']]);
});

test('traceWhiteboardShapePath clamps a negative width to zero', () => {
  const ctx = makeCtx();
  traceWhiteboardShapePath(ctx, 'circle', { x: 0, y: 0, width: -10, height: 5 });
  assert.deepEqual(ctx.calls, [['ellipse', 0, 2.5, 0, 2.5, 0, 0, Math.PI * 2], ['closePath']]);
});

test('traceWhiteboardShapePath treats malformed bounds as an origin-sized box', () => {
  const ctx = makeCtx();
  traceWhiteboardShapePath(ctx, 'rectangle', {});
  assert.deepEqual(ctx.calls, [['rect', 0, 0, 0, 0]]);
});

test('traceWhiteboardShapePath draws a triangle from the top-centre apex', () => {
  const ctx = makeCtx();
  traceWhiteboardShapePath(ctx, 'triangle', WIDE);
  assert.deepEqual(ctx.calls, [['moveTo', 50, 0], ['lineTo', 100, 50], ['lineTo', 0, 50], ['closePath']]);
});

test('traceWhiteboardShapePath draws a diamond through the four edge midpoints', () => {
  const ctx = makeCtx();
  traceWhiteboardShapePath(ctx, 'diamond', WIDE);
  assert.deepEqual(ctx.calls, [
    ['moveTo', 50, 0],
    ['lineTo', 100, 25],
    ['lineTo', 50, 50],
    ['lineTo', 0, 25],
    ['closePath'],
  ]);
});

test('traceWhiteboardShapePath draws a six-point hexagon', () => {
  const ctx = makeCtx();
  traceWhiteboardShapePath(ctx, 'hexagon', WIDE);
  assert.deepEqual(ctx.calls, [
    ['moveTo', 25, 0],
    ['lineTo', 75, 0],
    ['lineTo', 100, 25],
    ['lineTo', 75, 50],
    ['lineTo', 25, 50],
    ['lineTo', 0, 25],
    ['closePath'],
  ]);
});

test('traceWhiteboardShapePath draws a slanted parallelogram', () => {
  const ctx = makeCtx();
  traceWhiteboardShapePath(ctx, 'parallelogram', WIDE);
  assert.deepEqual(ctx.calls, [
    ['moveTo', 20, 0],
    ['lineTo', 100, 0],
    ['lineTo', 80, 50],
    ['lineTo', 0, 50],
    ['closePath'],
  ]);
});

test('traceWhiteboardShapePath builds a ten-vertex star', () => {
  const ctx = makeCtx();
  traceWhiteboardShapePath(ctx, 'star', WIDE);
  assert.equal(ctx.count('moveTo'), 1);
  assert.equal(ctx.count('lineTo'), 9);
  assert.equal(ctx.count('closePath'), 1);
  assert.deepEqual(ctx.calls[0], ['moveTo', 50, 0]);
  const vertices = ctx.calls.filter((call) => call[0] === 'moveTo' || call[0] === 'lineTo');
  assert.equal(vertices.length, 10);
  vertices.forEach(([, x, y], index) => {
    const radius = Math.hypot(x - 50, y - 25);
    assert.ok(Math.abs(radius - (index % 2 === 0 ? 25 : 11.5)) < 1e-9, `vertex ${index} radius ${radius}`);
  });
});

test('traceWhiteboardShapePath rounds a pill with four quadratic corners', () => {
  const ctx = makeCtx();
  traceWhiteboardShapePath(ctx, 'pill', FLAT);
  assert.deepEqual(ctx.calls, [
    ['moveTo', 20, 0],
    ['lineTo', 80, 0],
    ['quadraticCurveTo', 100, 0, 100, 20],
    ['lineTo', 100, 20],
    ['quadraticCurveTo', 100, 40, 80, 40],
    ['lineTo', 20, 40],
    ['quadraticCurveTo', 0, 40, 0, 20],
    ['lineTo', 0, 20],
    ['quadraticCurveTo', 0, 0, 20, 0],
    ['closePath'],
  ]);
});

test('traceWhiteboardShapePath joins a cloud from four bezier lobes', () => {
  const ctx = makeCtx();
  traceWhiteboardShapePath(ctx, 'cloud', FLAT);
  assert.equal(ctx.count('moveTo'), 1);
  assert.equal(ctx.count('bezierCurveTo'), 4);
  assert.equal(ctx.count('closePath'), 1);
  assert.deepEqual(ctx.calls[0], ['moveTo', 22, 40]);
  assert.deepEqual(ctx.calls[1], ['bezierCurveTo', 0, 40, 0, 20.8, 20, 20]);
});

test('traceWhiteboardShapePath joins a heart from four bezier lobes', () => {
  const ctx = makeCtx();
  traceWhiteboardShapePath(ctx, 'heart', FLAT);
  assert.equal(ctx.count('moveTo'), 1);
  assert.equal(ctx.count('bezierCurveTo'), 4);
  assert.equal(ctx.count('closePath'), 1);
  assert.deepEqual(ctx.calls[0], ['moveTo', 50, 40]);
  assert.deepEqual(ctx.calls[1], ['bezierCurveTo', 10, 26, 0, 14, 22, 6.4]);
});

test('traceWhiteboardShapePath draws a crossed box without closing the path', () => {
  const ctx = makeCtx();
  traceWhiteboardShapePath(ctx, 'crossed-box', FLAT);
  assert.deepEqual(ctx.calls, [
    ['rect', 0, 0, 100, 40],
    ['moveTo', 0, 0],
    ['lineTo', 100, 40],
    ['moveTo', 100, 0],
    ['lineTo', 0, 40],
  ]);
});

test('traceWhiteboardShapePath draws a checkbox tick', () => {
  const ctx = makeCtx();
  traceWhiteboardShapePath(ctx, 'checkbox', FLAT);
  assert.deepEqual(ctx.calls, [
    ['rect', 0, 0, 100, 40],
    ['moveTo', 20, 20],
    ['lineTo', 42, 30],
    ['lineTo', 82, 8.8],
  ]);
});

test('traceWhiteboardShapePath mirrors the horizontal arrows', () => {
  const left = makeCtx();
  traceWhiteboardShapePath(left, 'arrow-left', FLAT);
  assert.deepEqual(roundNumbers(left.calls), [
    ['moveTo', 0, 20],
    ['lineTo', 42, 0],
    ['lineTo', 42, 11.2],
    ['lineTo', 100, 11.2],
    ['lineTo', 100, 28.8],
    ['lineTo', 42, 28.8],
    ['lineTo', 42, 40],
    ['closePath'],
  ]);
  const right = makeCtx();
  traceWhiteboardShapePath(right, 'arrow-right', FLAT);
  assert.equal(right.count('lineTo'), 6);
  assert.equal(right.count('closePath'), 1);
  assert.deepEqual(roundNumbers(right.calls.slice(0, 4)), [
    ['moveTo', 100, 20],
    ['lineTo', 58, 0],
    ['lineTo', 58, 11.2],
    ['lineTo', 0, 11.2],
  ]);
});

test('traceWhiteboardShapePath mirrors the vertical arrows', () => {
  const up = makeCtx();
  traceWhiteboardShapePath(up, 'arrow-up', FLAT);
  assert.deepEqual(roundNumbers(up.calls), [
    ['moveTo', 50, 0],
    ['lineTo', 100, 16.8],
    ['lineTo', 72, 16.8],
    ['lineTo', 72, 40],
    ['lineTo', 28, 40],
    ['lineTo', 28, 16.8],
    ['lineTo', 0, 16.8],
    ['closePath'],
  ]);
  const down = makeCtx();
  traceWhiteboardShapePath(down, 'arrow-down', FLAT);
  assert.deepEqual(roundNumbers(down.calls.slice(0, 7)), [
    ['moveTo', 50, 40],
    ['lineTo', 100, 23.2],
    ['lineTo', 72, 23.2],
    ['lineTo', 72, 0],
    ['lineTo', 28, 0],
    ['lineTo', 28, 23.2],
    ['lineTo', 0, 23.2],
  ]);
});

test('traceWhiteboardShapePath draws a line from the bottom-left to the top-right', () => {
  const ctx = makeCtx();
  assert.equal(traceWhiteboardShapePath(ctx, 'line', FLAT), true);
  assert.deepEqual(ctx.calls, [
    ['moveTo', 0, 40],
    ['lineTo', 100, 0],
  ]);
});

test('traceWhiteboardShapePath draws a four-corner frame', () => {
  const ctx = makeCtx();
  traceWhiteboardShapePath(ctx, 'frame', FLAT);
  assert.deepEqual(ctx.calls, [
    ['moveTo', 0, 10],
    ['lineTo', 0, 0],
    ['lineTo', 10, 0],
    ['moveTo', 90, 0],
    ['lineTo', 100, 0],
    ['lineTo', 100, 10],
    ['moveTo', 100, 30],
    ['lineTo', 100, 40],
    ['lineTo', 90, 40],
    ['moveTo', 10, 40],
    ['lineTo', 0, 40],
    ['lineTo', 0, 30],
  ]);
});

test('traceWhiteboardShapePath falls back to a rectangle for unknown shapes', () => {
  const ctx = makeCtx();
  assert.equal(traceWhiteboardShapePath(ctx, 'rectangle', FLAT), true);
  assert.deepEqual(ctx.calls, [['rect', 0, 0, 100, 40]]);
  const unknown = makeCtx();
  traceWhiteboardShapePath(unknown, 'mystery', FLAT);
  assert.deepEqual(unknown.calls, [['rect', 0, 0, 100, 40]]);
});
