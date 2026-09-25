import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findStoryClipCardShell,
  syncSelectedClipVideoMetadataInPlace,
  syncStoryClipCardVideoInPlace,
} from './storyClipVideoResultDom.js';

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

function clipBoard() {
  const doc = new FakeDocument();
  const copyOne = h(doc, 'span', { class: 'story-clip-card-copy' }, ['片段一']);
  const cardOne = h(doc, 'div', { class: 'story-clip-card' }, [copyOne]);
  const shellOne = h(doc, 'div', { class: 'story-clip-card-shell', 'data-story-clip-id': ' clip-1 ' }, [
    cardOne,
  ]);
  const oldMedia = h(doc, 'span', { class: 'story-clip-card-media' });
  oldMedia.innerHTML = '<img src="old.jpg">';
  const cardTwo = h(doc, 'div', { class: 'story-clip-card has-video-thumbnail' }, [
    oldMedia,
    h(doc, 'span', { class: 'story-clip-card-copy' }, ['片段二']),
  ]);
  const shellTwo = h(doc, 'div', { class: 'story-clip-card-shell', 'data-story-clip-id': 'clip-2' }, [
    cardTwo,
  ]);
  const shellEmpty = h(doc, 'div', { class: 'story-clip-card-shell', 'data-story-clip-id': 'clip-3' });
  const cardNoCopy = h(doc, 'div', { class: 'story-clip-card' });
  const shellNoCopy = h(doc, 'div', { class: 'story-clip-card-shell', 'data-story-clip-id': 'clip-4' }, [
    cardNoCopy,
  ]);
  const root = h(doc, 'div', {}, [shellOne, shellTwo, shellEmpty, shellNoCopy]);
  doc.documentElement.append(root);
  return { doc, root, shellOne, cardOne, copyOne, shellTwo, cardTwo, oldMedia, cardNoCopy };
}

test('clip card shells are found by trimmed clip id', () => {
  const { root, shellOne, shellTwo } = clipBoard();
  assert.equal(findStoryClipCardShell(root, 'clip-1'), shellOne);
  assert.equal(findStoryClipCardShell(root, ' clip-2 '), shellTwo);
  assert.equal(findStoryClipCardShell(root, 'clip-9'), null);
  assert.equal(findStoryClipCardShell(null, 'clip-1'), null);
  assert.equal(findStoryClipCardShell({}, 'clip-1'), null);
});

test('syncing a clip card records whether it has more than one video result', () => {
  const { doc, root, shellOne, cardTwo, oldMedia } = clipBoard();
  const sync = (clipId, resultCount) =>
    syncStoryClipCardVideoInPlace({ root, documentObject: doc, clipId, resultCount });
  assert.equal(sync('clip-9', 2), false);
  assert.equal(sync('clip-3', 2), false);
  assert.equal(sync('clip-1', 2), true);
  assert.equal(shellOne.dataset.storyVideoHistory, 'true');
  assert.equal(sync('clip-1', '1'), true);
  assert.equal(shellOne.dataset.storyVideoHistory, 'false');
  assert.equal(sync('clip-2', undefined), true);
  assert.equal(cardTwo.querySelector('.story-clip-card-media'), oldMedia);
  assert.equal(oldMedia.innerHTML, '<img src="old.jpg">');
});

test('refreshing inserts a media slot before the copy or reuses the existing one', () => {
  const { doc, root, cardOne, copyOne, cardTwo, oldMedia } = clipBoard();
  const refresh = (clipId, thumbnailMarkup) =>
    syncStoryClipCardVideoInPlace({
      root,
      documentObject: doc,
      clipId,
      resultCount: 1,
      refreshThumbnail: true,
      thumbnailMarkup,
    });
  assert.equal(refresh('clip-1', '<img src="new.jpg">'), true);
  const media = cardOne.childNodes[0];
  assert.deepEqual(cardOne.childNodes, [media, copyOne]);
  assert.equal(media.className, 'story-clip-card-media');
  assert.equal(media.getAttribute('aria-hidden'), 'true');
  assert.equal(media.innerHTML, '<img src="new.jpg">');
  assert.equal(cardOne.classList.contains('has-video-thumbnail'), true);
  assert.equal(refresh('clip-2', '<img src="v2.jpg">'), true);
  assert.equal(cardTwo.querySelector('.story-clip-card-media'), oldMedia);
  assert.equal(oldMedia.innerHTML, '<img src="v2.jpg">');
});

