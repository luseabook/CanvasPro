import test from 'node:test';
import assert from 'node:assert/strict';

import { hostPromptFloatingSurfaces } from './promptExpansionFloatingSurfaces.js';

function createHarness(initialNodes = []) {
  const observers = [];

  function createElement(matchesSelector = false) {
    return {
      parentNode: null,
      matches(selector) {
        return matchesSelector === selector;
      },
      before(node) {
        node.parentNode = this.parentNode;
      },
      remove() {
        this.parentNode = null;
      },
    };
  }

  const documentLike = {
    body: { children: initialNodes },
    createComment() {
      return {
        parentNode: null,
        before(node) {
          node.parentNode = this.parentNode;
        },
        remove() {
          this.parentNode = null;
        },
      };
    },
    defaultView: {
      MutationObserver: class {
        constructor(callback) {
          this.callback = callback;
          this.disconnected = false;
          observers.push(this);
        }
        observe() {}
        disconnect() {
          this.disconnected = true;
        }
      },
    },
  };

  const host = {
    ownerDocument: documentLike,
    appendChild(node) {
      node.parentNode = host;
    },
  };
  return { host, observers, createElement, documentLike };
}

test('promptExpansionFloatingSurfaces: hosts matching body surfaces and restores them on dispose', () => {
  const surface = {
    parentNode: null,
    matches: () => true,
    before(node) {
      node.parentNode = this.parentNode;
    },
    remove() {
      this.parentNode = null;
    },
  };
  const harness = createHarness();
  harness.documentLike.body.children = [surface];
  surface.parentNode = harness.documentLike.body;

  const dispose = hostPromptFloatingSurfaces(harness.host, '.prompt-surface');
  assert.equal(surface.parentNode, harness.host);
  assert.equal(harness.observers.length, 1);

  dispose();
  assert.equal(surface.parentNode, harness.documentLike.body);
  assert.equal(harness.observers[0].disconnected, true);
});

test('promptExpansionFloatingSurfaces: reports matching external dialogs without hosting them', () => {
  const harness = createHarness();
  const external = {
    parentNode: harness.documentLike.body,
    matches: (selector) => selector === '.external-dialog',
  };
  const calls = [];

  hostPromptFloatingSurfaces(harness.host, '.prompt-surface', {
    externalDialogSelector: '.external-dialog',
    onExternalDialog: () => calls.push('opened'),
  });
  harness.observers[0].callback([
    { target: harness.documentLike.body, addedNodes: [external], removedNodes: [] },
  ]);

  assert.deepEqual(calls, ['opened']);
  assert.equal(external.parentNode, harness.documentLike.body);
});
