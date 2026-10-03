// Minimal shared DOM substitute for the legacy preview suites.
//
// These suites are hand-rolled and offline: they must run under plain `node --test`
// without a browser, jsdom or Electron. This module provides just enough DOM surface
// for the preview/loading modules under test.
//
// Usage:
//   const restoreDom = installPreviewDomStubs();
//   test.after(() => restoreDom());

class FakeClassList {
  constructor(tokens = []) {
    this._tokens = new Set(tokens.filter(Boolean));
  }
  _list() {
    return [...this._tokens];
  }
  add(...tokens) {
    for (const token of tokens) for (const part of String(token || '').split(/\s+/)) if (part) this._tokens.add(part);
  }
  remove(...tokens) {
    for (const token of tokens) for (const part of String(token || '').split(/\s+/)) this._tokens.delete(part);
  }
  contains(token) {
    return this._tokens.has(String(token));
  }
  toggle(token, force) {
    const name = String(token);
    const next = force === undefined ? !this._tokens.has(name) : force === true;
    if (next) this._tokens.add(name);
    else this._tokens.delete(name);
    return next;
  }
  item(index) {
    return this._list()[index] ?? null;
  }
  get length() {
    return this._tokens.size;
  }
  get value() {
    return this._list().join(' ');
  }
  toString() {
    return this.value;
  }
}

class FakeElement {
  constructor(tagName = 'div') {
    this.tagName = String(tagName || 'div').toUpperCase();
    this.nodeName = this.tagName;
    this.nodeType = 1;
    this.children = [];
    this.parentNode = null;
    this.classList = new FakeClassList();
    this.style = {};
    this.attributes = {};
    this.dataset = {};
    this.textContent = '';
    this.innerText = '';
    this._innerHTML = '';
    this.disabled = false;
    this.value = '';
    this.checked = false;
    this.focused = false;
    this._listeners = new Map();
  }
  get className() {
    return this.classList.value;
  }
  set className(value) {
    this.classList = new FakeClassList(String(value || '').split(/\s+/));
  }
  get innerHTML() {
    return this._innerHTML;
  }
  set innerHTML(value) {
    this._innerHTML = String(value ?? '');
    if (!this._innerHTML) this.children = [];
  }
  get firstChild() {
    return this.children[0] ?? null;
  }
  get childNodes() {
    return this.children;
  }
  get childrenList() {
    return this.children;
  }
  appendChild(child) {
    if (child) {
      if (child.parentNode) child.parentNode.removeChild(child);
      child.parentNode = this;
      this.children.push(child);
    }
    return child;
  }
  append(...children) {
    for (const child of children) this.appendChild(child);
  }
  insertBefore(child, reference) {
    if (!child) return child;
    const index = reference ? this.children.indexOf(reference) : -1;
    if (child.parentNode) child.parentNode.removeChild(child);
    child.parentNode = this;
    if (index >= 0) this.children.splice(index, 0, child);
    else this.children.push(child);
    return child;
  }
  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index >= 0) this.children.splice(index, 1);
    if (child) child.parentNode = null;
    return child;
  }
  replaceChildren(...children) {
    for (const child of [...this.children]) child.parentNode = null;
    this.children = [];
    this.append(...children);
  }
  remove() {
    if (this.parentNode) this.parentNode.removeChild(this);
  }
  contains(node) {
    if (node === this) return true;
    return this.children.some((child) => child?.contains?.(node) === true);
  }
  setAttribute(name, value) {
    const key = String(name);
    this.attributes[key] = String(value);
    if (key === 'class') this.className = String(value);
    if (key.startsWith('data-')) {
      const camel = key.slice(5).replace(/-(\w)/g, (_match, letter) => letter.toUpperCase());
      this.dataset[camel] = String(value);
    }
  }
  getAttribute(name) {
    const key = String(name);
    if (key === 'class') return this.className;
    return Object.prototype.hasOwnProperty.call(this.attributes, key) ? this.attributes[key] : null;
  }
  hasAttribute(name) {
    return this.getAttribute(name) !== null;
  }
  removeAttribute(name) {
    delete this.attributes[String(name)];
  }
  addEventListener(type, callback) {
    const key = String(type);
    if (!this._listeners.has(key)) this._listeners.set(key, []);
    this._listeners.get(key).push(callback);
  }
  removeEventListener(type, callback) {
    const list = this._listeners.get(String(type));
    if (!list) return;
    const index = list.indexOf(callback);
    if (index >= 0) list.splice(index, 1);
  }
  dispatchEvent(event) {
    for (const callback of [...(this._listeners.get(String(event?.type)) || [])]) {
      callback.call(this, event);
    }
    return true;
  }
  focus() {
    this.focused = true;
  }
  blur() {
    this.focused = false;
  }
  click() {
    this.dispatchEvent({ type: 'click', target: this });
    if (typeof this.onclick === 'function') this.onclick({ type: 'click', target: this });
  }
  getBoundingClientRect() {
    return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 };
  }
  querySelector(selector) {
    return this.querySelectorAll(selector)[0] ?? null;
  }
  querySelectorAll(selector) {
    const query = String(selector || '').trim();
    if (!query) return [];
    const matches = [];
    const visit = (node) => {
      for (const child of node.children || []) {
        if (matchesSelector(child, query)) matches.push(child);
        visit(child);
      }
    };
    visit(this);
    return matches;
  }
}

