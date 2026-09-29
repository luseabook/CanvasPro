import test from 'node:test';
import assert from 'node:assert/strict';

import { createViewportScreenFrame } from './viewportScreenFrame.js';

test('viewportScreenFrame: stores the latest finite screen origin once', () => {
  const frame = createViewportScreenFrame();
  assert.equal(frame.set(12, 34), true);
  assert.equal(frame.set(12, 34), false);
  assert.equal(frame.set('bad', Infinity), true);

  assert.deepEqual(frame.attach({ x: 1, y: 2, zoom: 0.5 }), {
    x: 1,
    y: 2,
    zoom: 0.5,
    _screenOriginX: 0,
    _screenOriginY: 0,
  });
  assert.deepEqual(frame.attach(), {
    x: 0,
    y: 0,
    zoom: 1,
    _screenOriginX: 0,
    _screenOriginY: 0,
  });
});

test('viewportScreenFrame: strip removes only the private origin fields', () => {
  const frame = createViewportScreenFrame();
  frame.set(8, 9);
  const source = { x: 1, y: 2, zoom: 3, _screenOriginX: 99, _screenOriginY: 99, keep: true };
  const stripped = frame.strip(source);

  assert.deepEqual(stripped, { x: 1, y: 2, zoom: 3, keep: true });
  assert.equal(source._screenOriginX, 99);
  assert.equal(source._screenOriginY, 99);
});
