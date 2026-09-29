import test from 'node:test';
import assert from 'node:assert/strict';

import { OBJLoader } from './OBJLoader.js';

test('OBJLoader: parses a triangle into a named mesh', () => {
  const group = new OBJLoader().parse(['o Triangle', 'v 0 0 0', 'v 1 0 0', 'v 0 1 0', 'f 1 2 3'].join('\n'));

  assert.equal(group.children.length, 1);
  assert.equal(group.children[0].name, 'Triangle');
  assert.equal(group.children[0].geometry.getAttribute('position').count, 3);
  assert.deepEqual(
    Array.from(group.children[0].geometry.getAttribute('position').array),
    [0, 0, 0, 1, 0, 0, 0, 1, 0],
  );
});
