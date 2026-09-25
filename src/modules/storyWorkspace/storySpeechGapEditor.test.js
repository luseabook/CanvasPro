import test from 'node:test';
import assert from 'node:assert/strict';
import { mountStorySpeechGapEditor } from './storySpeechGapEditor.js';

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

const nextMicrotask = () => new Promise((resolve) => queueMicrotask(resolve));

function editorWithText(...children) {
  const doc = new FakeDocument();
  const editor = h(
    doc,
    'div',
    { contenteditable: 'true' },
    children.map((child) => child(doc)),
  );
  editor.focusCount = 0;
  editor.focus = () => (editor.focusCount += 1);
  doc.documentElement.append(editor);
  return { doc, editor };
}

const describe = (node) =>
  node.nodeType === 3
    ? node.nodeValue
    : `<${node.className || node.tagName.toLowerCase()}:${node.textContent}>`;

test('gap markers in editor text become clickable chips after a microtask', async () => {
  const { editor } = editorWithText(
    (doc) => doc.createTextNode('第一句[听不清]然后【听不清】结束'),
    (doc) => h(doc, 'p', {}, ['[无法听清]']),
  );
  mountStorySpeechGapEditor(editor);
  assert.equal(editor.childNodes.length, 2);
  await nextMicrotask();
  assert.deepEqual(editor.childNodes.slice(0, 5).map(describe), [
    '第一句',
    '<story-speech-gap:[听不清]>',
    '然后',
    '<story-speech-gap:【听不清】>',
    '结束',
  ]);
  // 端口行为：标记前后没有文字时也会插入空文本节点
  assert.deepEqual(editor.childNodes[5].childNodes.map(describe), ['', '<story-speech-gap:[无法听清]>', '']);
  const chip = editor.childNodes[1];
  assert.equal(chip.contentEditable, 'false');
  assert.equal(chip.tabIndex, 0);
  assert.equal(chip.getAttribute('role'), 'button');
  assert.equal(chip.getAttribute('aria-label'), '听不清，点击后输入台词');
  assert.equal(chip.getAttribute('data-tooltip'), '点击后直接输入台词，替换听不清的部分');
});

test('reference pills, existing chips and form fields are left alone', async () => {
  const { editor } = editorWithText(
    (doc) => h(doc, 'span', { class: 'ref-pill' }, ['[听不清]']),
    (doc) => h(doc, 'textarea', {}, ['[听不清]']),
    (doc) => doc.createTextNode('尾巴[听不清]'),
  );
  mountStorySpeechGapEditor(editor);
  await nextMicrotask();
  mountStorySpeechGapEditor(editor);
  await nextMicrotask();
  assert.deepEqual(editor.childNodes.map(describe), [
    '<ref-pill:[听不清]>',
    '<textarea:[听不清]>',
    '尾巴',
    '<story-speech-gap:[听不清]>',
    '',
  ]);
  assert.equal(editor.querySelectorAll('.story-speech-gap').length, 1);
  assert.equal(editor.querySelectorAll('.ref-pill .story-speech-gap, textarea .story-speech-gap').length, 0);
});

test('mounting twice decorates new text but attaches listeners once', async () => {
  const { doc, editor } = editorWithText((doc) => doc.createTextNode('无标记'));
  mountStorySpeechGapEditor(editor);
  mountStorySpeechGapEditor(editor);
  assert.deepEqual(
    editor.listeners.map((entry) => [entry.type, entry.capture]),
    [
      ['click', true],
      ['keydown', true],
    ],
  );
  await nextMicrotask();
  editor.append(doc.createTextNode('新句[听不清]'));
  mountStorySpeechGapEditor(editor);
  await nextMicrotask();
  assert.equal(editor.querySelectorAll('.story-speech-gap').length, 1);
  assert.equal(editor.listeners.length, 2);
  assert.equal(mountStorySpeechGapEditor(null), undefined);
});

test('detached editors are not decorated', async () => {
  const doc = new FakeDocument();
  const editor = h(doc, 'div', { contenteditable: 'true' }, ['[听不清]']);
  mountStorySpeechGapEditor(editor);
  await nextMicrotask();
  assert.deepEqual(editor.childNodes.map(describe), ['[听不清]']);
});

test('clicking a chip selects it for typing when the editor is editable', async () => {
  const { doc, editor } = editorWithText((doc) => doc.createTextNode('他说[听不清]'));
  mountStorySpeechGapEditor(editor);
  await nextMicrotask();
  const chip = editor.querySelector('.story-speech-gap');
  const click = fire(editor, 'click', { target: chip });
  assert.equal(click.defaultPrevented, true);
  assert.equal(click.propagationStopped, true);
  assert.equal(editor.focusCount, 1);
  assert.equal(doc.selection.ranges.length, 1);
  assert.equal(doc.selection.ranges[0].selectedNode, chip);
  const enter = fire(editor, 'keydown', { key: 'Enter', target: chip });
  const space = fire(editor, 'keydown', { key: ' ', target: chip });
  assert.deepEqual([enter.defaultPrevented, space.defaultPrevented], [true, true]);
  assert.equal(doc.selection.ranges.length, 1);
});

test('chip activation is ignored for other keys, other targets or read-only editors', async () => {
  const { doc, editor } = editorWithText((doc) => doc.createTextNode('他说[听不清]'));
  mountStorySpeechGapEditor(editor);
  await nextMicrotask();
  const chip = editor.querySelector('.story-speech-gap');
  const other = editorWithText((d) => h(d, 'span', { class: 'story-speech-gap' }, ['[听不清]']));
  const ignored = [
    fire(editor, 'keydown', { key: 'a', target: chip }),
    fire(editor, 'click', { target: editor.childNodes[0] }),
    fire(editor, 'click', { target: other.editor.childNodes[0] }),
    fire(editor, 'click', { target: editor }),
  ];
  editor.setAttribute('contenteditable', 'false');
  ignored.push(fire(editor, 'click', { target: chip }));
  assert.ok(ignored.every((event) => !event.defaultPrevented));
  assert.equal(editor.focusCount, 0);
  assert.deepEqual(doc.selection.ranges, []);
});
