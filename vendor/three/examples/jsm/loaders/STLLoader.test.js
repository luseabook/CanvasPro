import test from 'node:test';
import assert from 'node:assert/strict';

import { STLLoader } from './STLLoader.js';

test('STLLoader: parses an ASCII triangle', () => {
  const geometry = new STLLoader().parse(
    [
      'solid test',
      'facet normal 0 0 1',
      'outer loop',
      'vertex 0 0 0',
      'vertex 1 0 0',
      'vertex 0 1 0',
      'endloop',
      'endfacet',
      'endsolid test',
    ].join('\n'),
  );

  assert.equal(geometry.getAttribute('position').count, 3);
  assert.equal(geometry.getAttribute('normal').count, 3);
  assert.deepEqual(geometry.userData.groupNames, ['test']);
  assert.deepEqual(Array.from(geometry.getAttribute('position').array), [0, 0, 0, 1, 0, 0, 0, 1, 0]);
});
