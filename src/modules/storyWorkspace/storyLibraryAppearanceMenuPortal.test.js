import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryLibraryAssignmentMenuPortal } from './storyLibraryAppearanceMenuPortal.js';

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

function fakeWindow() {
  let nextFrame = 1;
  const win = {
    innerWidth: 1000,
    innerHeight: 800,
    listeners: [],
    frames: new Map(),
    cancelled: [],
    addEventListener(type, listener) {
      win.listeners.push({ type, listener });
    },
    removeEventListener(type, listener) {
      win.listeners = win.listeners.filter((entry) => !(entry.type === type && entry.listener === listener));
    },
    requestAnimationFrame(callback) {
      const id = nextFrame++;
      win.frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id) {
      win.cancelled.push(id);
      win.frames.delete(id);
    },
    runFrames() {
      for (const [id, callback] of [...win.frames]) {
        win.frames.delete(id);
        callback();
      }
    },
  };
  return win;
}

function library() {
  const doc = new FakeDocument();
  const lookTrigger = h(doc, 'button', {
    'data-story-library-appearance-target': ' look-1 ',
    rect: rect(130, 200, 150, 30),
  });
  const lookMenu = h(doc, 'div', {
    'data-story-library-appearance-menu': 'look-1',
    rect: rect(0, 0, 160, 120),
  });
  const characterMenu = h(
    doc,
    'div',
    { 'data-story-library-target-menu': 'character', rect: rect(120, 150, 180, 200) },
    [lookTrigger, lookMenu],
  );
  const characterTrigger = h(doc, 'button', { 'data-story-library-target-kind': 'character' });
  const characterWrap = h(
    doc,
    'div',
    { class: 'story-library-add-menu-wrap', rect: rect(100, 100, 200, 40) },
    [characterTrigger, characterMenu],
  );
  const sceneTrigger = h(doc, 'button', { 'data-story-library-target-kind': 'scene' });
  const sceneMenu = h(doc, 'div', { 'data-story-library-target-menu': 'scene', rect: rect(0, 0, 180, 200) });
  const sceneWrap = h(doc, 'div', { class: 'story-library-add-menu-wrap', rect: rect(500, 100, 200, 40) }, [
    sceneTrigger,
    sceneMenu,
  ]);
  const storyRoot = h(doc, 'div', { class: 'story-root' }, [characterWrap, sceneWrap]);
  doc.documentElement.append(storyRoot);
  const win = fakeWindow();
  const portal = createStoryLibraryAssignmentMenuPortal({ storyRoot, windowObject: win });
  return {
    doc,
    win,
    portal,
    storyRoot,
    characterWrap,
    characterTrigger,
    characterMenu,
    lookTrigger,
    lookMenu,
    sceneWrap,
    sceneTrigger,
    sceneMenu,
  };
}

test('the portal listens for resize and root scroll and exposes a frozen API', () => {
  const { portal, win, storyRoot } = library();
  assert.equal(Object.isFrozen(portal), true);
  assert.deepEqual(
    win.listeners.map((entry) => entry.type),
    ['resize'],
  );
  assert.deepEqual(
    storyRoot.listeners.map((entry) => [entry.type, entry.capture]),
    [['scroll', true]],
  );
});

test('opening a target menu portals it to the story root below its wrap', () => {
  const { portal, storyRoot, characterWrap, characterTrigger, characterMenu } = library();
  assert.equal(portal.toggleTarget(characterTrigger), true);
  assert.equal(characterMenu.parentNode, storyRoot);
  assert.deepEqual(
    [characterMenu.classList.contains('is-portaled'), characterMenu.classList.contains('is-open')],
    [true, true],
  );
  assert.equal(characterMenu.getAttribute('aria-hidden'), 'false');
  assert.equal(characterWrap.classList.contains('has-target-menu-open'), true);
  assert.equal(characterTrigger.classList.contains('is-active'), true);
  assert.equal(characterTrigger.getAttribute('aria-expanded'), 'true');
  // 右对齐到 wrap：300 - 180 = 120；放在 wrap 下方 140 + 10
  assert.deepEqual([characterMenu.style.left, characterMenu.style.top], ['120px', '150px']);
});