function matchesSelector(element, selector) {
  if (!element) return false;
  // Support the simple single-class / single-tag / attribute selectors used by these suites.
  return selector
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .some((part) => {
      if (part.startsWith('.')) return element.classList.contains(part.slice(1));
      if (part.startsWith('#')) return element.getAttribute('id') === part.slice(1);
      if (part.startsWith('[') && part.endsWith(']')) {
        return element.getAttribute(part.slice(1, -1).split('=')[0].trim()) !== null;
      }
      return element.tagName === part.toUpperCase();
    });
}

export class PreviewDomElement extends FakeElement {}

function createDocumentStub(body) {
  const documentStub = {
    body,
    documentElement: new FakeElement('html'),
    head: new FakeElement('head'),
    createElement: (tagName) => new FakeElement(tagName),
    createElementNS: (_namespace, tagName) => new FakeElement(tagName),
    createTextNode: (text) => {
      const node = new FakeElement('#text');
      node.nodeType = 3;
      node.textContent = String(text ?? '');
      return node;
    },
    createDocumentFragment: () => new FakeElement('#fragment'),
    getElementById: () => null,
    querySelector: (selector) => body.querySelector(selector),
    querySelectorAll: (selector) => body.querySelectorAll(selector),
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    activeElement: null,
  };
  documentStub.documentElement.appendChild(body);
  return documentStub;
}

let installed = false;
let previousDocument;
let previousWindow;
let hadDocument = false;
let hadWindow = false;

export function createFakePreviewContainer() {
  const container = new FakeElement('div');
  container.className = 'img-preview-container';
  return container;
}

/**
 * Installs a minimal `document`/`window` pair on globalThis and returns a restore
 * function that puts the previous globals back exactly as they were.
 */
export function installPreviewDomStubs() {
  const body = new FakeElement('body');
  const documentStub = createDocumentStub(body);
  const windowStub = globalThis.window ?? {};
  windowStub.document = documentStub;
  windowStub.addEventListener ||= () => {};
  windowStub.removeEventListener ||= () => {};
  windowStub.dispatchEvent ||= () => true;
  windowStub.setTimeout ||= globalThis.setTimeout;
  windowStub.clearTimeout ||= globalThis.clearTimeout;
  windowStub.requestAnimationFrame ||= (callback) => globalThis.setTimeout(() => callback(Date.now()), 0);
  windowStub.cancelAnimationFrame ||= (handle) => globalThis.clearTimeout(handle);

  hadWindow = 'window' in globalThis;
  previousWindow = globalThis.window;
  hadDocument = 'document' in globalThis;
  previousDocument = globalThis.document;

  globalThis.window = windowStub;
  globalThis.document = documentStub;
  globalThis.HTMLElement ||= FakeElement;
  globalThis.Element ||= FakeElement;
  globalThis.Node ||= FakeElement;
  globalThis.CustomEvent ||= class CustomEvent {
    constructor(type, options = {}) {
      this.type = String(type);
      this.detail = options?.detail;
      this.bubbles = options?.bubbles === true;
    }
  };
  globalThis.Event ||= class Event {
    constructor(type, options = {}) {
      this.type = String(type);
      this.bubbles = options?.bubbles === true;
    }
  };

  installed = true;
  let restored = false;
  return function restorePreviewDom() {
    if (!installed || restored) return;
    restored = true;
    if (hadDocument) globalThis.document = previousDocument;
    else delete globalThis.document;
    if (hadWindow) globalThis.window = previousWindow;
    else delete globalThis.window;
  };
}

export function isPreviewDomStubInstalled() {
  return installed;
}

export { FakeElement, FakeClassList };
