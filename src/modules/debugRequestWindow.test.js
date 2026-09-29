import test from 'node:test';
import assert from 'node:assert/strict';

import {
  closeDebugRequestWindow,
  isRequestDebugEnabled,
  openDebugRequestWindow,
  renderRequestDebugButton,
} from './debugRequestWindow.js';

class FakeElement {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.listeners = new Map();
    this.attributes = {};
    this.dataset = {};
    this.style = {};
    this.className = '';
    this.hidden = false;
    this.disabled = false;
    this.isConnected = false;
    this._textContent = '';
    this._selectors = new Map();
  }

  get textContent() {
    if (this._textContent) return this._textContent;
    return this.children.map((child) => child.textContent || '').join('');
  }

  set textContent(value) {
    this._textContent = String(value);
    this.children = [];
  }

  set innerHTML(value) {
    this._innerHTML = String(value);
    this.children = [];
    this._selectors.clear();

    const header = this.ownerDocument.createElement('header');
    const title = this.ownerDocument.createElement('strong');
    const closeButton = this.ownerDocument.createElement('button');
    header.append(title, closeButton);

    const subtitle = this.ownerDocument.createElement('p');
    subtitle.className = 'request-debug-subtitle';
    const tabs = this.ownerDocument.createElement('nav');
    const pre = this.ownerDocument.createElement('pre');
    const footer = this.ownerDocument.createElement('footer');
    const status = this.ownerDocument.createElement('span');
    status.setAttribute('role', 'status');
    const copyButton = this.ownerDocument.createElement('button');
    footer.append(status, copyButton);

    this.append(header, subtitle, tabs, pre, footer);
    this._selectors.set('header', header);
    this._selectors.set('header button', closeButton);
    this._selectors.set('.request-debug-subtitle', subtitle);
    this._selectors.set('nav', tabs);
    this._selectors.set('pre', pre);
    this._selectors.set('footer button', copyButton);
    this._selectors.set('[role="status"]', status);
  }

  get innerHTML() {
    return this._innerHTML || '';
  }

  querySelector(selector) {
    const mapped = this._selectors.get(selector);
    if (mapped) return mapped;
    const header = this.children.find((child) => child.tagName === 'HEADER');
    const footer = this.children.find((child) => child.tagName === 'FOOTER');
    const nav = this.children.find((child) => child.tagName === 'NAV');
    const pre = this.children.find((child) => child.tagName === 'PRE');
    const subtitle = this.children.find(
      (child) => child.className === 'request-debug-subtitle',
    );
    if (selector === 'strong') return header?.children.find((child) => child.tagName === 'STRONG') || null;
    if (selector === 'header') return header || null;
    if (selector === 'header button') {
      return header?.children.find((child) => child.tagName === 'BUTTON') || null;
    }
    if (selector === '.request-debug-subtitle') return subtitle || null;
    if (selector === 'nav') return nav || null;
    if (selector === 'pre') return pre || null;
    if (selector === 'footer button') {
      return footer?.children.find((child) => child.tagName === 'BUTTON') || null;
    }
    if (selector === '[role="status"]') {
      return footer?.children.find((child) => child.attributes.role === 'status') || null;
    }
    return null;
  }

  querySelectorAll(selector) {
    if (selector === 'button') {
      return this.children.filter((child) => child.tagName === 'BUTTON');
    }
    return [];
  }

  append(...nodes) {
    for (const node of nodes) {
      this.children.push(node);
      if (node && typeof node === 'object') node.isConnected = true;
    }
  }

  replaceChildren(...nodes) {
    this._textContent = '';
    this.children = [];
    this.append(...nodes);
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  removeAttribute(name) {
    delete this.attributes[name];
  }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }

  removeEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    this.listeners.set(
      type,
      listeners.filter((item) => item !== listener),
    );
  }

  async trigger(type, event = {}) {
    const pending = [];
    for (const listener of this.listeners.get(type) || []) {
      pending.push(listener({ type, target: this, ...event }));
    }
    await Promise.all(pending);
  }

  click() {
    return this.trigger('click');
  }

  focus() {
    this.ownerDocument.activeElement = this;
  }

  closest(selector) {
    return selector === 'button' && this.tagName === 'BUTTON' ? this : null;
  }

  remove() {
    this.isConnected = false;
    const index = this.ownerDocument.body.children.indexOf(this);
    if (index >= 0) this.ownerDocument.body.children.splice(index, 1);
  }

  getBoundingClientRect() {
    return { left: 10, top: 20, width: 320, height: 240 };
  }
}

