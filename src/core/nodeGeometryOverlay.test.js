import test from 'node:test';
import assert from 'node:assert/strict';

import { createNodeGeometryOverlay } from './nodeGeometryOverlay.js';

test('nodeGeometryOverlay: merges only valid overrides without mutating the source', () => {
  const base = {
    first: { x: 1, y: 2, width: 30, height: 40, label: 'first' },
    second: { x: 3, y: 4, width: 50, height: 60, label: 'second' },
  };

  const overlay = createNodeGeometryOverlay(base, {
    first: { x: 5, y: 6, width: 70, height: 80, ignored: true },
    missing: { x: 9, y: 9 },
    invalid: { width: 'bad', height: 10 },
  });

  assert.notEqual(overlay, base);
  assert.deepEqual(overlay.first, {
    x: 5,
    y: 6,
    width: 70,
    height: 80,
    label: 'first',
  });
  assert.equal(overlay.second, base.second);
  assert.equal(Object.hasOwn(overlay, 'second'), false);
  assert.deepEqual(base.first, { x: 1, y: 2, width: 30, height: 40, label: 'first' });
});

test('nodeGeometryOverlay: returns the original object when no override is applicable', () => {
  const base = { first: { x: 1, y: 2, width: 30, height: 40 } };
  assert.equal(createNodeGeometryOverlay(base, { first: { width: 100 } }), base);
  assert.equal(createNodeGeometryOverlay(base, null), base);
  assert.deepEqual(createNodeGeometryOverlay(null, {}), {});
});
