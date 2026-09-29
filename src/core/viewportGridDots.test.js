import test from 'node:test';
import assert from 'node:assert/strict';

import { syncViewportGridDots } from './viewportGridDots.js';

function createElementHarness() {
  const properties = [];
  const toggles = [];
  const parentElement = {
    style: {
      setProperty(name, value) {
        properties.push([name, value]);
      },
    },
    classList: {
      toggle(name, enabled) {
        toggles.push([name, enabled]);
      },
    },
  };
  return { element: { parentElement }, parentElement, properties, toggles };
}

test('viewportGridDots: writes and caches viewport-dependent styles', () => {
  const harness = createElementHarness();

  assert.equal(syncViewportGridDots(harness.element, { x: 10, y: 20, zoom: 1 }), true);
  assert.deepEqual(harness.properties, [
    ['background-position', '10px 20px'],
    ['background-size', '22px 22px'],
  ]);
  assert.deepEqual(harness.toggles, [
    ['is-grid-dots-hidden-by-zoom', false],
    ['is-grid-dots-emphasized', false],
  ]);

  const propertyCount = harness.properties.length;
  const toggleCount = harness.toggles.length;
  assert.equal(syncViewportGridDots(harness.element, { x: 10, y: 20, zoom: 1 }), false);
  assert.equal(harness.properties.length, propertyCount);
  assert.equal(harness.toggles.length, toggleCount);

  assert.equal(syncViewportGridDots(harness.element, { x: 10, y: 20, zoom: 2 }), true);
  assert.deepEqual(harness.properties.at(-1), ['background-size', '44px 44px']);
  assert.deepEqual(harness.toggles.at(-1), ['is-grid-dots-emphasized', true]);
});

test('viewportGridDots: doubles spacing at low zoom and hides below the threshold', () => {
  const harness = createElementHarness();

  assert.equal(syncViewportGridDots(harness.element, { x: 0, y: 0, zoom: 0.2 }), true);
  assert.deepEqual(harness.properties, [
    ['background-position', '0px 0px'],
    ['background-size', '35.2px 35.2px'],
  ]);
  assert.deepEqual(harness.toggles, [
    ['is-grid-dots-hidden-by-zoom', true],
    ['is-grid-dots-emphasized', false],
  ]);

  assert.equal(syncViewportGridDots({ parentElement: {} }, { x: 0, y: 0, zoom: 1 }), false);
});
