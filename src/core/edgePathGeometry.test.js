import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CONNECTION_LINE_STYLES,
  buildConnectionPathGeometry,
  normalizeConnectionLineStyle,
  resolveConnectionEndpoints,
} from './edgePathGeometry.js';

test('edgePathGeometry: normalizes styles and resolves endpoint anchors', () => {
  assert.equal(normalizeConnectionLineStyle('orthogonal'), CONNECTION_LINE_STYLES.ORTHOGONAL);
  assert.equal(normalizeConnectionLineStyle('straight'), CONNECTION_LINE_STYLES.STRAIGHT);
  assert.equal(normalizeConnectionLineStyle('unknown'), CONNECTION_LINE_STYLES.CURVE);

  assert.deepEqual(
    resolveConnectionEndpoints({
      sourceX: 100,
      sourceY: 100,
      sourceWidth: 40,
      sourceHeight: 20,
      targetX: 50,
      targetY: 200,
      targetHeight: 40,
    }),
    {
      startX: 140,
      startY: 110,
      startSide: 'right',
      endX: 50,
      endY: 220,
      endSide: 'left',
      orthogonalRouteY: 160,
    },
  );

  const overlapping = resolveConnectionEndpoints({
    sourceX: 0,
    sourceY: 100,
    sourceWidth: 40,
    sourceHeight: 20,
    targetX: 20,
    targetY: 110,
    targetHeight: 20,
  });
  assert.equal(overlapping.orthogonalRouteY, 190);
});

test('edgePathGeometry: builds straight, orthogonal, and curve paths', () => {
  const straight = buildConnectionPathGeometry({
    startX: 0,
    startY: 0,
    endX: 100,
    endY: 50,
    style: 'straight',
  });
  assert.equal(straight.d, 'M 0 0 L 100 50');
  assert.deepEqual(straight.hitPoints, [
    { x: 0, y: 0 },
    { x: 100, y: 50 },
  ]);

  const orthogonal = buildConnectionPathGeometry({
    startX: 0,
    startY: 0,
    endX: 100,
    endY: 50,
    style: 'orthogonal',
  });
  assert.equal(orthogonal.d, 'M 0 0 H 50 V 50 H 100');
  assert.equal(orthogonal.hitPoints.length, 4);

  const backward = buildConnectionPathGeometry({
    startX: 100,
    startY: 0,
    endX: 0,
    endY: 50,
    style: 'orthogonal',
    orthogonalRouteY: 25,
  });
  assert.equal(backward.d, 'M 100 0 H 160 V 25 H -60 V 50 H 0');
  assert.equal(backward.hitPoints.length, 6);

  const curve = buildConnectionPathGeometry({
    startX: 0,
    startY: 0,
    endX: 100,
    endY: 50,
    style: 'curve',
  });
  assert.deepEqual([curve.control1X, curve.control1Y, curve.control2X, curve.control2Y], [60, 0, 40, 50]);
  assert.equal(curve.hitPoints, null);
});
