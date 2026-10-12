// Offline test for the DOM-based reference attachment button (no HTML string, so the
// tooltip never needs escaping).
import test from 'node:test';
import assert from 'node:assert/strict';

import { createPromptAttachmentButtonElement } from './refAttachmentButton.js';

class FakeNode {
  constructor(tagName) {
    this.tagName = String(tagName).toUpperCase();
    this.className = '';
    this.children = [];
    this.attributes = {};
    this.classList = { add: (value) => (this.className += (this.className ? ' ' : '') + value) };
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }
  appendChild(node) {
    this.children.push(node);
    return node;
  }
}

test('createPromptAttachmentButtonElement builds the icon structure as DOM', (t) => {
  const previous = globalThis.document;
  globalThis.document = {
    createElement: (tagName) => new FakeNode(tagName),
    createElementNS: (namespace, tagName) => new FakeNode(tagName),
  };
  t.after(() => {
    if (typeof previous === 'undefined') delete globalThis.document;
    else globalThis.document = previous;
  });

  const button = createPromptAttachmentButtonElement({ tooltip: '添加 <参考> & 素材' });
  assert.equal(button.className, 'prompt-attachment-btn');
  assert.equal(button.attributes['aria-label'], '添加 <参考> & 素材');
  assert.equal(button.children.length, 1);
  const icon = button.children[0];
  assert.ok(icon.className.includes('btn-icon'));
  const svg = icon.children[0];
  assert.equal(svg.tagName, 'SVG');
  assert.deepEqual(
    svg.children.map((node) => node.tagName),
    ['PATH', 'CIRCLE', 'PATH']
  );
});
