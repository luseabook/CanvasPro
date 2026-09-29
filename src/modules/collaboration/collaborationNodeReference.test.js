import test from 'node:test';
import assert from 'node:assert/strict';

import {
  nodeReferencePresentation,
  updateNodeReference,
} from './collaborationNodeReference.js';

class FakeElement {
  constructor(tagName = '') {
    this.tagName = tagName;
    this.children = [];
    this.attributes = new Map();
    this.dataset = {};
    this.className = '';
    this.textContent = '';
    this.listeners = new Map();
    this.replacementCount = 0;
    this.classes = new Set();
  }

  get classList() {
    const classes = this.classes;
    return {
      add(...names) {
        names.forEach((name) => classes.add(name));
      },
      toggle(name, force) {
        if (force === undefined ? !classes.has(name) : force) classes.add(name);
        else classes.delete(name);
      },
      contains(name) {
        return classes.has(name);
      },
    };
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  append(...nodes) {
    this.children.push(...nodes);
  }

  appendChild(node) {
    this.children.push(node);
    return node;
  }

  replaceChildren(...nodes) {
    this.children = [...nodes];
    this.replacementCount += 1;
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  remove() {
    this.removed = true;
  }
}

function installFakeDocument() {
  const previous = globalThis.document;
  globalThis.document = {
    createElement(tagName) {
      return new FakeElement(tagName);
    },
    createElementNS(namespace, tagName) {
      return new FakeElement(tagName);
    },
    createTextNode(text) {
      const node = new FakeElement('#text');
      node.textContent = text;
      return node;
    },
  };
  return () => {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  };
}

test('collaborationNodeReference: presentation maps media nodes to names, kinds, and preview urls', () => {
  assert.deepEqual(nodeReferencePresentation(null, '参考'), {
    name: '参考',
    kind: 'action',
    label: '节点已删除',
    url: '',
  });
  assert.deepEqual(
    nodeReferencePresentation({
      type: 'source-image',
      name: '主图',
      images: [{ imageUrl: 'data/assets/main.png' }],
      mainImageIndex: 0,
    }),
    {
      name: '主图',
      kind: 'image',
      label: '图片节点',
      url: '/data/assets/main.png',
    },
  );
  assert.equal(
    nodeReferencePresentation({
      type: 'source-video',
      name: '样片',
      videos: [{ posterLocalPath: 'data/assets/poster.png' }],
      mainVideoIndex: 0,
    }).url,
    '/data/assets/poster.png',
  );
  assert.equal(nodeReferencePresentation({ type: 'source-audio' }).kind, 'audio');
  assert.equal(nodeReferencePresentation({ type: 'text' }).label, '节点');
});

test('collaborationNodeReference: compact updates render remove actions and skip unchanged state', () => {
  const restore = installFakeDocument();
  try {
    const root = new FakeElement('span');
    let removed = 0;
    const node = {
      type: 'source-image',
      name: '主图',
      images: [{ imageUrl: 'data/assets/main.png' }],
      mainImageIndex: 0,
    };

    updateNodeReference(root, node, '节点', {
      compact: true,
      onRemove() {
        removed += 1;
      },
      onOpen() {},
    });

    assert.equal(root.dataset.referenceSignature.includes('主图'), true);
    assert.equal(root.classList.contains('is-compact'), true);
    assert.equal(root.getAttribute('aria-label'), '主图，定位节点');
    assert.equal(root.children.length, 2);
    assert.equal(root.children[1].textContent, '×');
    assert.equal(root.replacementCount, 1);
    assert.equal(typeof root.children[1].listeners.get('click'), 'function');
    root.children[1].listeners.get('click')({ stopPropagation() {} });
    assert.equal(removed, 1);

    updateNodeReference(root, node, '节点', {
      compact: true,
      onRemove() {},
      onOpen() {},
    });
    assert.equal(root.replacementCount, 1);
  } finally {
    restore();
  }
});
