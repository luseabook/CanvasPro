import { test } from 'node:test';
import assert from 'node:assert/strict';

import { bindWorkspaceSelects } from './workspaceSelects.js';

function createClassList() {
  const values = new Set();
  return {
    add: (...names) => names.forEach((name) => values.add(name)),
    remove: (...names) => names.forEach((name) => values.delete(name)),
    contains: (name) => values.has(name),
  };
}

function createElement(documentObject, tagName) {
  const element = {
    tagName,
    ownerDocument: documentObject,
    children: [],
    childNodes: [],
    parentElement: null,
    dataset: {},
    attributes: {},
    listeners: new Map(),
    classList: createClassList(),
    style: {},
    disabled: false,
    hidden: false,
    textContent: '',
    append(...nodes) {
      for (const node of nodes) {
        if (node.parentElement) {
          const previous = node.parentElement;
          previous.childNodes = previous.childNodes.filter((entry) => entry !== node);
          previous.children = previous.children.filter((entry) => entry !== node);
        }
        node.parentElement = element;
        element.children.push(node);
        element.childNodes.push(node);
      }
    },
    before(node) {
      const parent = element.parentElement;
      if (!parent) return;
      if (node.parentElement) {
        const previous = node.parentElement;
        previous.childNodes = previous.childNodes.filter((entry) => entry !== node);
        previous.children = previous.children.filter((entry) => entry !== node);
      }
      const index = parent.childNodes.indexOf(element);
      parent.childNodes.splice(index < 0 ? parent.childNodes.length : index, 0, node);
      parent.children.push(node);
      node.parentElement = parent;
    },
    remove() {
      const parent = element.parentElement;
      if (!parent) return;
      parent.childNodes = parent.childNodes.filter((entry) => entry !== element);
      parent.children = parent.children.filter((entry) => entry !== element);
      element.parentElement = null;
    },
    setAttribute(name, value) {
      element.attributes[name] = String(value);
    },
    removeAttribute(name) {
      delete element.attributes[name];
    },
    getAttribute(name) {
      return Object.hasOwn(element.attributes, name) ? element.attributes[name] : null;
    },
    addEventListener(type, listener) {
      const listeners = element.listeners.get(type) || [];
      listeners.push(listener);
      element.listeners.set(type, listeners);
    },
    removeEventListener(type, listener) {
      const listeners = element.listeners.get(type) || [];
      element.listeners.set(
        type,
        listeners.filter((entry) => entry !== listener),
      );
    },
    dispatchEvent(event) {
      for (const listener of element.listeners.get(event.type) || []) listener(event);
      return true;
    },
    matches(selector) {
      return selector === ':disabled' ? element.disabled : false;
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    focus() {
      documentObject.activeElement = element;
    },
    scrollIntoView() {},
    showPopover() {},
    hidePopover() {},
    checkVisibility() {
      return true;
    },
  };
  return element;
}

function createHarness() {
  const documentObject = {
    activeElement: null,
    createElement: (tagName) => createElement(documentObject, tagName),
    addEventListener() {},
    removeEventListener() {},
    defaultView: {
      Event: class {
        constructor(type, options = {}) {
          this.type = type;
          this.bubbles = options.bubbles;
        }
      },
      cancelAnimationFrame() {},
      crypto: { randomUUID: () => 'uuid-1' },
      innerHeight: 800,
      innerWidth: 1200,
      requestAnimationFrame: () => 1,
    },
  };
  const root = createElement(documentObject, 'div');
  const parent = createElement(documentObject, 'section');
  const select = createElement(documentObject, 'select');
  parent.append(root, select);
  select.setAttribute('aria-label', '角色');
  select.options = [
    Object.assign(createElement(documentObject, 'option'), {
      value: 'a',
      textContent: 'Alpha',
      dataset: {},
    }),
    Object.assign(createElement(documentObject, 'option'), {
      value: 'b',
      textContent: 'Beta',
      dataset: { thumbnailUrl: 'thumb.png' },
    }),
  ];
  select.selectedOptions = [select.options[1]];
  select.value = 'b';
  root.querySelectorAll = (selector) => (selector === 'select' ? [select] : []);
  documentObject.querySelectorAll = () => [];
  return { documentObject, root, parent, select };
}

test('workspaceSelects: replaces native selects with a listbox wrapper and mirrors options', () => {
  const { root, parent, select } = createHarness();
  const controller = bindWorkspaceSelects(root);

  assert.equal(select.hidden, true);
  assert.equal(parent.children.length, 2);
  const wrapper = parent.children.find((entry) => entry.className === 'story-replication-select');
  const [, trigger, menu] = wrapper.children;
  assert.equal(wrapper.className, 'story-replication-select');
  assert.equal(trigger.className, 'story-replication-select-trigger');
  assert.equal(trigger.getAttribute('aria-label'), '角色');
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(trigger.children[0].textContent, 'Beta');
  assert.equal(menu.children.length, 2);
  assert.equal(menu.children[0].dataset.value, 'a');
  assert.equal(menu.children[0].textContent, 'Alpha');
  assert.equal(menu.children[1].getAttribute('aria-selected'), 'true');
  assert.equal(menu.children[1].children[0].className, 'workspace-select-character-thumbnail');
  assert.equal(menu.children[1].children[0].src, 'thumb.png');
  controller.destroy();
});

test('workspaceSelects: sync updates the trigger text and option aria state', () => {
  const { root, parent, select } = createHarness();
  const controller = bindWorkspaceSelects(root);
  const wrapper = parent.children.find((entry) => entry.className === 'story-replication-select');
  const [, trigger, menu] = wrapper.children;

  select.value = 'a';
  select.selectedOptions = [select.options[0]];
  controller.sync();

  assert.equal(trigger.title, 'Alpha');
  assert.equal(trigger.children[0].textContent, 'Alpha');
  assert.equal(menu.children[0].getAttribute('aria-selected'), 'true');
  assert.equal(menu.children[1].getAttribute('aria-selected'), 'false');
  controller.destroy();
});

test('workspaceSelects: disabled native selects disable the visible trigger', () => {
  const { root, parent, select } = createHarness();
  const controller = bindWorkspaceSelects(root);
  const wrapper = parent.children.find((entry) => entry.className === 'story-replication-select');
  const [, trigger] = wrapper.children;
  select.disabled = true;
  controller.sync();
  assert.equal(trigger.disabled, true);
  controller.destroy();
});

test('workspaceSelects: thumbnail load failures remove the thumbnail image', () => {
  const { root, parent } = createHarness();
  const controller = bindWorkspaceSelects(root);
  const wrapper = parent.children.find((entry) => entry.className === 'story-replication-select');
  const [, , menu] = wrapper.children;
  const image = menu.children[1].children[0];
  image.remove = () => {
    image.removed = true;
  };
  image.dispatchEvent({ type: 'error' });
  assert.equal(image.removed, true);
  controller.destroy();
});

test('workspaceSelects: destroy restores the native selects and removes root listeners', () => {
  const { root, parent, select } = createHarness();
  const controller = bindWorkspaceSelects(root);
  assert.equal(parent.children.includes(root), true);
  const wrapper = parent.children.find((entry) => entry.className === 'story-replication-select');

  controller.destroy();
  assert.equal(select.hidden, false);
  assert.equal(select.parentElement, parent);
  assert.equal(parent.children.includes(wrapper), false);
  assert.equal(parent.children.includes(root), true);
  assert.equal(root.listeners.get('click').length, 0);
  assert.equal(root.listeners.get('keydown').length, 0);
  assert.equal(root.listeners.get('change').length, 0);
});
