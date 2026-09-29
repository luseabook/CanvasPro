import test from 'node:test';
import assert from 'node:assert/strict';

import { createFocusNavigation } from './focusNavigation.js';

function createWindow() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener(type, listener) {
      if (listeners.get(type) === listener) listeners.delete(type);
    },
  };
}

function createRoot(windowObject, children = []) {
  const attributes = new Map();
  const listeners = new Map();
  const root = {
    ownerDocument: { defaultView: windowObject },
    children: new Set(children),
    setAttribute(name, value) {
      attributes.set(name, value);
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    addEventListener(type, listener, capture) {
      listeners.set(type, { listener, capture });
    },
    removeEventListener(type, listener, capture) {
      const current = listeners.get(type);
      if (current?.listener === listener && current.capture === capture) listeners.delete(type);
    },
    contains(target) {
      return target === root || root.children.has(target);
    },
    dispatch(type, event) {
      listeners.get(type)?.listener?.(event);
    },
    attributes,
    listeners,
  };
  return root;
}

test('focusNavigation: tracks keyboard and pointer input for registered roots', () => {
  const windowObject = createWindow();
  const child = {};
  const root = createRoot(windowObject, [child]);
  const navigation = createFocusNavigation();

  navigation.addRoot(root);
  assert.equal(root.attributes.get('data-focus-navigation'), 'pointer');
  assert.equal(typeof windowObject.listeners.get('keydown'), 'function');
  assert.equal(root.listeners.get('pointerdown').capture, true);

  windowObject.listeners.get('keydown')({
    key: 'Tab',
    target: child,
    isComposing: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
  });
  assert.equal(root.attributes.get('data-focus-navigation'), 'keyboard');

  root.dispatch('pointermove', { clientX: 10, clientY: 12, movementX: 1, movementY: 0 });
  assert.equal(root.attributes.get('data-focus-navigation'), 'pointer');

  navigation.removeRoot(root);
  assert.equal(root.attributes.has('data-focus-navigation'), false);
  assert.equal(root.listeners.size, 0);
  assert.equal(windowObject.listeners.has('keydown'), false);
});

test('focusNavigation: ignores modified, composing, and non-navigation keys', () => {
  const windowObject = createWindow();
  const root = createRoot(windowObject);
  const navigation = createFocusNavigation();
  navigation.addRoot(root);

  const keydown = windowObject.listeners.get('keydown');
  keydown({
    key: 'ArrowUp',
    target: root,
    isComposing: true,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
  });
  keydown({
    key: 'ArrowDown',
    target: root,
    isComposing: false,
    altKey: true,
    ctrlKey: false,
    metaKey: false,
  });
  keydown({
    key: 'Escape',
    target: root,
    isComposing: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
  });
  assert.equal(root.attributes.get('data-focus-navigation'), 'pointer');

  navigation.destroy();
  assert.equal(root.attributes.has('data-focus-navigation'), false);
});
