import test from 'node:test';
import assert from 'node:assert/strict';

import {
  renderViewport,
  syncViewportZoomCssVars,
} from './rendererViewportTransform.js';

function createElement() {
  const properties = new Map();
  const classes = new Map();
  const parent = {
    style: {
      setProperty: (name, value) => properties.set(name, value),
    },
    classList: {
      toggle: (name, active) => classes.set(name, active),
    },
  };
  return {
    element: {
      style: {
        setProperty: (name, value) => properties.set(name, value),
      },
      parentElement: parent,
    },
    properties,
    classes,
  };
}

test('rendererViewportTransform applies viewport transform and grid state', () => {
  const { element, properties, classes } = createElement();

  renderViewport(element, { x: 10, y: 20, zoom: 2 }, true);

  assert.equal(element.style.transformOrigin, '0 0');
  assert.equal(element.style.transform, 'translate3d(10px, 20px, 0) scale(2)');
  assert.equal(properties.get('background-position'), '10px 20px');
  assert.equal(classes.get('is-grid-dots-hidden-by-zoom'), false);
  assert.equal(classes.get('is-grid-dots-emphasized'), true);
});

test('rendererViewportTransform publishes zoom CSS variables with an injected document', () => {
  const originalDocument = globalThis.document;
  const properties = new Map();
  globalThis.document = {
    documentElement: {
      style: {
        setProperty: (name, value) => properties.set(name, value),
      },
    },
  };
  try {
    syncViewportZoomCssVars(2, true);
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }

  assert.equal(properties.get('--zoom-inv'), 0.5);
  assert.equal(properties.get('--zoom-inv-raw'), 0.5);
  assert.ok(Math.abs(properties.get('--node-label-comp') - Math.pow(0.5, 0.35)) < 1e-9);
});
