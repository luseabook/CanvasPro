import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcilePersonReplacementStableDom } from './personReplacementStableDom.js';

function element(
  tag,
  { dataset = {}, className = '', matchesSelectors = [], querySelectorResult = () => null } = {},
) {
  return {
    nodeType: 1,
    tagName: tag,
    dataset,
    id: '',
    childNodes: [],
    parentNode: null,
    get firstChild() {
      return this.childNodes[0] || null;
    },
    get nextSibling() {
      const parent = this.parentNode;
      if (!parent) return null;
      const index = parent.childNodes.indexOf(this);
      return index >= 0 ? parent.childNodes[index + 1] || null : null;
    },
    matches(selector) {
      return matchesSelectors.includes(selector);
    },
    querySelector(selector) {
      return querySelectorResult(selector);
    },
    getAttribute(name) {
      return name === 'class' ? className : null;
    },
    insertBefore(child, reference) {
      if (child.parentNode) {
        const at = child.parentNode.childNodes.indexOf(child);
        if (at >= 0) child.parentNode.childNodes.splice(at, 1);
      }
      const index = reference ? this.childNodes.indexOf(reference) : -1;
      this.childNodes.splice(index < 0 ? this.childNodes.length : index, 0, child);
      child.parentNode = this;
      return child;
    },
    remove() {
      const parent = this.parentNode;
      if (!parent) return;
      const at = parent.childNodes.indexOf(this);
      if (at >= 0) parent.childNodes.splice(at, 1);
      this.parentNode = null;
    },
  };
}

function text(value) {
  return {
    nodeType: 3,
    nodeValue: value,
    parentNode: null,
    remove() {
      const parent = this.parentNode;
      if (!parent) return;
      const at = parent.childNodes.indexOf(this);
      if (at >= 0) parent.childNodes.splice(at, 1);
      this.parentNode = null;
    },
  };
}

function append(parent, ...children) {
  children.forEach((child) => parent.insertBefore(child, null));
  return parent;
}

function makeHandlers() {
  const attributes = [];
  const images = [];
  return {
    attributes,
    images,
    syncAttributes: (current, next) => attributes.push([current, next]),
    syncImage: (current, next) => images.push([current, next]),
  };
}

test('rewrites a changed text node in place', () => {
  const original = text('old');
  const current = append(element('DIV'), original);
  const next = append(element('DIV'), text('new'));
  const handlers = makeHandlers();

  assert.equal(reconcilePersonReplacementStableDom(current, next, handlers), true);
  assert.equal(current.childNodes.length, 1);
  assert.equal(current.childNodes[0], original);
  assert.equal(original.nodeValue, 'new');
  assert.deepEqual(handlers.attributes, [[current, next]]);
});

test('matches children by slot key and reorders them without recreating nodes', () => {
  const nodeA = element('DIV', { dataset: { slot: 'a' } });
  const nodeB = element('DIV', { dataset: { slot: 'b' } });
  const current = append(element('SECTION'), nodeA, nodeB);
  const next = append(
    element('SECTION'),
    element('DIV', { dataset: { slot: 'b' } }),
    element('DIV', { dataset: { slot: 'a' } }),
  );

  reconcilePersonReplacementStableDom(current, next, makeHandlers());

  assert.deepEqual(current.childNodes, [nodeB, nodeA]);
  assert.equal(nodeA.parentNode, current);
  assert.equal(nodeB.nextSibling, nodeA);
});

test('drops stale children and inserts the new ones before the cursor', () => {
  const kept = element('DIV', { dataset: { slot: 'a' } });
  const stale = element('DIV', { dataset: { slot: 'x' } });
  const current = append(element('SECTION'), kept, stale);
  const fresh = element('DIV', { dataset: { slot: 'y' } });
  const next = append(element('SECTION'), element('DIV', { dataset: { slot: 'a' } }), fresh);

  reconcilePersonReplacementStableDom(current, next, makeHandlers());

  assert.equal(current.childNodes.length, 2);
  assert.equal(current.childNodes[0], kept);
  assert.equal(current.childNodes[1], fresh);
  assert.equal(stale.parentNode, null);
  assert.equal(fresh.parentNode, current);
});

