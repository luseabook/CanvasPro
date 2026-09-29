import test from 'node:test';
import assert from 'node:assert/strict';

import {
  reconcileElementTree,
  reconcilePersonReplacementReferenceInputs,
  reconcilePersonReplacementShotCardList,
  reconcilePersonReplacementShotTimelineCard,
  reconcilePersonReplacementVideoShotSelection,
} from './personReplacementShotSelectionRendering.js';

function text(value) {
  return {
    nodeType: 3,
    nodeValue: String(value),
    parentNode: null,
    remove() {
      if (!this.parentNode) return;
      const index = this.parentNode.childNodes.indexOf(this);
      if (index >= 0) this.parentNode.childNodes.splice(index, 1);
      this.parentNode = null;
    },
  };
}

function element(tagName, { dataset = {}, attributes = {}, children = [], selectors = [] } = {}) {
  const node = {
    nodeType: 1,
    tagName: tagName.toUpperCase(),
    dataset,
    attributes: new Map(Object.entries(attributes)),
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
      return this.attributes.get(name) ?? null;
    },
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
    },
    removeAttribute(name) {
      this.attributes.delete(name);
    },
    getAttributeNames() {
      return [...this.attributes.keys()];
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
    replaceChildren(...values) {
      for (const child of node.childNodes) child.parentNode = null;
      node.childNodes = [];
      node.append(...values);
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
    replaceWith(replacement) {
      if (!this.parentNode) {
        replacement.parentNode = null;
        return;
      }
      const parent = this.parentNode;
      const index = parent.childNodes.indexOf(this);
      parent.childNodes[index] = replacement;
      replacement.parentNode = parent;
      this.parentNode = null;
    },
  };
  Object.defineProperties(node, {
    children: {
      get: () => node.childNodes.filter((child) => child.nodeType === 1),
    },
  });
  node.append(...children);
  return node;
}

function append(parent, ...children) {
  parent.append(...children);
  return parent;
}

test('reconcileElementTree: updates equivalent text nodes in place and replaces mismatched trees', () => {
  const originalText = text('old');
  const current = append(element('div'), originalText);
  const next = append(element('div'), text('new'));

  assert.equal(reconcileElementTree(current, next), true);
  assert.equal(current.childNodes[0], originalText);
  assert.equal(originalText.nodeValue, 'new');

  const replacement = append(element('section'), element('span'), element('span'));
  const replacementChildren = [...replacement.childNodes];
  assert.equal(reconcileElementTree(current, replacement), true);
  assert.deepEqual(current.childNodes, replacementChildren);
  assert.equal(current.childNodes[0].parentNode, current);
});

test('reconcilePersonReplacementShotCardList: requires both lists and reconciles matching shot cards', () => {
  assert.equal(reconcilePersonReplacementShotCardList({}), false);
  const existing = element('div', {
    dataset: { personReplacementShotCard: 'true', shotId: 's1' },
  });
  existing.append(text('old'));
  const current = append(element('div'), existing);
  const nextCard = element('div', {
    dataset: { personReplacementShotCard: 'true', shotId: 's1' },
  });
  nextCard.append(text('new'));
  const next = append(element('div'), nextCard);

  assert.equal(reconcilePersonReplacementShotCardList({ currentList: current, nextList: next }), true);
  assert.equal(existing.childNodes[0].nodeValue, 'new');
});

test('reconcilePersonReplacementShotTimelineCard: returns false when either card is absent', () => {
  assert.equal(reconcilePersonReplacementShotTimelineCard({ shotId: 's1' }), false);
  const current = element('div');
  const next = element('div');
  current.querySelectorAll = () => [];
  next.querySelectorAll = () => [];
  assert.equal(
    reconcilePersonReplacementShotTimelineCard({
      currentScroller: current,
      nextScroller: next,
      shotId: 's1',
    }),
    false,
  );
});

test('reconcilePersonReplacementReferenceInputs: preserves matching slots and swaps in the current root', () => {
  const currentSlot = element('div', { dataset: { slot: 'prompt' } });
  currentSlot.append(text('old'));
  const current = append(element('section'), currentSlot);
  const nextSlot = element('div', { dataset: { slot: 'prompt' } });
  nextSlot.append(text('new'));
  const next = append(element('section'), nextSlot);
  const query = (root) => (selector) =>
    selector === '[data-slot]' ? root.children.filter((child) => child.dataset.slot) : [];
  current.querySelectorAll = query(current);
  next.querySelectorAll = query(next);

  assert.equal(reconcilePersonReplacementReferenceInputs({ currentInputs: current, nextInputs: next }), true);
  assert.equal(currentSlot.childNodes[0].nodeValue, 'new');
  assert.equal(next.parentNode, null);
});

test('reconcilePersonReplacementVideoShotSelection: refuses incomplete page structures', () => {
  assert.equal(reconcilePersonReplacementVideoShotSelection(), false);
  const page = element('div');
  page.querySelector = () => null;
  assert.equal(reconcilePersonReplacementVideoShotSelection({ currentPage: page, nextPage: page }), false);
});