test('refreshing without markup removes the media slot', () => {
  const { doc, root, cardTwo, oldMedia } = clipBoard();
  const done = syncStoryClipCardVideoInPlace({
    root,
    documentObject: doc,
    clipId: 'clip-2',
    resultCount: 3,
    refreshThumbnail: true,
  });
  assert.equal(done, true);
  assert.equal(oldMedia.parentNode, null);
  assert.equal(cardTwo.querySelector('.story-clip-card-media'), null);
  assert.equal(cardTwo.classList.contains('has-video-thumbnail'), false);
});

test('a card without a copy element gets the class but not the new media slot', () => {
  // 端口行为：找不到 .story-clip-card-copy 时新建的媒体节点不会挂进卡片，但仍会加 has-video-thumbnail
  const { doc, root, cardNoCopy } = clipBoard();
  const done = syncStoryClipCardVideoInPlace({
    root,
    documentObject: doc,
    clipId: 'clip-4',
    resultCount: 1,
    refreshThumbnail: true,
    thumbnailMarkup: '<img>',
  });
  assert.equal(done, true);
  assert.deepEqual(cardNoCopy.childNodes, []);
  assert.equal(cardNoCopy.classList.contains('has-video-thumbnail'), true);
});

function videoResult() {
  const doc = new FakeDocument();
  const metaText = h(doc, 'span', {}, ['1/3']);
  const buttons = [
    h(doc, 'button', { class: 'story-video-result-switch', 'data-story-video-result-index': '0' }),
    h(doc, 'button', { class: 'story-video-result-switch', 'data-story-video-result-index': '0' }),
  ];
  const result = h(doc, 'div', { class: 'story-video-result', 'data-story-video-result-index': '0' }, [
    h(doc, 'video', { 'data-story-video-result-index': '0' }),
    h(doc, 'div', { class: 'story-video-result-meta' }, [metaText]),
    ...buttons,
  ]);
  const root = h(doc, 'section', {}, [result]);
  doc.documentElement.append(root);
  return { root, result, metaText, buttons };
}

test('the selected video result index and counter are updated in place', () => {
  const { root, result, metaText, buttons } = videoResult();
  assert.equal(syncSelectedClipVideoMetadataInPlace(root, 1, 3), true);
  assert.equal(result.dataset.storyVideoResultIndex, '1');
  assert.deepEqual(
    result
      .querySelectorAll('[data-story-video-result-index]')
      .map((node) => node.dataset.storyVideoResultIndex),
    ['1', '1', '1'],
  );
  assert.equal(metaText.textContent, '2/3');
  assert.ok(buttons.every((button) => button.parentNode === result));
});

test('a single remaining result drops the switch buttons', () => {
  const { root, result, metaText } = videoResult();
  assert.equal(syncSelectedClipVideoMetadataInPlace(root, 0, 'x'), true);
  assert.equal(metaText.textContent, '1/1');
  assert.deepEqual(result.querySelectorAll('.story-video-result-switch'), []);
  assert.equal(syncSelectedClipVideoMetadataInPlace(null, 0, 1), false);
  assert.equal(syncSelectedClipVideoMetadataInPlace(videoResult().result, 0, 1), false);
});

test('the result index must be a number', () => {
  // 端口行为：计数文字直接做 index + 1，传字符串会拼接成「11/3」
  const { root, metaText } = videoResult();
  syncSelectedClipVideoMetadataInPlace(root, '1', 3);
  assert.equal(metaText.textContent, '11/3');
});
