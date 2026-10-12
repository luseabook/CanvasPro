// Offline tests for the ref-bar DOM helpers. appendRefUploadLabel builds the label as
// real DOM (textContent) instead of an HTML string, so user text never needs escaping.
import test from 'node:test';
import assert from 'node:assert/strict';

import { appendRefUploadLabel } from './refBarUiHelpers.js';

function withDocumentStub(t) {
  const previous = globalThis.document;
  globalThis.document = {
    createElement: (tagName) => ({ tagName: String(tagName).toUpperCase(), className: '' }),
  };
  t.after(() => {
    if (typeof previous === 'undefined') delete globalThis.document;
    else globalThis.document = previous;
  });
}

function createTarget() {
  return {
    children: [],
    appendChild(node) {
      this.children.push(node);
      return node;
    },
  };
}

test('appendRefUploadLabel appends a label span with the raw text', (t) => {
  withDocumentStub(t);
  const target = createTarget();
  appendRefUploadLabel(target, '待替换 <目标> & 参考');
  assert.equal(target.children.length, 1);
  assert.equal(target.children[0].className, 'ref-upload-label');
  assert.equal(target.children[0].textContent, '待替换 <目标> & 参考');
});

test('appendRefUploadLabel normalizes missing labels to an empty string', (t) => {
  withDocumentStub(t);
  const target = createTarget();
  appendRefUploadLabel(target, null);
  assert.equal(target.children[0].textContent, '');
});
