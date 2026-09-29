import test from 'node:test';
import assert from 'node:assert/strict';

import { bindTextareaMentions } from './textareaMentions.js';

function createClassList() {
  const values = new Set();
  return {
    add(...names) {
      names.forEach((name) => values.add(name));
    },
    remove(...names) {
      names.forEach((name) => values.delete(name));
    },
    toggle(name, enabled) {
      if (enabled) values.add(name);
      else values.delete(name);
    },
    contains(name) {
      return values.has(name);
    },
  };
}

function createElement(tagName = 'div') {
  const attributes = new Map();
  const listeners = new Map();
  const element = {
    tagName: tagName.toUpperCase(),
    className: '',
    classList: createClassList(),
    children: [],
    parentNode: null,
    style: {},
    dataset: {},
    hidden: false,
    disabled: false,
    isConnected: true,
    value: '',
    selectionStart: 0,
    selectionEnd: 0,
    scrollTop: 0,
    scrollLeft: 0,
    textContent: '',
    innerHTML: '',
    tabIndex: 0,
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    addEventListener(type, listener) {
      const current = listeners.get(type) || [];
      current.push(listener);
      listeners.set(type, current);
    },
    removeEventListener(type, listener) {
      const current = listeners.get(type) || [];
      listeners.set(
        type,
        current.filter((item) => item !== listener),
      );
    },
    dispatchEvent(type, init = {}) {
      const event = {
        type,
        target: element,
        key: init.key || '',
        isComposing: Boolean(init.isComposing),
        preventDefault() {
          this.defaultPrevented = true;
        },
        stopImmediatePropagation() {
          this.immediatePropagationStopped = true;
        },
      };
      for (const listener of [...(listeners.get(type) || [])]) listener(event);
      return event;
    },
    appendChild(child) {
      child.parentNode = element;
      this.children.push(child);
      return child;
    },
    append(...children) {
      children.forEach((child) => this.appendChild(child));
    },
    replaceChildren(...children) {
      this.children = [];
      this.append(...children);
    },
    remove() {
      if (!this.parentNode) return;
      this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
      this.parentNode = null;
    },
    contains(node) {
      if (node === this) return true;
      return this.children.some((child) => child.contains?.(node));
    },
    matches() {
      return false;
    },
    showPopover() {
      this.popoverOpen = true;
    },
    hidePopover() {
      this.popoverOpen = false;
    },
    focus() {
      this.focused = true;
    },
    scrollIntoView() {
      this.scrolledIntoView = true;
    },
    getBoundingClientRect() {
      return { top: 20, left: 30, right: 230, bottom: 60, width: 200, height: 40 };
    },
    getClientRects() {
      return [{}];
    },
  };
  return element;
}

function withDom(callback) {
  const body = createElement('body');
  const document = {
    body,
    createElement,
    createRange() {
      return {
        setStart() {},
        setEnd() {},
        getBoundingClientRect() {
          return { top: 4, left: 8, width: 1, height: 16 };
        },
      };
    },
    addEventListener() {},
    removeEventListener() {},
  };
  const previous = {
    document: globalThis.document,
    getComputedStyle: globalThis.getComputedStyle,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
  };
  globalThis.document = document;
  globalThis.getComputedStyle = () => ({
    fontFamily: 'sans-serif',
    fontSize: '14px',
    fontWeight: '400',
    fontStyle: 'normal',
    lineHeight: '20px',
    letterSpacing: '0px',
    paddingTop: '0px',
    paddingRight: '0px',
    paddingBottom: '0px',
    paddingLeft: '0px',
    borderTopWidth: '0px',
    borderRightWidth: '0px',
    borderBottomWidth: '0px',
    borderLeftWidth: '0px',
    boxSizing: 'border-box',
    wordSpacing: '0px',
    textIndent: '0px',
    tabSize: '4',
  });
  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = () => {};
  try {
    return callback(document);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (typeof value === 'undefined') delete globalThis[key];
      else globalThis[key] = value;
    }
  }
}

test('textareaMentions: opens on @ input, supports keyboard selection, and destroys cleanly', () => {
  withDom((document) => {
    const input = createElement('textarea');
    const trigger = createElement('button');
    const menu = createElement('div');
    menu.id = 'mentions';
    const selected = [];
    const candidates = [
      { label: 'Alpha', subtitle: 'A' },
      { label: 'Beta', subtitle: 'B' },
    ];

    const controller = bindTextareaMentions({
      input,
      trigger,
      menu,
      getCandidates: (query) => (query === 'al' ? candidates : []),
      onSelect: (candidate, range) => selected.push({ candidate, range }),
    });

    assert.equal(menu.getAttribute('popover'), 'manual');
    assert.equal(menu.getAttribute('role'), 'listbox');
    assert.equal(input.getAttribute('aria-controls'), menu.id);
    assert.equal(trigger.getAttribute('aria-controls'), menu.id);
    assert.equal(controller.isOpen(), false);

    input.value = 'hello @al';
    input.selectionStart = 9;
    input.selectionEnd = 9;
    input.dispatchEvent('input');

    assert.equal(controller.isOpen(), true);
    assert.equal(menu.hidden, false);
    assert.equal(menu.children.length, 2);
    assert.equal(trigger.getAttribute('aria-expanded'), 'true');
    assert.equal(menu.children[0].getAttribute('aria-selected'), 'true');

    input.dispatchEvent('keydown', { key: 'ArrowDown' });
    assert.equal(menu.children[1].getAttribute('aria-selected'), 'true');
    assert.equal(input.getAttribute('aria-activedescendant'), `${menu.id}-1`);

    const enterEvent = input.dispatchEvent('keydown', { key: 'Enter' });
    assert.equal(enterEvent.defaultPrevented, true);
    assert.equal(enterEvent.immediatePropagationStopped, true);
    assert.equal(selected.length, 1);
    assert.equal(selected[0].candidate.label, 'Beta');
    assert.deepEqual(selected[0].range, { start: 6, end: 9, typed: true });
    assert.equal(controller.isOpen(), false);
    assert.equal(input.focused, true);

    trigger.dispatchEvent('click');
    assert.equal(controller.isOpen(), true);

    const bodyChildren = document.body.children.length;
    controller.destroy();
    assert.equal(controller.isOpen(), false);
    assert.equal(menu.parentNode, null);
    assert.equal(document.body.children.length, bodyChildren - 1);
  });
});
