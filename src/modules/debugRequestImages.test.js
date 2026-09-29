import test from 'node:test';
import assert from 'node:assert/strict';

import { renderDebugRequestImages } from './debugRequestImages.js';

class FakeElement {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName;
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.listeners = new Map();
    this.dataset = {};
    this.attributes = {};
    this.className = '';
    this.textContent = '';
    this.hidden = false;
  }

  append(...nodes) {
    this.children.push(...nodes);
  }

  replaceChildren(...nodes) {
    this.children = [...nodes];
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  removeAttribute(name) {
    delete this.attributes[name];
  }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }

  trigger(type) {
    for (const listener of this.listeners.get(type) || []) listener({ type });
  }

  cloneNode() {
    const clone = new FakeElement(this.tagName, this.ownerDocument);
    clone.attributes = { ...this.attributes };
    clone.dataset = { ...this.dataset };
    clone.className = this.className;
    clone.textContent = this.textContent;
    clone.src = this.src;
    clone.alt = this.alt;
    clone.loading = this.loading;
    return clone;
  }
}

class FakeDocument {
  createElement(tagName) {
    return new FakeElement(tagName, this);
  }

  createTextNode(textContent) {
    return { nodeType: 'text', textContent };
  }
}

test('debugRequestImages: renders valid images and skips overlapping or invalid entries', () => {
  const document = new FakeDocument();
  const container = document.createElement('div');
  const preview = document.createElement('div');
  const src = 'https://cdn.example/image.png';
  const content = 'A' + src + 'B';

  renderDebugRequestImages(
    container,
    content,
    [
      { src, start: 1, end: 1 + src.length, path: 'payload.image', label: '图 1' },
      { src: 'https://cdn.example/overlap.png', start: 2, end: 5, path: 'overlap', label: '重叠' },
      { src: 'https://cdn.example/out.png', start: content.length, end: content.length + 1 },
      { src: 'https://cdn.example/movie.mp4', start: 0, end: 1 },
    ],
    preview,
  );

  assert.equal(preview.hidden, true);
  assert.deepEqual(preview.children, []);
  assert.equal(container.children.length, 3);
  assert.equal(container.children[0].textContent, 'A');
  assert.equal(container.children[2].textContent, 'B');

  const row = container.children[1];
  const thumbnail = row.children[0];
  const image = thumbnail.children[0];
  const value = row.children[1];
  assert.equal(row.className, 'request-debug-image-row');
  assert.equal(thumbnail.className, 'request-debug-thumbnail');
  assert.equal(thumbnail.tabIndex, 0);
  assert.equal(thumbnail.attributes.role, 'img');
  assert.equal(thumbnail.attributes['aria-label'], '图 1 · payload.image');
  assert.equal(thumbnail.dataset.label, '图 1');
  assert.equal(thumbnail.dataset.state, 'loading');
  assert.equal(image.loading, 'lazy');
  assert.equal(image.decoding, 'async');
  assert.equal(image.referrerPolicy, 'no-referrer');
  assert.equal(image.draggable, false);
  assert.equal(image.src, src);
  assert.equal(value.className, 'request-debug-image-value');
  assert.equal(value.textContent, src);

  image.trigger('load');
  thumbnail.trigger('mouseenter');
  assert.equal(thumbnail.dataset.state, 'ready');
  assert.equal(preview.hidden, false);
  assert.equal(preview.children[0].alt, '图 1');
  assert.equal(preview.children[0].attributes.loading, undefined);

  thumbnail.trigger('mouseleave');
  assert.equal(preview.hidden, true);
  assert.deepEqual(preview.children, []);
  thumbnail.trigger('focus');
  assert.equal(preview.hidden, false);
  thumbnail.trigger('blur');
  assert.equal(preview.hidden, true);

  image.trigger('error');
  assert.equal(thumbnail.dataset.state, 'error');
  assert.match(thumbnail.attributes['aria-label'], /图片加载失败/u);
});

