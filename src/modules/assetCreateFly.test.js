import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playAssetCreateFly } from './assetCreateFly.js';

function box(left, top, width, height) {
  return { left, top, width, height };
}

function makeElement({ rect: bounds = null, withAnimate = true, id } = {}) {
  const element = {
    id,
    style: {},
    animateCalls: [],
    appendedChildren: [],
    removed: false,
    removedAttributes: [],
    cloneDeep: undefined,
    getBoundingClientRect() {
      return bounds;
    },
    cloneNode(deep) {
      const clone = makeElement({ rect: bounds });
      clone.cloneDeep = deep;
      clone.id = 'clone-id';
      return clone;
    },
    appendChild(node) {
      this.appendedChildren.push(node);
      return node;
    },
    remove() {
      this.removed = true;
    },
    removeAttribute(name) {
      this.removedAttributes.push(name);
      if (name === 'id') this.id = undefined;
    },
    animate(frames, options) {
      const handle = { frames, options };
      this.animateCalls.push(handle);
      return handle;
    },
  };
  if (!withAnimate) delete element.animate;
  return element;
}

function makeDocument() {
  const created = [];
  const body = {
    children: [],
    appendChild(node) {
      this.children.push(node);
    },
  };
  return {
    created,
    body,
    createElement(tag) {
      const element = makeElement();
      element.tag = tag;
      created.push(element);
      return element;
    },
  };
}

function stillWindow() {
  return { matchMedia: () => ({ matches: false }) };
}

test('returns null when the user prefers reduced motion', () => {
  const documentObject = makeDocument();
  const result = playAssetCreateFly({
    fromElement: makeElement({ rect: box(0, 0, 10, 10) }),
    toElement: makeElement({ rect: box(1, 1, 1, 1) }),
    documentObject,
    windowObject: { matchMedia: () => ({ matches: true }) },
  });
  assert.equal(result, null);
  assert.equal(documentObject.created.length, 0);
});

test('returns null without a document body or a target element', () => {
  const fromElement = makeElement({ rect: box(0, 0, 10, 10) });
  const toElement = makeElement({ rect: box(1, 1, 1, 1) });
  assert.equal(
    playAssetCreateFly({ fromElement, toElement, documentObject: {}, windowObject: stillWindow() }),
    null,
  );
  assert.equal(
    playAssetCreateFly({
      fromElement,
      toElement: null,
      documentObject: makeDocument(),
      windowObject: stillWindow(),
    }),
    null,
  );
  assert.equal(
    playAssetCreateFly({
      fromRect: box(0, 0, 5, 5),
      toElement,
      documentObject: makeDocument(),
      windowObject: stillWindow(),
    }),
    null,
  );
});

test('returns null when the source has no measurable rectangle', () => {
  for (const fromRect of [null, box(0, 0, 0, 10), box(0, 0, 10, 0)]) {
    const documentObject = makeDocument();
    const result = playAssetCreateFly({
      fromElement: null,
      fromRect,
      toElement: makeElement({ rect: box(1, 1, 1, 1) }),
      documentObject,
      windowObject: stillWindow(),
    });
    assert.equal(result, null);
    assert.equal(documentObject.created.length, 0);
  }
});

test('falls back to the source element rectangle when none is given', () => {
  const documentObject = makeDocument();
  const fromElement = makeElement({ rect: box(4, 8, 20, 10) });
  const result = playAssetCreateFly({
    fromElement,
    toElement: makeElement({ rect: box(0, 0, 0, 0) }),
    documentObject,
    windowObject: stillWindow(),
  });
  assert.equal(result, documentObject.created[0]);
  assert.equal(result.style.left, '4px');
  assert.equal(result.style.top, '8px');
});

test('returns null when the target rectangle cannot be measured', () => {
  const documentObject = makeDocument();
  const result = playAssetCreateFly({
    fromElement: makeElement({ rect: box(0, 0, 10, 10) }),
    toElement: makeElement({ withAnimate: true }),
    documentObject,
    windowObject: stillWindow(),
  });
  assert.equal(result, null);
});

test('positions the fly layer over the source rectangle', () => {
  const documentObject = makeDocument();
  const result = playAssetCreateFly({
    fromElement: makeElement({ rect: box(10, 20, 100, 40) }),
    toElement: makeElement({ rect: box(500, 300, 20, 20) }),
    documentObject,
    windowObject: stillWindow(),
  });
  assert.equal(result.tag, 'div');
  assert.equal(result.className, 'v2-asset-create-fly');
  assert.equal(result.style.left, '10px');
  assert.equal(result.style.top, '20px');
  assert.equal(result.style.width, '100px');
  assert.equal(result.style.height, '40px');
  assert.equal(result.appendedChildren.length, 1);
  assert.deepEqual(documentObject.body.children, [result]);
});

