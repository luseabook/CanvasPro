import test from 'node:test';
import assert from 'node:assert/strict';

import {
  bindNodeToolbarFullscreenOverlay,
  closeExistingNodeToolbarFullscreen,
} from './fullscreenOverlayToggle.js';

test('closeExistingNodeToolbarFullscreen: invokes the stored close handler once', () => {
  let closed = 0;
  const overlay = { __nodeToolbarFullscreenClose: () => (closed += 1) };
  const documentLike = {
    querySelector: (selector) => (selector === '.overlay' ? overlay : null),
  };

  assert.equal(closeExistingNodeToolbarFullscreen('.overlay', documentLike), true);
  assert.equal(closed, 1);
  assert.equal(closeExistingNodeToolbarFullscreen('.missing', documentLike), false);
});

test('bindNodeToolbarFullscreenOverlay: Escape closes and removes the overlay', () => {
  const listeners = new Map();
  const documentLike = {
    addEventListener: (type, listener) => listeners.set(type, listener),
    removeEventListener: (type, listener) => {
      if (listeners.get(type) === listener) listeners.delete(type);
    },
  };
  const originalDocument = globalThis.document;
  globalThis.document = documentLike;
  let closed = 0;
  let removed = 0;
  const overlay = { remove: () => (removed += 1) };

  try {
    const close = bindNodeToolbarFullscreenOverlay(overlay, { onClose: () => (closed += 1) });
    assert.equal(typeof overlay.__nodeToolbarFullscreenClose, 'function');
    assert.equal(listeners.has('keydown'), true);

    listeners.get('keydown')({ key: 'Enter', preventDefault() {} });
    assert.equal(closed, 0);

    let prevented = false;
    close();
    listeners.get('keydown')?.({ key: 'Escape', preventDefault: () => (prevented = true) });
    assert.equal(prevented, false);
    assert.equal(closed, 1);
    assert.equal(removed, 1);
    assert.equal('__nodeToolbarFullscreenClose' in overlay, false);
    assert.equal(listeners.has('keydown'), false);
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});
