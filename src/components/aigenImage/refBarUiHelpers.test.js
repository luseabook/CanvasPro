// Offline tests for the ref-bar DOM helpers. appendRefUploadLabel builds the label as
// real DOM (textContent) instead of an HTML string, so user text never needs escaping.
import test from 'node:test';
import assert from 'node:assert/strict';

import { appendRefUploadLabel, createRefUploadSlot } from './refBarUiHelpers.js';

function createNode(tagName) {
  return {
    tagName: String(tagName).toUpperCase(),
    className: '',
    dataset: {},
    attributes: {},
    children: [],
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    appendChild(node) {
      this.children.push(node);
      return node;
    },
  };
}

function withDocumentStub(t) {
  const previous = globalThis.document;
  globalThis.document = { createElement: (tagName) => createNode(tagName) };
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

test('createRefUploadSlot builds a labelled upload slot', (t) => {
  withDocumentStub(t);
  const slot = createRefUploadSlot({ refSlot: 'replaceTarget', title: '待替换', label: '待替换 <目标>' });
  assert.equal(slot.className, 'ref-thumb-wrap ref-upload-slot');
  assert.equal(slot.dataset.refSlot, 'replaceTarget');
  assert.equal(slot.dataset.slot, 'replaceTarget');
  assert.equal(slot.dataset.kind, 'image');
  assert.equal(slot.attributes.draggable, 'false');
  assert.equal(slot.attributes.title, '待替换');
  assert.equal(slot.children.length, 1);
  assert.equal(slot.children[0].className, 'ref-upload-label');
  assert.equal(slot.children[0].textContent, '待替换 <目标>');
});
