import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  applyPreviewVideoLayout,
  getPreviewLayoutTokens,
  getPreviewVideoLayoutClasses,
  renderVideoFallback,
} from './mediaClipPreviewView.js';

const originalDocument = globalThis.document;

afterEach(() => {
  if (typeof originalDocument === 'undefined') delete globalThis.document;
  else globalThis.document = originalDocument;
});

function createClassList() {
  const values = new Set();
  return {
    values,
    add(value) {
      values.add(value);
    },
    remove(value) {
      values.delete(value);
    },
    contains(value) {
      return values.has(value);
    },
  };
}

test('mediaClipPreviewView: classifies landscape, portrait, and tall portrait video', () => {
  assert.deepEqual(getPreviewLayoutTokens(), ['is-landscape', 'is-portrait', 'is-tall-portrait']);
  assert.deepEqual(getPreviewVideoLayoutClasses({ videoWidth: 1920, videoHeight: 1080 }), ['is-landscape']);
  assert.deepEqual(getPreviewVideoLayoutClasses({ videoWidth: 1080, videoHeight: 1920 }), [
    'is-portrait',
    'is-tall-portrait',
  ]);
  assert.deepEqual(getPreviewVideoLayoutClasses({ videoWidth: 900, videoHeight: 1200 }), ['is-portrait']);
  assert.deepEqual(getPreviewVideoLayoutClasses({ videoWidth: 600, videoHeight: 1000 }), [
    'is-portrait',
    'is-tall-portrait',
  ]);
});

test('mediaClipPreviewView: applies layout classes and aspect-ratio token', () => {
  const classList = createClassList();
  const styleValues = {};
  const element = {
    classList,
    style: {
      setProperty(name, value) {
        styleValues[name] = value;
      },
    },
  };
  const syncs = [];
  const context = {
    _previewLayoutTokens: getPreviewLayoutTokens,
    _previewVideoLayoutClasses: () => ['is-landscape'],
    _syncPreviewPanelLayout(panel, source) {
      syncs.push({ panel, source });
    },
  };

  applyPreviewVideoLayout(context, element, { videoWidth: 1920, videoHeight: 1080 });

  assert.equal(classList.contains('is-landscape'), true);
  assert.equal(styleValues['--media-clip-preview-aspect-ratio'], '1920 / 1080');
  assert.equal(syncs.length, 1);
});

test('mediaClipPreviewView: renders image and empty video fallbacks', () => {
  const created = [];
  globalThis.document = {
    createElement(tagName) {
      const element = {
        tagName,
        className: '',
        dataset: {},
        setAttribute() {},
      };
      created.push(element);
      return element;
    },
  };

  const imageFallback = renderVideoFallback('blob:poster');
  const emptyFallback = renderVideoFallback('');

  assert.equal(imageFallback.tagName, 'img');
  assert.equal(imageFallback.className, 'media-clip-video-fallback');
  assert.equal(imageFallback.src, 'blob:poster');
  assert.equal(imageFallback.draggable, false);
  assert.equal(emptyFallback.tagName, 'div');
  assert.equal(emptyFallback.className, 'media-clip-video-fallback is-empty');
  assert.equal(created.length, 2);
});
