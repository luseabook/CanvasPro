import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  snapWhiteboardPointToAngle,
  getPointToSegmentDistance,
  getSegmentToSegmentDistance,
  doesSegmentHitPolyline,
  getPolylineBounds,
  doesSegmentHitBounds,
  doesSegmentHitCircle,
  doesSegmentHitPolygon,
} from './whiteboardInteractionGeometry.js';

const closeTo = (actual, expected, eps = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= eps, `expected ${actual} ≈ ${expected}`);
};

test('snapWhiteboardPointToAngle keeps distance and snaps onto the default 15° grid', () => {
  const snapped = snapWhiteboardPointToAngle({ x: 0, y: 0 }, { x: 10, y: 0.5 });
  closeTo(snapped.x, Math.hypot(10, 0.5));
  assert.equal(snapped.y, 0);
});

test('snapWhiteboardPointToAngle with a 90° step collapses onto the vertical axis', () => {
  const snapped = snapWhiteboardPointToAngle({ x: 0, y: 0 }, { x: 1, y: 5 }, Math.PI / 2);
  closeTo(snapped.x, 0);
  closeTo(snapped.y, Math.hypot(1, 5));
});

test('snapWhiteboardPointToAngle respects a non-finite step by falling back to the default', () => {
  const snapped = snapWhiteboardPointToAngle({ x: 0, y: 0 }, { x: 10, y: 0.5 }, Number.NaN);
  closeTo(snapped.x, Math.hypot(10, 0.5));
  assert.equal(snapped.y, 0);
});

test('snapWhiteboardPointToAngle clamps a zero step to EPSILON instead of dividing by zero', () => {
  const snapped = snapWhiteboardPointToAngle({ x: 0, y: 0 }, { x: 10, y: 0.5 }, 0);
  closeTo(snapped.x, 10, 1e-4);
  closeTo(snapped.y, 0.5, 1e-4);
});

test('snapWhiteboardPointToAngle returns a detached copy when origin equals the point', () => {
  const origin = { x: 3, y: 4 };
  const snapped = snapWhiteboardPointToAngle(origin, { x: 3, y: 4 });
  assert.deepEqual(snapped, { x: 3, y: 4 });
  assert.notStrictEqual(snapped, origin);
  snapped.x = 99;
  assert.equal(origin.x, 3);
});

test('snapWhiteboardPointToAngle treats non-finite inputs as the origin', () => {
  const snapped = snapWhiteboardPointToAngle({ x: 'nope', y: null }, { x: 'nope', y: null });
  assert.deepEqual(snapped, { x: 0, y: 0 });
});

test('getPointToSegmentDistance projects onto the interior of the segment', () => {
  assert.equal(getPointToSegmentDistance({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 }), 3);
});

test('getPointToSegmentDistance clamps to the nearest endpoint', () => {
  assert.equal(getPointToSegmentDistance({ x: -5, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 }), 5);
  assert.equal(getPointToSegmentDistance({ x: 15, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 }), 5);
});

test('getPointToSegmentDistance handles a degenerate segment', () => {
  assert.equal(getPointToSegmentDistance({ x: 2, y: 5 }, { x: 2, y: 2 }, { x: 2, y: 2 }), 3);
});

test('getPointToSegmentDistance coerces non-finite coordinates to zero', () => {
  assert.equal(getPointToSegmentDistance({ x: 'x', y: 'y' }, { x: 0, y: 0 }, { x: 10, y: 0 }), 0);
});

test('getSegmentToSegmentDistance returns zero for crossing segments', () => {
  assert.equal(
    getSegmentToSegmentDistance({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 10, y: 0 }),
    0,
  );
});

test('getSegmentToSegmentDistance returns zero when endpoints touch', () => {
  assert.equal(
    getSegmentToSegmentDistance({ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 0 }, { x: 10, y: 0 }),
    0,
  );
});

test('getSegmentToSegmentDistance measures the gap between parallel segments', () => {
  assert.equal(
    getSegmentToSegmentDistance({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 5 }, { x: 10, y: 5 }),
    5,
  );
});

test('getSegmentToSegmentDistance measures the gap between collinear disjoint segments', () => {
  assert.equal(
    getSegmentToSegmentDistance({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }),
    4,
  );
});

test('doesSegmentHitPolyline returns false for an empty polyline', () => {
  assert.equal(doesSegmentHitPolyline({ x: 0, y: 0 }, { x: 10, y: 0 }, []), false);
  assert.equal(doesSegmentHitPolyline({ x: 0, y: 0 }, { x: 10, y: 0 }, null), false);
});

test('doesSegmentHitPolyline compares a single point against the segment', () => {
  const points = [{ x: 5, y: 1 }];
  assert.equal(doesSegmentHitPolyline({ x: 0, y: 0 }, { x: 10, y: 0 }, points, 1), true);
  assert.equal(doesSegmentHitPolyline({ x: 0, y: 0 }, { x: 10, y: 0 }, points, 0.999), false);
});

test('doesSegmentHitPolyline hits when any segment of the polyline is within tolerance', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
  ];
  assert.equal(doesSegmentHitPolyline({ x: 20, y: 5 }, { x: 20, y: 15 }, points), false);
  assert.equal(doesSegmentHitPolyline({ x: 20, y: 5 }, { x: 20, y: 15 }, points, 10), true);
});

test('doesSegmentHitPolyline clamps a negative tolerance to zero', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
  ];
  assert.equal(doesSegmentHitPolyline({ x: 0, y: 1 }, { x: 10, y: 1 }, points, -5), false);
  assert.equal(doesSegmentHitPolyline({ x: 0, y: 0 }, { x: 10, y: 0 }, points, -5), true);
});