test('clones the source content deeply and strips its id', () => {
  const documentObject = makeDocument();
  const fromElement = makeElement({ rect: box(0, 0, 10, 10), id: 'source-node' });
  const result = playAssetCreateFly({
    fromElement,
    toElement: makeElement({ rect: box(10, 0, 10, 10) }),
    documentObject,
    windowObject: stillWindow(),
  });
  const clone = result.appendedChildren[0];
  assert.equal(clone.cloneDeep, true);
  assert.equal(clone.id, undefined);
  assert.deepEqual(clone.removedAttributes, ['id']);
});

test('clones an explicit content element instead of the source element', () => {
  const documentObject = makeDocument();
  const contentElement = makeElement({ rect: box(0, 0, 1, 1) });
  const result = playAssetCreateFly({
    fromElement: makeElement({ rect: box(0, 0, 10, 10) }),
    contentElement,
    toElement: makeElement({ rect: box(10, 0, 10, 10) }),
    documentObject,
    windowObject: stillWindow(),
  });
  const clone = result.appendedChildren[0];
  assert.deepEqual(clone.removedAttributes, ['id']);
  assert.equal(clone.id, undefined);
});

test('animates toward the center of the target with the fixed duration', () => {
  const documentObject = makeDocument();
  const fromElement = makeElement({ rect: box(10, 20, 100, 40) });
  const toElement = makeElement({ rect: box(500, 300, 20, 20) });
  const result = playAssetCreateFly({
    fromElement,
    toElement,
    documentObject,
    windowObject: stillWindow(),
  });
  assert.equal(result.animateCalls.length, 1);
  const call = result.animateCalls[0];
  assert.deepEqual(call.frames[0], { transform: 'translate(0,0) scale(1)', opacity: 1 });
  assert.deepEqual(call.frames[1], { transform: 'translate(450px,270px) scale(0.12)', opacity: 0.2 });
  assert.deepEqual(call.options, { duration: 520, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
});

test('drops the fly layer and pulses the target when the flight finishes', () => {
  const documentObject = makeDocument();
  const toElement = makeElement({ rect: box(500, 300, 20, 20) });
  const result = playAssetCreateFly({
    fromElement: makeElement({ rect: box(10, 20, 100, 40) }),
    toElement,
    documentObject,
    windowObject: stillWindow(),
  });
  assert.equal(toElement.animateCalls.length, 0);
  result.animateCalls[0].onfinish();
  assert.equal(result.removed, true);
  assert.equal(toElement.animateCalls.length, 1);
  const pulse = toElement.animateCalls[0];
  assert.deepEqual(pulse.frames, [
    { transform: 'scale(1)', filter: 'brightness(1)' },
    { transform: 'scale(1.08)', filter: 'brightness(1.2)' },
    { transform: 'scale(1)', filter: 'brightness(1)' },
  ]);
  assert.deepEqual(pulse.options, { duration: 260, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
});

test('skips the target pulse when the target cannot animate', () => {
  const documentObject = makeDocument();
  const toElement = makeElement({ rect: box(500, 300, 20, 20), withAnimate: false });
  const result = playAssetCreateFly({
    fromElement: makeElement({ rect: box(10, 20, 100, 40) }),
    toElement,
    documentObject,
    windowObject: stillWindow(),
  });
  result.animateCalls[0].onfinish();
  assert.equal(result.removed, true);
  assert.deepEqual(toElement.animateCalls, []);
});

test('removes the fly layer and gives up when the layer cannot animate', () => {
  const created = [];
  const body = {
    children: [],
    appendChild(node) {
      this.children.push(node);
    },
  };
  const documentObject = {
    body,
    createElement() {
      const element = makeElement({ withAnimate: false });
      created.push(element);
      return element;
    },
  };
  const toElement = makeElement({ rect: box(500, 300, 20, 20) });
  const result = playAssetCreateFly({
    fromElement: makeElement({ rect: box(10, 20, 100, 40) }),
    toElement,
    documentObject,
    windowObject: stillWindow(),
  });
  assert.equal(result, null);
  assert.equal(created.length, 1);
  assert.equal(created[0].removed, true);
  assert.equal(toElement.animateCalls.length, 0);
});