test('target menus flip above the wrap and stay 16 px inside the viewport', () => {
  const { portal, characterWrap, characterTrigger, characterMenu } = library();
  characterWrap.rect = rect(-100, 700, 150, 40);
  portal.toggleTarget(characterTrigger);
  // 下方放不下（750 + 200 > 784），改放上方 700 - 200 - 10；左边界夹到 16
  assert.deepEqual([characterMenu.style.left, characterMenu.style.top], ['16px', '490px']);
});

test('toggling an open target menu puts it back and returns false', () => {
  const { portal, characterWrap, characterTrigger, characterMenu } = library();
  portal.toggleTarget(characterTrigger);
  assert.equal(portal.toggleTarget(characterTrigger), false);
  assert.equal(characterMenu.parentNode, characterWrap);
  assert.deepEqual(
    [characterMenu.classList.contains('is-portaled'), characterMenu.classList.contains('is-open')],
    [false, false],
  );
  assert.equal(characterMenu.getAttribute('aria-hidden'), 'true');
  assert.deepEqual([characterMenu.style.left, characterMenu.style.top], [undefined, undefined]);
  assert.equal(characterWrap.classList.contains('has-target-menu-open'), false);
  assert.equal(characterTrigger.getAttribute('aria-expanded'), 'false');
});

test('target toggles need a wrap, a kind and a matching menu', () => {
  const { doc, portal, storyRoot, characterWrap } = library();
  assert.equal(portal.toggleTarget(null), false);
  assert.equal(
    portal.toggleTarget(h(doc, 'button', { 'data-story-library-target-kind': 'character' })),
    false,
  );
  const unknown = h(doc, 'button', { 'data-story-library-target-kind': 'prop' });
  characterWrap.append(unknown);
  assert.equal(portal.toggleTarget(unknown), false);
  assert.equal(storyRoot.childNodes.length, 2);
});

test('opening a target in another wrap leaves the first menu portaled', () => {
  // 端口行为：只收回同一 wrap 里的旧菜单；换到另一个 wrap 前调用方要先 closeTarget()
  const { portal, storyRoot, characterTrigger, characterMenu, sceneTrigger, sceneMenu, sceneWrap } =
    library();
  portal.toggleTarget(characterTrigger);
  assert.equal(portal.toggleTarget(sceneTrigger), true);
  assert.equal(sceneMenu.parentNode, storyRoot);
  assert.equal(characterMenu.parentNode, storyRoot);
  assert.equal(characterMenu.classList.contains('is-open'), true);
  portal.closeTarget();
  assert.equal(sceneMenu.parentNode, sceneWrap);
  assert.equal(characterMenu.parentNode, storyRoot);
  assert.equal(characterMenu.classList.contains('is-open'), false);
  assert.equal(characterTrigger.getAttribute('aria-expanded'), 'false');
});

test('opening an appearance menu portals it beside its target menu', () => {
  const { portal, storyRoot, characterTrigger, lookTrigger, lookMenu } = library();
  portal.toggleTarget(characterTrigger);
  assert.equal(portal.openAppearance(lookTrigger), true);
  assert.equal(lookMenu.parentNode, storyRoot);
  assert.deepEqual(
    [lookMenu.classList.contains('is-portaled'), lookMenu.classList.contains('is-open')],
    [true, true],
  );
  assert.equal(lookMenu.getAttribute('aria-hidden'), 'false');
  assert.equal(lookTrigger.classList.contains('is-active'), true);
  assert.equal(lookTrigger.getAttribute('aria-expanded'), 'true');
  // 目标菜单右侧 300 + 10，顶部对齐触发按钮 200
  assert.deepEqual([lookMenu.style.left, lookMenu.style.top], ['310px', '200px']);
});

