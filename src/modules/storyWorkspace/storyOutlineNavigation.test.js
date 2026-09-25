import test from 'node:test';
import assert from 'node:assert/strict';
import { bindStoryOutlineNavigation, jumpToStoryOutlineSection } from './storyOutlineNavigation.js';

// 最小假 DOM：只实现被测模块用到的接口（节点树、简单选择器、dataset、classList、style、事件），不引入 jsdom
const toDataKey = (name) => name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
const toDataAttr = (key) => 'data-' + key.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase());

function parseSelector(selector) {
  return selector.split(',').map((part) =>
    part
      .trim()
      .split(/\s+/)
      .map((compound) => {
        const tag = /^[a-z][\w-]*/i.exec(compound)?.[0] || '';
        const parsed = { tag: tag.toUpperCase(), classes: [], attrs: [], pseudos: [] };
        for (const match of compound
          .slice(tag.length)
          .matchAll(/\.([\w-]+)|\[([\w-]+)(?:="([^"]*)")?\]|:([\w-]+)/g)) {
          if (match[1]) parsed.classes.push(match[1]);
          else if (match[2]) parsed.attrs.push({ name: match[2], value: match[3] });
          else parsed.pseudos.push(match[4]);
        }
        return parsed;
      }),
  );
}

function matchesCompound(element, compound) {
  return (
    element?.nodeType === 1 &&
    (!compound.tag || element.tagName === compound.tag) &&
    compound.classes.every((name) => element.classList.contains(name)) &&
    compound.attrs.every(({ name, value }) =>
      value === undefined ? element.hasAttribute(name) : element.getAttribute(name) === value,
    ) &&
    compound.pseudos.every((pseudo) => pseudo === 'hover' && element.hovered === true)
  );
}

function matchesChain(element, chain) {
  if (!matchesCompound(element, chain[chain.length - 1])) return false;
  let index = chain.length - 2;
  for (let node = element.parentNode; node && index >= 0; node = node.parentNode) {
    if (matchesCompound(node, chain[index])) index -= 1;
  }
  return index < 0;
}

class FakeNode {
  constructor(ownerDocument) {
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
    this.childNodes = [];
  }
  get parentElement() {
    return this.parentNode?.nodeType === 1 ? this.parentNode : null;
  }
  get isConnected() {
    let node = this;
    while (node.parentNode) node = node.parentNode;
    return node === this.ownerDocument.documentElement;
  }
  get textContent() {
    return this.childNodes.map((node) => node.textContent).join('');
  }
  contains(node) {
    for (let current = node; current; current = current.parentNode) if (current === this) return true;
    return false;
  }
  remove() {
    const siblings = this.parentNode?.childNodes;
    if (siblings?.includes(this)) siblings.splice(siblings.indexOf(this), 1);
    this.parentNode = null;
  }
  insertNodes(index, nodes) {
    for (const node of nodes) {
      const items = node.nodeType === 11 ? node.childNodes.splice(0) : [node];
      for (const item of items) {
        if (item.parentNode === this && this.childNodes.indexOf(item) < index) index -= 1;
        item.remove();
        item.parentNode = this;
        this.childNodes.splice(index, 0, item);
        index += 1;
      }
    }
  }
  append(...nodes) {
    this.insertNodes(this.childNodes.length, nodes);
  }
  appendChild(node) {
    this.append(node);
    return node;
  }
  before(...nodes) {
    this.parentNode.insertNodes(this.parentNode.childNodes.indexOf(this), nodes);
  }
  replaceWith(...nodes) {
    const parent = this.parentNode;
    const index = parent.childNodes.indexOf(this);
    this.remove();
    parent.insertNodes(index, nodes);
  }
}

class FakeText extends FakeNode {
  constructor(ownerDocument, value) {
    super(ownerDocument);
    this.nodeType = 3;
    this.nodeValue = String(value);
  }
  get textContent() {
    return this.nodeValue;
  }
}

class FakeFragment extends FakeNode {
  constructor(ownerDocument) {
    super(ownerDocument);
    this.nodeType = 11;
  }
}

class FakeElement extends FakeNode {
  constructor(ownerDocument, tagName) {
    super(ownerDocument);
    this.nodeType = 1;
    this.tagName = tagName.toUpperCase();
    this.attributes = new Map();
    this.listeners = [];
    this.innerHTML = '';
    this.rect = { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
    const classes = new Set();
    this.classList = {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name),
      toggle: (name, force) => {
        const on = force === undefined ? !classes.has(name) : Boolean(force);
        if (on) classes.add(name);
        else classes.delete(name);
        return on;
      },
      values: () => [...classes],
    };
    this.style = {
      setProperty(name, value) {
        this[name] = value;
      },
      removeProperty(name) {
        delete this[name];
      },
    };
    const attributes = this.attributes;
    this.dataset = new Proxy(
      {},
      {
        get: (_, key) => attributes.get(toDataAttr(String(key))),
        set: (_, key, value) => (attributes.set(toDataAttr(String(key)), String(value)), true),
        has: (_, key) => attributes.has(toDataAttr(String(key))),
        deleteProperty: (_, key) => attributes.delete(toDataAttr(String(key))),
        ownKeys: () => [...attributes.keys()].filter((name) => name.startsWith('data-')).map(toDataKey),
        getOwnPropertyDescriptor: (_, key) =>
          attributes.has(toDataAttr(String(key)))
            ? { enumerable: true, configurable: true, value: attributes.get(toDataAttr(String(key))) }
            : undefined,
      },
    );
  }
  get className() {
    return this.classList.values().join(' ');
  }
  set className(value) {
    this.classList.remove(...this.classList.values());
    this.classList.add(...String(value).split(/\s+/).filter(Boolean));
  }
  get textContent() {
    return super.textContent;
  }
  set textContent(value) {
    this.childNodes.splice(0).forEach((node) => (node.parentNode = null));
    if (String(value)) this.append(new FakeText(this.ownerDocument, value));
  }
  setAttribute(name, value) {
    if (name === 'class') this.className = value;
    else this.attributes.set(name, String(value));
  }
  getAttribute(name) {
    if (name === 'class') return this.className;
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }
  hasAttribute(name) {
    return name === 'class' ? this.classList.values().length > 0 : this.attributes.has(name);
  }
  removeAttribute(name) {
    this.attributes.delete(name);
  }
  matches(selector) {
    return parseSelector(selector).some((chain) => matchesChain(this, chain));
  }
  closest(selector) {
    for (let node = this; node?.nodeType === 1; node = node.parentNode)
      if (node.matches(selector)) return node;
    return null;
  }
  querySelectorAll(selector) {
    const chains = parseSelector(selector);
    const found = [];
    const walk = (node) => {
      for (const child of node.childNodes) {
        if (child.nodeType !== 1) continue;
        if (chains.some((chain) => matchesChain(child, chain))) found.push(child);
        walk(child);
      }
    };
    walk(this);
    return found;
  }
  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
  getBoundingClientRect() {
    return { ...this.rect };
  }
  addEventListener(type, listener, options) {
    this.listeners.push({ type, listener, capture: options === true || options?.capture === true });
  }
  removeEventListener(type, listener, options) {
    const capture = options === true || options?.capture === true;
    this.listeners = this.listeners.filter(
      (entry) => !(entry.type === type && entry.listener === listener && entry.capture === capture),
    );
  }
}

class FakeDocument {
  constructor() {
    this.documentElement = new FakeElement(this, 'html');
    this.activeElement = null;
    this.selection = {
      ranges: [],
      removeAllRanges() {
        this.ranges = [];
      },
      addRange(range) {
        this.ranges.push(range);
      },
    };
  }
  createElement(tagName) {
    return new FakeElement(this, tagName);
  }
  createTextNode(value) {
    return new FakeText(this, value);
  }
  createDocumentFragment() {
    return new FakeFragment(this);
  }
  createTreeWalker(root, whatToShow) {
    assert.equal(whatToShow, 4);
    const texts = [];
    const walk = (node) =>
      node.childNodes.forEach((child) => (child.nodeType === 3 ? texts.push(child) : walk(child)));
    walk(root);
    let index = -1;
    return {
      currentNode: root,
      nextNode() {
        index += 1;
        this.currentNode = texts[index] || this.currentNode;
        return texts[index] || null;
      },
    };
  }
  createRange() {
    return {
      selectNode(node) {
        this.selectedNode = node;
      },
    };
  }
  getSelection() {
    return this.selection;
  }
}

// h(doc, 'div', { class: 'a b', 'data-x': '1', rect: {...} }, [子节点或文本])
function h(doc, tagName, attributes = {}, children = []) {
  const element = doc.createElement(tagName);
  for (const [name, value] of Object.entries(attributes)) {
    if (name === 'rect') element.rect = { ...element.rect, ...value };
    else element.setAttribute(name, value);
  }
  for (const child of children) element.append(typeof child === 'string' ? doc.createTextNode(child) : child);
  return element;
}

function rect(left, top, width, height) {
  return { left, top, width, height, right: left + width, bottom: top + height };
}

function fire(element, type, extra = {}) {
  const event = {
    type,
    defaultPrevented: false,
    propagationStopped: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    stopPropagation() {
      this.propagationStopped = true;
    },
    ...extra,
  };
  element.listeners.filter((entry) => entry.type === type).forEach((entry) => entry.listener(event));
  return event;
}

function fakeWindow({ animationFrames = true } = {}) {
  let nextId = 1;
  const win = {
    timers: new Map(),
    cleared: [],
    frames: [],
    setTimeout(callback, delay) {
      const id = nextId++;
      win.timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) {
      win.cleared.push(id);
      win.timers.delete(id);
    },
    runTimers() {
      for (const [id, timer] of [...win.timers]) {
        win.timers.delete(id);
        timer.callback();
      }
    },
    runFrames() {
      win.frames.splice(0).forEach((callback) => callback());
    },
  };
  if (animationFrames) win.requestAnimationFrame = (callback) => win.frames.push(callback);
  return win;
}

function outline() {
  const doc = new FakeDocument();
  const toggle = h(doc, 'button', { 'data-story-outline-nav-toggle': '' });
  const linkText = h(doc, 'span', {}, ['第二节']);
  const link = h(doc, 'a', { 'data-story-outline-nav-target': 's2' }, [linkText]);
  const nav = h(doc, 'nav', { 'data-story-outline-nav': '' }, [toggle, link]);
  const scrolled = [];
  const sections = ['s1', 's2'].map((id) => {
    const section = h(doc, 'section', { 'data-story-outline-section': id });
    section.scrollIntoView = (options) => scrolled.push([id, options]);
    return section;
  });
  const outside = h(doc, 'div', { class: 'outside' });
  const root = h(doc, 'div', {}, [nav, ...sections, outside]);
  doc.documentElement.append(root);
  return { doc, root, nav, toggle, link, linkText, sections, outside, scrolled };
}

test('jumping scrolls the matching section on the next animation frame', () => {
  const { root, scrolled } = outline();
  const win = fakeWindow();
  assert.equal(jumpToStoryOutlineSection(root, 's2', { windowObject: win }), true);
  assert.deepEqual(scrolled, []);
  win.runFrames();
  assert.deepEqual(scrolled, [['s2', { behavior: 'smooth', block: 'start' }]]);
});

test('jumping without animation frames scrolls immediately and ids must match exactly', () => {
  const { root, sections, scrolled } = outline();
  assert.equal(
    jumpToStoryOutlineSection(root, 's1', { windowObject: fakeWindow({ animationFrames: false }) }),
    true,
  );
  assert.equal(jumpToStoryOutlineSection(root, 's2'), true);
  assert.deepEqual(
    scrolled.map(([id]) => id),
    ['s1', 's2'],
  );
  assert.equal(jumpToStoryOutlineSection(root, ' s1'), false);
  assert.equal(jumpToStoryOutlineSection(root, 'missing'), false);
  delete sections[0].scrollIntoView;
  assert.equal(jumpToStoryOutlineSection(root, 's1', { windowObject: {} }), true);
});

test('binding needs an outline nav inside the root', () => {
  assert.equal(bindStoryOutlineNavigation(null), null);
  const doc = new FakeDocument();
  assert.equal(bindStoryOutlineNavigation(h(doc, 'div')), null);
});

test('hovering opens the nav and leaving closes it after 180 ms', () => {
  const { root, nav, toggle } = outline();
  const win = fakeWindow();
  bindStoryOutlineNavigation(root, { windowObject: win });
  fire(nav, 'pointerenter');
  assert.equal(nav.classList.contains('is-hover-open'), true);
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  fire(nav, 'pointerleave');
  const [[leaveTimer, { delay }]] = [...win.timers];
  assert.equal(delay, 180);
  fire(nav, 'pointerenter');
  assert.deepEqual(win.cleared, [leaveTimer]);
  fire(nav, 'pointerleave');
  win.runTimers();
  assert.equal(nav.classList.contains('is-hover-open'), false);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
});

test('the toggle pins the nav open until an outside click', () => {
  const { root, nav, toggle, outside } = outline();
  const win = fakeWindow();
  bindStoryOutlineNavigation(root, { windowObject: win });
  const click = fire(toggle, 'click');
  assert.equal(click.defaultPrevented, true);
  assert.equal(nav.classList.contains('is-pinned'), true);
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  fire(nav, 'pointerenter');
  fire(nav, 'pointerleave');
  assert.equal(win.timers.size, 0);
  fire(root, 'click', { target: toggle });
  assert.equal(nav.classList.contains('is-pinned'), true);
  fire(root, 'click', { target: outside });
  assert.equal(nav.classList.contains('is-pinned'), false);
  assert.equal(nav.classList.contains('is-hover-open'), false);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
});

test('unpinning keeps the nav expanded while the pointer is still over it', () => {
  const { root, nav, toggle } = outline();
  bindStoryOutlineNavigation(root, { windowObject: fakeWindow() });
  fire(toggle, 'click');
  nav.hovered = true;
  fire(toggle, 'click');
  assert.equal(nav.classList.contains('is-pinned'), false);
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  nav.hovered = false;
  fire(toggle, 'click');
  fire(toggle, 'click');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
});

test('clicking a nav target jumps to its section', () => {
  const { root, linkText, scrolled } = outline();
  const win = fakeWindow();
  bindStoryOutlineNavigation(root, { windowObject: win });
  const click = fire(root, 'click', { target: linkText });
  assert.equal(click.defaultPrevented, true);
  win.runFrames();
  assert.deepEqual(scrolled, [['s2', { behavior: 'smooth', block: 'start' }]]);
});

test('focus keeps the nav expanded and Escape closes it', () => {
  const { doc, root, nav, toggle, link, outside } = outline();
  const win = fakeWindow();
  bindStoryOutlineNavigation(root, { windowObject: win });
  fire(nav, 'focusin');
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  doc.activeElement = link;
  fire(nav, 'focusout');
  win.runTimers();
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  doc.activeElement = outside;
  fire(nav, 'focusout');
  win.runTimers();
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  let blurred = 0;
  link.blur = () => (blurred += 1);
  doc.activeElement = link;
  fire(toggle, 'click');
  fire(nav, 'keydown', { key: 'Enter' });
  assert.equal(nav.classList.contains('is-pinned'), true);
  fire(nav, 'keydown', { key: 'Escape' });
  assert.equal(nav.classList.contains('is-pinned'), false);
  assert.equal(blurred, 1);
});

test('destroy removes every listener and pending timer', () => {
  const { root, nav, toggle } = outline();
  const win = fakeWindow();
  const binding = bindStoryOutlineNavigation(root, { windowObject: win });
  assert.equal(root.listeners.length, 1);
  assert.equal(nav.listeners.length, 5);
  assert.equal(toggle.listeners.length, 1);
  fire(nav, 'pointerleave');
  fire(nav, 'focusout');
  const pending = [...win.timers.keys()];
  binding.destroy();
  assert.deepEqual([...win.cleared].sort(), [...pending].sort());
  assert.deepEqual([root.listeners, nav.listeners, toggle.listeners], [[], [], []]);
});