class FakeDocument {
  constructor() {
    this.body = new FakeElement('body', this);
    this.activeElement = null;
  }

  createElement(tagName) {
    return new FakeElement(tagName, this);
  }

  createTextNode(textContent) {
    return { textContent: String(textContent) };
  }

  createRange() {
    return { selectNodeContents() {} };
  }
}

function createWindow(document) {
  const listeners = new Map();
  const storage = new Map();
  const copied = [];
  return {
    DEV_MODE: true,
    document,
    innerWidth: 1200,
    innerHeight: 800,
    localStorage: {
      getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
      },
      setItem(key, value) {
        storage.set(key, String(value));
      },
    },
    navigator: {
      clipboard: {
        async writeText(value) {
          copied.push(value);
        },
      },
    },
    getComputedStyle() {
      return { width: '320px', height: '240px' };
    },
    getSelection() {
      return { removeAllRanges() {}, addRange() {} };
    },
    setTimeout,
    clearTimeout,
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(listener);
    },
    removeEventListener(type, listener) {
      listeners.set(
        type,
        (listeners.get(type) || []).filter((item) => item !== listener),
      );
    },
    trigger(type, event = {}) {
      for (const listener of listeners.get(type) || []) listener({ type, ...event });
    },
    copied,
  };
}

test('debugRequestWindow: gates developer mode and renders its trigger', () => {
  const document = new FakeDocument();
  const window = createWindow(document);

  assert.equal(isRequestDebugEnabled(window), true);
  assert.equal(isRequestDebugEnabled({ DEV_MODE: false }), false);
  assert.match(renderRequestDebugButton('data-test="debug"'), /request-debug-trigger/u);
  assert.match(renderRequestDebugButton('data-test="debug"'), /data-test="debug"/u);

  window.DEV_MODE = false;
  assert.equal(
    openDebugRequestWindow({
      documentObject: document,
      windowObject: window,
      outputText: 'blocked',
    }),
    null,
  );
});

test('debugRequestWindow: renders content, copies, persists bounds, and closes', async () => {
  const document = new FakeDocument();
  const window = createWindow(document);
  const handle = openDebugRequestWindow({
    documentObject: document,
    windowObject: window,
    title: 'Request debug',
    subtitle: 'Read only',
    outputText: 'hello',
  });

  assert.ok(handle);
  assert.equal(document.body.children.length, 1);
  assert.equal(handle.root.querySelector('strong').textContent, 'Request debug');
  assert.equal(handle.root.querySelector('.request-debug-subtitle').textContent, 'Read only');

  const tab = handle.root.querySelector('nav').querySelectorAll('button')[0];
  await tab.trigger('click');
  assert.equal(handle.root.querySelector('pre').textContent, 'hello');
  assert.equal(tab.attributes['aria-pressed'], 'true');

  await handle.root.querySelector('footer button').trigger('click');
  assert.deepEqual(window.copied, ['hello']);
  assert.equal(handle.root.querySelector('[role="status"]').textContent, '\u5df2\u590d\u5236');

  await handle.root.querySelector('header button').trigger('click');
  assert.equal(handle.root.isConnected, false);
  assert.equal(document.body.children.length, 0);
  assert.deepEqual(JSON.parse(window.localStorage.getItem(
    'aicanvas.request-debug-window.bounds.v1',
  )), {
    left: 10,
    top: 20,
    width: 320,
    height: 240,
  });

  const reopened = openDebugRequestWindow({
    documentObject: document,
    windowObject: window,
    outputText: 'again',
  });
  assert.equal(reopened.root.style.width, '320px');
  assert.equal(reopened.root.style.height, '240px');
  closeDebugRequestWindow(document);
  assert.equal(reopened.root.isConnected, false);
});
