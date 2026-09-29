import test from 'node:test';
import assert from 'node:assert/strict';

import { syncPersonReplacementAssetSelection } from './personReplacementAssetSelectionRendering.js';

function element(tagName, { attributes = [], children = [], selectors = [] } = {}) {
  const node = {
    nodeType: 1,
    tagName: tagName.toUpperCase(),
    dataset: {},
    attributes: attributes.map(({ name, value }) => ({ name, value: String(value) })),
    childNodes: [],
    parentNode: null,
    id: '',
    get firstChild() {
      return this.childNodes[0] || null;
    },
    get nextSibling() {
      if (!this.parentNode) return null;
      return this.parentNode.childNodes[this.parentNode.childNodes.indexOf(this) + 1] || null;
    },
    getAttribute(name) {
      return this.attributes.find((attribute) => attribute.name === name)?.value ?? null;
    },
    setAttribute(name, value) {
      const attribute = this.attributes.find((item) => item.name === name);
      if (attribute) attribute.value = String(value);
      else this.attributes.push({ name, value: String(value) });
    },
    removeAttribute(name) {
      this.attributes = this.attributes.filter((attribute) => attribute.name !== name);
    },
    matches(selector) {
      return selectors.includes(selector);
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    append(...values) {
      for (const child of values) node.insertBefore(child, null);
    },
    insertBefore(child, before) {
      if (child.parentNode) child.parentNode.removeChild(child);
      const index = before ? node.childNodes.indexOf(before) : -1;
      node.childNodes.splice(index < 0 ? node.childNodes.length : index, 0, child);
      child.parentNode = node;
      return child;
    },
    removeChild(child) {
      const index = node.childNodes.indexOf(child);
      if (index >= 0) node.childNodes.splice(index, 1);
      child.parentNode = null;
    },
    remove() {
      this.parentNode?.removeChild(this);
    },
  };
  node.append(...children);
  return node;
}

function createHarness({ currentSelectors = {}, nextSelectors = {} } = {}) {
  const ownerDocument = {
    createElement(tagName) {
      assert.equal(tagName, 'template');
      return {
        content: {
          querySelector(selector) {
            return nextSelectors[selector] || null;
          },
        },
      };
    },
  };
  return {
    ownerDocument,
    querySelector(selector) {
      return currentSelectors[selector] || null;
    },
  };
}

test('assetSelectionRendering: requires an owner document and every selected template node', () => {
  assert.equal(syncPersonReplacementAssetSelection(null, '<div></div>'), false);
  assert.equal(
    syncPersonReplacementAssetSelection(
      createHarness({ currentSelectors: { '.story-asset-grid': element('div') } }),
      '<div></div>',
    ),
    false,
  );
});

test('assetSelectionRendering: reconciles target rail assets in place', () => {
  const currentNode = element('div', {
    attributes: [{ name: 'data-state', value: 'old' }],
  });
  const nextNode = element('div', {
    attributes: [{ name: 'data-state', value: 'new' }],
  });
  const root = createHarness({
    currentSelectors: { '.person-replacement-target-assets': currentNode },
    nextSelectors: { '.person-replacement-target-assets': nextNode },
  });

  assert.equal(syncPersonReplacementAssetSelection(root, '<div></div>', { targetRail: true }), true);
  assert.equal(currentNode.getAttribute('data-state'), 'new');
});

test('assetSelectionRendering: reconciles both story asset regions by default', () => {
  const currentCallout = element('div');
  const nextCallout = element('div');
  const currentGrid = element('div');
  const nextGrid = element('div');
  const root = createHarness({
    currentSelectors: {
      '.story-assets-callout': currentCallout,
      '.story-asset-grid': currentGrid,
    },
    nextSelectors: {
      '.story-assets-callout': nextCallout,
      '.story-asset-grid': nextGrid,
    },
  });

  assert.equal(syncPersonReplacementAssetSelection(root, '<div></div>'), true);
  assert.equal(currentCallout.childNodes.length, 0);
  assert.equal(currentGrid.childNodes.length, 0);
});
