import test from 'node:test';
import assert from 'node:assert/strict';

import { projectPointToViewportEdge, spreadViewportBoundaryPoint } from './viewportBoundaryMath.js';

test('viewportBoundaryMath: projects points onto the padded viewport edge', () => {
  const viewport = { left: 0, top: 0, width: 200, height: 100 };

  assert.deepEqual(projectPointToViewportEdge({ x: 100, y: 50 }, viewport, 20), {
    x: 100,
    y: 50,
    outside: false,
    angle: 0,
  });
  assert.deepEqual(projectPointToViewportEdge({ x: 0, y: 50 }, viewport, 20), {
    x: 20,
    y: 50,
    outside: false,
    angle: 180,
  });
  assert.deepEqual(projectPointToViewportEdge({ x: -1, y: 50 }, viewport, 20), {
    x: 20,
    y: 50,
    outside: true,
    angle: 180,
  });
  assert.deepEqual(projectPointToViewportEdge({ x: 300, y: 50 }, viewport, 20), {
    x: 180,
    y: 50,
    outside: true,
    angle: 0,
  });
});

test('viewportBoundaryMath: spreads overlapping boundary points without leaving the viewport', () => {
  const viewport = { left: 0, top: 0, width: 400, height: 300 };
  const base = { x: 10, y: 50 };
  const occupied = [];
  const first = spreadViewportBoundaryPoint(base, viewport, occupied);
  const second = spreadViewportBoundaryPoint(base, viewport, occupied);

  assert.ok(first.x >= viewport.left && first.x <= viewport.left + viewport.width);
  assert.ok(first.y >= viewport.top && first.y <= viewport.top + viewport.height);
  assert.ok(second.x >= viewport.left && second.x <= viewport.left + viewport.width);
  assert.ok(second.y >= viewport.top && second.y <= viewport.top + viewport.height);
  assert.notDeepEqual(first, second);
  assert.equal(occupied.length, 2);
});