test('delegates images to syncImage without walking into them', () => {
  const nested = element('SPAN');
  const current = append(element('IMG', { dataset: { slot: 'cover' } }), nested);
  const next = append(element('IMG', { dataset: { slot: 'cover' } }), element('SPAN'));
  const handlers = makeHandlers();

  reconcilePersonReplacementStableDom(current, next, handlers);

  assert.equal(handlers.images.length, 1);
  assert.deepEqual(handlers.images[0], [current, next]);
  assert.equal(handlers.attributes.length, 0);
  assert.equal(current.childNodes[0], nested);
});

test('skips subtrees preserved by selector on both sides', () => {
  const keptOld = element('DIV', { dataset: { slot: 'k' }, matchesSelectors: ['.keep'] });
  const keptNew = element('DIV', { dataset: { slot: 'k' }, matchesSelectors: ['.keep'] });
  const current = append(element('SECTION'), keptOld);
  const next = append(element('SECTION'), keptNew);
  const handlers = makeHandlers();

  reconcilePersonReplacementStableDom(current, next, { ...handlers, preserveSelector: '.keep' });

  assert.deepEqual(handlers.attributes, [[current, next]]);
  assert.equal(current.childNodes[0], keptOld);
});

test('keys story asset shells by their nested asset id', () => {
  const cardA = element('DIV', { dataset: { storyAssetId: 's1' } });
  const shellA = element('DIV', {
    matchesSelectors: ['.story-asset-card-shell'],
    querySelectorResult: (selector) => (selector === ':scope > [data-story-asset-id]' ? cardA : null),
  });
  const current = append(element('SECTION'), shellA);
  const next = append(
    element('SECTION'),
    element('DIV', {
      matchesSelectors: ['.story-asset-card-shell'],
      querySelectorResult: (selector) =>
        selector === ':scope > [data-story-asset-id]'
          ? element('DIV', { dataset: { storyAssetId: 's1' } })
          : null,
    }),
  );

  reconcilePersonReplacementStableDom(current, next, makeHandlers());

  assert.equal(current.childNodes.length, 1);
  assert.equal(current.childNodes[0], shellA);
});

test('keys action and class fallbacks deterministically', () => {
  const actionOld = element('BUTTON', { dataset: { personReplacementAction: 'remove', characterId: 'c1' } });
  const classOld = element('SPAN', { className: 'is-active tile' });
  const current = append(element('SECTION'), actionOld, classOld);
  const next = append(
    element('SECTION'),
    element('BUTTON', { dataset: { personReplacementAction: 'remove', characterId: 'c1' } }),
    element('SPAN', { className: 'is-active tile' }),
  );

  reconcilePersonReplacementStableDom(current, next, makeHandlers());

  assert.deepEqual(current.childNodes, [actionOld, classOld]);
});

test('treats opposite shell ids as different nodes', () => {
  const shellOld = element('DIV', {
    matchesSelectors: ['.story-asset-card-shell'],
    querySelectorResult: () => element('DIV', { dataset: { storyAssetId: 's1' } }),
  });
  const current = append(element('SECTION'), shellOld);
  const fresh = element('DIV', {
    matchesSelectors: ['.story-asset-card-shell'],
    querySelectorResult: () => element('DIV', { dataset: { storyAssetId: 's2' } }),
  });
  const next = append(element('SECTION'), fresh);

  reconcilePersonReplacementStableDom(current, next, makeHandlers());

  assert.equal(current.childNodes.length, 1);
  assert.equal(current.childNodes[0], fresh);
  assert.equal(shellOld.parentNode, null);
});
