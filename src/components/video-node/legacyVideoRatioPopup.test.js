import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getLegacyVideoRatioWrap,
  restoreLegacyVideoRatioPopupAfterSync,
  syncLegacyVideoRatioFooter,
} from './legacyVideoRatioPopup.js';

function createElement({ closest = null } = {}) {
  const classes = new Set();
  return {
    textContent: '',
    innerHTML: '',
    classes,
    closest() {
      return closest;
    },
    classList: {
      add(name) {
        classes.add(name);
      },
    },
  };
}

test('legacyVideoRatioPopup: restores the popup immediately and on the next frame', () => {
  const popup = createElement();
  const wrap = { querySelector: (selector) => (selector === '.img-ratio-popup' ? popup : null) };
  const footer = {
    querySelector: (selector) =>
      selector === '.img-ratio-wrap:not([data-ui-schema-composite-field])' ? wrap : null,
  };
  const originalRaf = globalThis.requestAnimationFrame;
  let queued = null;
  globalThis.requestAnimationFrame = (callback) => {
    queued = callback;
  };

  try {
    restoreLegacyVideoRatioPopupAfterSync({ footer });
    assert.equal(popup.classes.has('show'), true);
    queued();
    assert.equal(popup.classes.has('show'), true);
  } finally {
    if (originalRaf === undefined) delete globalThis.requestAnimationFrame;
    else globalThis.requestAnimationFrame = originalRaf;
  }
});

test('legacyVideoRatioPopup: uses the fallback popup when the legacy wrap is absent', () => {
  const fallback = createElement();
  const originalRaf = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = () => {};
  try {
    restoreLegacyVideoRatioPopupAfterSync({ fallbackPopup: fallback });
    assert.equal(fallback.classes.has('show'), true);
  } finally {
    if (originalRaf === undefined) delete globalThis.requestAnimationFrame;
    else globalThis.requestAnimationFrame = originalRaf;
  }
});

test('legacyVideoRatioPopup: syncs label and icon through either legacy or fallback nodes', () => {
  const label = createElement();
  const icon = createElement();
  const wrap = {
    querySelector(selector) {
      if (selector === '.img-ratio-label') return label;
      if (selector === '.img-ratio-icon-slot') return icon;
      return null;
    },
  };
  const footer = {
    querySelector: (selector) =>
      selector === '.img-ratio-wrap:not([data-ui-schema-composite-field])' ? wrap : null,
  };

  syncLegacyVideoRatioFooter({
    footer,
    labelText: '16:9',
    iconHtml: '<svg></svg>',
  });
  assert.equal(label.textContent, '16:9');
  assert.equal(icon.innerHTML, '<svg></svg>');

  const fallbackLabel = createElement();
  const fallbackIcon = createElement();
  syncLegacyVideoRatioFooter({
    fallbackLabel,
    fallbackIconSlot: fallbackIcon,
    labelText: '9:16',
    iconHtml: '<b></b>',
  });
  assert.equal(fallbackLabel.textContent, '9:16');
  assert.equal(fallbackIcon.innerHTML, '<b></b>');
  assert.equal(getLegacyVideoRatioWrap(footer), wrap);
});