test('appearance menus flip to the left when the right side is too narrow', () => {
  const { portal, characterTrigger, characterMenu, lookTrigger, lookMenu } = library();
  portal.toggleTarget(characterTrigger);
  characterMenu.rect = rect(720, 150, 180, 200);
  lookTrigger.rect = rect(730, 790, 150, 30);
  portal.openAppearance(lookTrigger);
  // 右侧 910 + 160 > 984，改放左侧 720 - 160 - 10；顶部夹到 800 - 16 - 120
  assert.deepEqual([lookMenu.style.left, lookMenu.style.top], ['550px', '664px']);
});

test('closing appearances restores the menu into its target menu', () => {
  const { portal, characterTrigger, characterMenu, lookTrigger, lookMenu } = library();
  portal.toggleTarget(characterTrigger);
  portal.openAppearance(lookTrigger);
  portal.closeAppearance();
  assert.equal(lookMenu.parentNode, characterMenu);
  assert.deepEqual(
    [lookMenu.classList.contains('is-portaled'), lookMenu.classList.contains('is-open')],
    [false, false],
  );
  assert.equal(lookMenu.getAttribute('aria-hidden'), 'true');
  assert.equal(lookTrigger.getAttribute('aria-expanded'), 'false');
  assert.equal(characterMenu.classList.contains('is-open'), true);
});

test('appearance triggers need a target menu, an id and a matching menu', () => {
  const { doc, portal, characterMenu } = library();
  assert.equal(
    portal.openAppearance(h(doc, 'button', { 'data-story-library-appearance-target': 'look-1' })),
    false,
  );
  const missing = h(doc, 'button', { 'data-story-library-appearance-target': 'look-9' });
  characterMenu.append(missing);
  assert.equal(portal.openAppearance(missing), false);
  assert.equal(portal.openAppearance(undefined), false);
});

test('closing the target also closes its appearance menu', () => {
  const { portal, characterWrap, characterTrigger, characterMenu, lookTrigger, lookMenu } = library();
  portal.toggleTarget(characterTrigger);
  portal.openAppearance(lookTrigger);
  portal.closeTarget(characterWrap);
  assert.equal(lookMenu.parentNode, characterMenu);
  assert.equal(characterMenu.parentNode, characterWrap);
  assert.equal(lookMenu.classList.contains('is-open'), false);
  assert.equal(characterMenu.classList.contains('is-open'), false);
});

test('a menu whose home was removed is dropped instead of restored', () => {
  const { portal, characterWrap, characterTrigger, characterMenu } = library();
  portal.toggleTarget(characterTrigger);
  characterWrap.remove();
  portal.closeTarget();
  assert.equal(characterMenu.parentNode, null);
});

test('reposition and resize follow the latest geometry', () => {
  const { portal, win, characterWrap, characterTrigger, characterMenu } = library();
  portal.toggleTarget(characterTrigger);
  characterWrap.rect = rect(300, 50, 200, 40);
  portal.reposition();
  assert.deepEqual([characterMenu.style.left, characterMenu.style.top], ['320px', '100px']);
  const onResize = win.listeners[0].listener;
  win.innerWidth = 400;
  onResize();
  assert.equal(characterMenu.style.left, '204px');
  onResize();
  assert.deepEqual(win.cancelled, [1]);
  characterWrap.rect = rect(100, 100, 200, 40);
  win.runFrames();
  assert.equal(characterMenu.style.left, '120px');
});

test('destroy closes menus and removes listeners', () => {
  const { portal, win, storyRoot, characterWrap, characterTrigger, characterMenu } = library();
  portal.toggleTarget(characterTrigger);
  win.listeners[0].listener();
  portal.destroy();
  assert.equal(characterMenu.parentNode, characterWrap);
  assert.deepEqual(win.listeners, []);
  assert.deepEqual(storyRoot.listeners, []);
  assert.deepEqual(win.cancelled, [1]);
});
