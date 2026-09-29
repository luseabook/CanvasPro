import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createCanvasEditorSurface,
  createCanvasMediaFocusSurface,
  positionCanvasEditorSurface,
  positionCanvasEditorToolbar,
  renderCanvasEditorSubmitButton,
} from './canvasEditorSurface.js';

function createDocumentLike() {
  return {
    createElement(tagName) {
      return {
        tagName,
        className: '',
        children: [],
        style: {},
        removed: false,
        appendChild(child) {
          this.children.push(child);
          return child;
        },
        append(child) {
          this.children.push(child);
        },
        remove() {
          this.removed = true;
        },
        setAttribute() {},
        removeAttribute() {},
      };
    },
  };
}

test('canvasEditorSurface: creates the overlay, container, and stage', () => {
  const surface = createCanvasEditorSurface(createDocumentLike());

  assert.equal(surface.overlay.className, 'v2-annotate-overlay');
  assert.equal(surface.container.className, 'v2-annotate-container');
  assert.equal(surface.stage.className, 'v2-annotate-stage');
  assert.deepEqual(surface.container.children, [surface.stage]);
});

test('canvasEditorSurface: updates and releases the media focus surface', () => {
  const attributes = new Map();
  const targetAttributes = new Map();
  const root = {
    setAttribute(name, value) {
      attributes.set(name, value);
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
  };
  const target = {
    setAttribute(name, value) {
      targetAttributes.set(name, value);
    },
    removeAttribute(name) {
      targetAttributes.delete(name);
    },
  };
  const focus = createCanvasMediaFocusSurface({
    root,
    target,
    documentObject: createDocumentLike(),
  });

  assert.equal(attributes.has('data-canvas-media-focus'), true);
  assert.equal(targetAttributes.has('data-canvas-media-focus-target'), true);
  assert.deepEqual(focus.overlay.children[0].className, 'canvas-media-focus-dim');

  focus.update({ x: 10, y: 20, width: 30, height: 40 });
  assert.deepEqual(focus.overlay.children[0].style, {
    left: '10px',
    top: '20px',
    width: '30px',
    height: '40px',
  });

  focus.release();
  assert.equal(attributes.has('data-canvas-media-focus'), false);
  assert.equal(targetAttributes.has('data-canvas-media-focus-target'), false);
  assert.equal(focus.overlay.removed, true);
});

test('canvasEditorSurface: positions the editor using canvas transforms', () => {
  const editor = { style: {} };
  const result = positionCanvasEditorSurface(
    editor,
    { x: 10, y: 20, width: 100, height: 50 },
    { x: 5, y: 7, zoom: 1.5 },
  );

  assert.deepEqual(result, { x: 20, y: 37, width: 150, height: 75 });
  assert.equal(editor.style.left, '20px');
  assert.equal(editor.style.top, '37px');
  assert.equal(editor.style.width, '150px');
  assert.equal(editor.style.height, '75px');
});

test('canvasEditorSurface: escapes the submit button label', () => {
  const html = renderCanvasEditorSubmitButton('Say "hi" & more');

  assert.match(html, /title="Say &quot;hi&quot; &amp; more"/);
  assert.match(html, /aria-label="Say &quot;hi&quot; &amp; more"/);
  assert.match(html, /<svg/);
});

test('canvasEditorSurface: clamps the toolbar inside the window', () => {
  const toolbar = {
    style: {},
    offsetHeight: 40,
    getBoundingClientRect() {
      return { width: 100 };
    },
  };
  const viewport = { innerWidth: 300, innerHeight: 200 };

  positionCanvasEditorToolbar(toolbar, { center: 10, top: 190 }, viewport);

  assert.equal(toolbar.style.left, '62px');
  assert.equal(toolbar.style.top, '148px');
  assert.equal(toolbar.style.bottom, 'auto');
  assert.equal(toolbar.style.transform, 'translateX(-50%)');
});