test('getPolylineBounds returns the bounding box of finite points', () => {
  const bounds = getPolylineBounds([
    { x: 0, y: 0 },
    { x: 10, y: 5 },
  ]);
  assert.deepEqual(bounds, { x: 0, y: 0, width: 10, height: 5 });
});

test('getPolylineBounds inflates the box by the padding on both sides', () => {
  const bounds = getPolylineBounds(
    [
      { x: 0, y: 0 },
      { x: 10, y: 5 },
    ],
    2,
  );
  assert.deepEqual(bounds, { x: -2, y: -2, width: 14, height: 9 });
});

test('getPolylineBounds clamps a negative padding to zero', () => {
  const bounds = getPolylineBounds(
    [
      { x: 0, y: 0 },
      { x: 10, y: 5 },
    ],
    -4,
  );
  assert.deepEqual(bounds, { x: 0, y: 0, width: 10, height: 5 });
});

test('getPolylineBounds returns null when every point is rejected', () => {
  assert.equal(getPolylineBounds([]), null);
  assert.equal(
    getPolylineBounds([
      { x: 'a', y: 'b' },
      { x: null, y: undefined },
    ]),
    null,
  );
  assert.equal(getPolylineBounds(null), null);
});

test('getPolylineBounds skips non-finite entries and keeps the finite ones', () => {
  const bounds = getPolylineBounds([
    { x: 0, y: 0 },
    { x: 10, y: 5 },
    { x: 'bad', y: 99 },
  ]);
  assert.deepEqual(bounds, { x: 0, y: 0, width: 10, height: 5 });
});

test('doesSegmentHitBounds detects a segment fully inside the box', () => {
  const bounds = { x: 0, y: 0, width: 10, height: 10 };
  assert.equal(doesSegmentHitBounds({ x: 2, y: 2 }, { x: 3, y: 3 }, bounds), true);
});

test('doesSegmentHitBounds detects a segment that crosses an edge', () => {
  const bounds = { x: 0, y: 0, width: 10, height: 10 };
  assert.equal(doesSegmentHitBounds({ x: -5, y: 5 }, { x: 15, y: 5 }, bounds), true);
});

test('doesSegmentHitBounds rejects a segment completely outside', () => {
  const bounds = { x: 0, y: 0, width: 10, height: 10 };
  assert.equal(doesSegmentHitBounds({ x: 20, y: 20 }, { x: 30, y: 30 }, bounds), false);
});

test('doesSegmentHitBounds honours the padding ring', () => {
  const bounds = { x: 0, y: 0, width: 10, height: 10 };
  assert.equal(doesSegmentHitBounds({ x: 12, y: 5 }, { x: 14, y: 5 }, bounds), false);
  assert.equal(doesSegmentHitBounds({ x: 12, y: 5 }, { x: 14, y: 5 }, bounds, 5), true);
});

test('doesSegmentHitBounds tolerates malformed bounds and padding', () => {
  const bounds = { x: 'a', y: null, width: 'b', height: -3 };
  assert.equal(doesSegmentHitBounds({ x: 0, y: 0 }, { x: 0, y: 0 }, bounds), true);
  assert.equal(doesSegmentHitBounds({ x: 5, y: 5 }, { x: 6, y: 6 }, bounds, -2), false);
});

test('doesSegmentHitCircle compares the segment distance against the radius', () => {
  assert.equal(doesSegmentHitCircle({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 0 }, 2), true);
  assert.equal(doesSegmentHitCircle({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 5 }, 4), false);
  assert.equal(doesSegmentHitCircle({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 5 }, 5), true);
});

test('doesSegmentHitCircle clamps a negative radius to zero', () => {
  assert.equal(doesSegmentHitCircle({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 3 }, -4), false);
  assert.equal(doesSegmentHitCircle({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 0 }, -4), true);
});

test('doesSegmentHitPolygon rejects a polygon with fewer than two points', () => {
  assert.equal(doesSegmentHitPolygon({ x: 0, y: 0 }, { x: 1, y: 0 }, [{ x: 0, y: 0 }]), false);
  assert.equal(doesSegmentHitPolygon({ x: 0, y: 0 }, { x: 1, y: 0 }, null), false);
});

test('doesSegmentHitPolygon detects a segment whose endpoints are inside', () => {
  const square = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];
  assert.equal(doesSegmentHitPolygon({ x: 5, y: 5 }, { x: 5, y: 6 }, square), true);
});

test('doesSegmentHitPolygon detects a segment that crosses an edge', () => {
  const square = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];
  assert.equal(doesSegmentHitPolygon({ x: -5, y: 5 }, { x: 5, y: 5 }, square), true);
});

test('doesSegmentHitPolygon rejects a segment completely outside', () => {
  const square = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];
  assert.equal(doesSegmentHitPolygon({ x: 20, y: 20 }, { x: 30, y: 30 }, square), false);
});

test('doesSegmentHitPolygon honours the tolerance ring around the outline', () => {
  const square = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];
  assert.equal(doesSegmentHitPolygon({ x: 11, y: 5 }, { x: 15, y: 5 }, square), false);
  assert.equal(doesSegmentHitPolygon({ x: 11, y: 5 }, { x: 15, y: 5 }, square, 2), true);
});

test('snapWhiteboardPointToAngle collapses a point exactly at EPSILON onto the origin', () => {
  assert.deepEqual(snapWhiteboardPointToAngle({ x: 0, y: 0 }, { x: 0.000001, y: 0 }), { x: 0, y: 0 });
});
