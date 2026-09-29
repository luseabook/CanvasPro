import test from 'node:test';
import assert from 'node:assert/strict';

import { Vector4 } from '../../../three.module.js';
import { calcBasisFunctions, calcBSplinePoint, findSpan } from './NURBSUtils.js';

test('NURBSUtils: finds spans and normalized basis functions', () => {
  const knots = [0, 0, 0, 1, 1, 1];
  const basis = calcBasisFunctions(2, 0.5, 2, knots);

  assert.equal(findSpan(2, 0.5, knots), 2);
  assert.deepEqual(basis, [0.25, 0.5, 0.25]);
  assert.equal(
    basis.reduce((sum, value) => sum + value, 0),
    1,
  );
});

test('NURBSUtils: evaluates a rational B-spline point', () => {
  const point = calcBSplinePoint(1, [0, 0, 1, 1], [new Vector4(0, 0, 0, 1), new Vector4(2, 4, 6, 1)], 0.5);

  assert.deepEqual([point.x, point.y, point.z, point.w], [1, 2, 3, 1]);
});
