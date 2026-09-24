import assert from 'node:assert/strict';
import test from 'node:test';
import { createContextMenuIcon } from './contextMenuIcon.js';
import { createContextMenuIcon as createContextMenuIconViaBarrel } from '../modules/interaction/contextMenuIcons.js';
import { CONTEXT_MENU_ICON_IDS, resolveContextMenuIconDefinition } from '../utils/contextMenuIconCatalog.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function createElementStub(tagName, namespaceURI, withDataset = true) {
  const attributes = new Map();
  const element = {
    tagName: tagName,
    namespaceURI: namespaceURI,
    attributes: attributes,
    children: [],
    setAttribute: (name, value) => {
      attributes.set(name, value);
    },
    appendChild: (child) => {
      element.children.push(child);
      return child;
    },
    attribute: (name) => (attributes.has(name) ? attributes.get(name) : null),
  };
  if (withDataset) element.dataset = {};
  return element;
}

function createDocumentStub({ withDataset = true } = {}) {
  const created = [];
  return {
    created: created,
    createElementNS: (namespaceURI, tagName) => {
      const element = createElementStub(tagName, namespaceURI, withDataset);
      created.push(element);
      return element;
    },
  };
}

function build(iconId, options = {}) {
  const documentObject = options.documentObject ?? createDocumentStub(options);
  const icon = createContextMenuIcon(iconId, { ...options, documentObject: documentObject });
  return { documentObject: documentObject, icon: icon };
}

test('the interaction barrel re-exports the very same factory', () => {
  assert.equal(createContextMenuIconViaBarrel, createContextMenuIcon);
});

test('a missing DOM answers null instead of throwing', () => {
  assert.equal(createContextMenuIcon('comment', { documentObject: {} }), null);
  assert.equal(createContextMenuIcon('comment', { documentObject: { createElementNS: null } }), null);
  assert.equal(createContextMenuIcon('comment', { documentObject: { createElementNS: 'nope' } }), null);
});

test('an unknown icon answers null without creating any element', () => {
  const { documentObject, icon } = build('no-such-icon');
  assert.equal(icon, null);
  assert.equal(documentObject.created.length, 0);
});

test('a resolvable icon builds an <svg> in the SVG namespace', () => {
  const { documentObject, icon } = build('comment');
  assert.equal(icon, documentObject.created[0]);
  assert.equal(icon.tagName, 'svg');
  assert.equal(icon.namespaceURI, SVG_NS);
});

test('the root svg carries the fixed presentation attributes', () => {
  const { icon } = build('comment');
  assert.equal(icon.attribute('viewBox'), '0 0 24 24');
  assert.equal(icon.attribute('fill'), 'none');
  assert.equal(icon.attribute('stroke-width'), '1.8');
  assert.equal(icon.attribute('stroke-linecap'), 'round');
  assert.equal(icon.attribute('stroke-linejoin'), 'round');
  assert.equal(icon.attribute('aria-hidden'), 'true');
});

test('size defaults to 18 and is applied to both axes as a string', () => {
  const { icon } = build('comment');
  assert.equal(icon.attribute('width'), '18');
  assert.equal(icon.attribute('height'), '18');
  const { icon: sized } = build('comment', { size: 16 });
  assert.equal(sized.attribute('width'), '16');
  assert.equal(sized.attribute('height'), '16');
  const { icon: zeroSized } = build('comment', { size: 0 });
  assert.equal(zeroSized.attribute('width'), '0');
});

test('stroke defaults to currentColor and can be overridden', () => {
  assert.equal(build('comment').icon.attribute('stroke'), 'currentColor');
  assert.equal(build('comment', { stroke: '#ff0000' }).icon.attribute('stroke'), '#ff0000');
});

test('the resolved id is stamped on both the attribute and the dataset', () => {
  const { icon } = build('comment');
  assert.equal(icon.attribute('data-context-menu-icon'), 'comment');
  assert.equal(icon.dataset.contextMenuIcon, 'comment');
  const { icon: aliased } = build('remove');
  assert.equal(aliased.attribute('data-context-menu-icon'), 'delete');
  assert.equal(aliased.dataset.contextMenuIcon, 'delete');
});

test('a document without dataset support still yields the attribute', () => {
  const { icon } = build('comment', { withDataset: false });
  assert.equal(icon.dataset, undefined);
  assert.equal(icon.attribute('data-context-menu-icon'), 'comment');
});

test('every shape becomes a namespaced child element in order', () => {
  const { documentObject, icon } = build('comment');
  assert.equal(icon.children.length, 2);
  assert.equal(documentObject.created.length, 3);
  assert.deepEqual(
    icon.children.map((child) => child.tagName),
    ['path', 'path'],
  );
  for (const child of icon.children) assert.equal(child.namespaceURI, SVG_NS);
  assert.equal(
    icon.children[0].attribute('d'),
    'M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-5 3V11.5A7.5 7.5 0 0 1 10.5 4h2a7.5 7.5 0 0 1 7.5 7.5Z',
  );
  assert.equal(icon.children[1].attribute('d'), 'M7 10h9M7 14h6');
});

test('numeric shape attributes reach the DOM as strings', () => {
  const { icon } = build('action');
  const [circle, path] = icon.children;
  assert.equal(circle.tagName, 'circle');
  assert.equal(circle.attribute('cx'), '12');
  assert.equal(circle.attribute('cy'), '12');
  assert.equal(circle.attribute('r'), '8.5');
  assert.equal(path.tagName, 'path');
  assert.equal(path.attribute('d'), 'M8.5 12h7M13 9.5l2.5 2.5-2.5 2.5');
});

test('multi-attribute shapes keep every declared key', () => {
  const { icon } = build('grid');
  assert.equal(icon.children.length, 2);
  const rect = icon.children[0];
  assert.equal(rect.tagName, 'rect');
  assert.deepEqual([...rect.attributes.keys()].sort(), ['height', 'rx', 'width', 'x', 'y']);
  assert.equal(rect.attribute('x'), '3');
  assert.equal(rect.attribute('width'), '18');
  assert.equal(rect.attribute('rx'), '2');
});

test('every advertised icon renders one child per declared shape', () => {
  assert.equal(CONTEXT_MENU_ICON_IDS.length, 40);
  for (const iconId of CONTEXT_MENU_ICON_IDS) {
    const { icon } = build(iconId);
    const definition = resolveContextMenuIconDefinition(iconId);
    assert.equal(icon.children.length, definition.shapes.length, iconId);
    assert.deepEqual(
      icon.children.map((child) => child.tagName),
      definition.shapes.map(([tag]) => tag),
      iconId,
    );
    assert.equal(icon.attribute('data-context-menu-icon'), definition.id, iconId);
  }
});

test('the built icon is a fresh tree on every call', () => {
  const first = build('comment').icon;
  const second = build('comment').icon;
  assert.notEqual(first, second);
  assert.notEqual(first.children[0], second.children[0]);
  assert.equal(first.attribute('data-context-menu-icon'), 'comment');
  assert.equal(second.attribute('data-context-menu-icon'), 'comment');
});
