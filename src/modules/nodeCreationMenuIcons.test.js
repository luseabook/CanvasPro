import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNodeCreationMenuIcon } from './nodeCreationMenuIcons.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const ICON_ALIASES = {
  'source-text': 'ai-text',
  'source-image': 'ai-image',
  'source-video': 'ai-video',
  'source-audio': 'ai-audio',
  'panorama-360': 'panorama-scene',
};

const ICON_SHAPE_COUNTS = {
  'ai-text': 2,
  'ai-image': 3,
  'ai-video': 2,
  'ai-audio': 3,
  'comment-note': 2,
  'panorama-scene': 2,
  storyboard: 2,
  'storyboard-script': 2,
  collage: 2,
  whiteboard: 2,
  'web-preview': 2,
  'media-clip': 1,
  debug: 1,
  'section-generation': 1,
  'section-source': 1,
  'section-function': 4,
  'add-node': 2,
  upload: 1,
  paste: 2,
  undo: 1,
  redo: 1,
};

function makeDocument(over = {}) {
  const created = [];
  const log = [];
  function makeElement(namespace, tagName) {
    return {
      namespace,
      tagName,
      attributes: {},
      raw: {},
      children: [],
      dataset: {},
      setAttribute(name, value) {
        log.push({ type: 'attribute', tagName, name, value, valueType: typeof value });
        this.attributes[name] = String(value);
        this.raw[name] = value;
      },
      appendChild(child) {
        log.push({ type: 'append', tagName, child: child.tagName });
        this.children.push(child);
        return child;
      },
    };
  }
  const documentObject = {
    createElementNS:
      'createElementNS' in over
        ? over.createElementNS
        : (namespace, tagName) => {
            const element = makeElement(namespace, tagName);
            created.push(element);
            return element;
          },
  };
  return { documentObject, created, log };
}

function shapeSummary(element) {
  return [element.tagName, element.attributes];
}

test('returns null when no document object can create svg elements', () => {
  assert.equal(createNodeCreationMenuIcon('ai-text'), null);
  assert.equal(createNodeCreationMenuIcon('ai-text', {}), null);
  assert.equal(createNodeCreationMenuIcon('ai-text', { documentObject: undefined }), null);
  assert.equal(createNodeCreationMenuIcon('ai-text', { documentObject: null }), null);
  assert.equal(createNodeCreationMenuIcon('ai-text', { documentObject: {} }), null);
  assert.equal(createNodeCreationMenuIcon('ai-text', { documentObject: { createElementNS: 'nope' } }), null);
});

test('returns null for unknown, blank or non-string icon names', () => {
  const { documentObject, created } = makeDocument();
  for (const name of ['unknown', '', '   ', 'ai-text ', 'AI-TEXT', undefined, null, 0, false, NaN]) {
    assert.equal(createNodeCreationMenuIcon(name, { documentObject }), null, String(name));
  }
  assert.equal(created.length, 0);
});

test('does not resolve inherited object keys into icons', () => {
  const { documentObject, created } = makeDocument();
  for (const name of ['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf']) {
    assert.equal(createNodeCreationMenuIcon(name, { documentObject }), null, name);
  }
  assert.equal(created.length, 0);
});

test('builds the root svg with the shared presentation attributes', () => {
  const { documentObject, created } = makeDocument();
  const svg = createNodeCreationMenuIcon('ai-text', { documentObject });
  assert.equal(created.length, 3);
  assert.equal(created[0], svg);
  assert.equal(svg.namespace, SVG_NS);
  assert.equal(svg.tagName, 'svg');
  assert.deepEqual(svg.attributes, {
    width: '18',
    height: '18',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.8',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
  });
  assert.equal(svg.dataset.nodeCreationIcon, 'ai-text');
  assert.deepEqual(svg.children, created.slice(1));
});

test('honours a custom stroke colour', () => {
  const { documentObject } = makeDocument();
  const svg = createNodeCreationMenuIcon('upload', { documentObject, stroke: '#ff0000' });
  assert.equal(svg.attributes.stroke, '#ff0000');
  assert.equal(svg.raw.stroke, '#ff0000');
});

test('treats an explicitly undefined stroke as the default', () => {
  const { documentObject } = makeDocument();
  const svg = createNodeCreationMenuIcon('upload', { documentObject, stroke: undefined });
  assert.equal(svg.attributes.stroke, 'currentColor');
});

test('stringifies non-string stroke values', () => {
  const zero = createNodeCreationMenuIcon('upload', {
    documentObject: makeDocument().documentObject,
    stroke: 0,
  });
  assert.equal(zero.attributes.stroke, '0');
  const blank = createNodeCreationMenuIcon('upload', {
    documentObject: makeDocument().documentObject,
    stroke: '',
  });
  assert.equal(blank.attributes.stroke, '');
  const nil = createNodeCreationMenuIcon('upload', {
    documentObject: makeDocument().documentObject,
    stroke: null,
  });
  assert.equal(nil.attributes.stroke, 'null');
});

test('renders every shape of a multi-part icon in document order', () => {
  const { documentObject, created } = makeDocument();
  const svg = createNodeCreationMenuIcon('ai-image', { documentObject });
  assert.deepEqual(
    created.slice(1).map((element) => element.tagName),
    ['rect', 'circle', 'polyline'],
  );
  assert.deepEqual(svg.children, created.slice(1));
  const [rect, circle, polyline] = svg.children;
  assert.deepEqual(rect.attributes, { x: '3', y: '3', width: '18', height: '18', rx: '3' });
  assert.deepEqual(circle.attributes, {
    cx: '8.5',
    cy: '8.5',
    r: '1.5',
    fill: 'currentColor',
  });
  assert.deepEqual(polyline.attributes, { points: '21 15 16 10 5 21' });
});

test('creates every svg node inside the svg namespace', () => {
  const { documentObject, created } = makeDocument();
  createNodeCreationMenuIcon('ai-audio', { documentObject });
  assert.equal(created.length, 4);
  for (const element of created) assert.equal(element.namespace, SVG_NS);
});

test('stringifies every numeric shape attribute', () => {
  const { documentObject, log } = makeDocument();
  createNodeCreationMenuIcon('section-function', { documentObject });
  const shapeAttributes = log.filter((entry) => entry.type === 'attribute' && entry.tagName !== 'svg');
  assert.equal(shapeAttributes.length, 20);
  for (const entry of shapeAttributes) assert.equal(entry.valueType, 'string');
  assert.equal(shapeAttributes[0].name, 'x');
  assert.equal(shapeAttributes[0].value, '4');
  assert.equal(shapeAttributes[0].valueType, 'string');
});

test('sets shape attributes before appending the shape', () => {
  const { documentObject, log } = makeDocument();
  createNodeCreationMenuIcon('ai-video', { documentObject });
  const firstShapeAttribute = log.findIndex((entry) => entry.type === 'attribute' && entry.tagName !== 'svg');
  const firstAppend = log.findIndex((entry) => entry.type === 'append');
  assert.ok(firstShapeAttribute > 0);
  assert.ok(firstAppend > firstShapeAttribute);
  assert.deepEqual(
    log.filter((entry) => entry.type === 'append').map((entry) => entry.tagName),
    ['svg', 'svg'],
  );
});

test('resolves icon aliases to their canonical shapes', () => {
  for (const [alias, canonical] of Object.entries(ICON_ALIASES)) {
    const aliasDocument = makeDocument();
    const canonicalDocument = makeDocument();
    const aliasSvg = createNodeCreationMenuIcon(alias, {
      documentObject: aliasDocument.documentObject,
    });
    const canonicalSvg = createNodeCreationMenuIcon(canonical, {
      documentObject: canonicalDocument.documentObject,
    });
    assert.ok(aliasSvg, `expected an icon for ${alias}`);
    assert.ok(canonicalSvg, `expected an icon for ${canonical}`);
    assert.deepEqual(aliasSvg.children.map(shapeSummary), canonicalSvg.children.map(shapeSummary));
    assert.equal(aliasSvg.dataset.nodeCreationIcon, alias);
    assert.equal(canonicalSvg.dataset.nodeCreationIcon, canonical);
    assert.equal(aliasSvg.attributes.stroke, canonicalSvg.attributes.stroke);
  }
});

test('renders every catalogued icon with its documented shape count', () => {
  for (const [name, count] of Object.entries(ICON_SHAPE_COUNTS)) {
    const { documentObject } = makeDocument();
    const svg = createNodeCreationMenuIcon(name, { documentObject });
    assert.ok(svg, `expected an icon for ${name}`);
    assert.equal(svg.tagName, 'svg');
    assert.equal(svg.children.length, count, name);
    assert.equal(svg.dataset.nodeCreationIcon, name);
    assert.equal(svg.attributes['aria-hidden'], 'true');
  }
});

test('builds an independent element tree for every call', () => {
  const { documentObject } = makeDocument();
  const first = createNodeCreationMenuIcon('undo', { documentObject });
  const second = createNodeCreationMenuIcon('undo', { documentObject });
  assert.notEqual(first, second);
  assert.notEqual(first.children[0], second.children[0]);
  assert.deepEqual(first.children[0].attributes, second.children[0].attributes);
  assert.deepEqual(shapeSummary(first.children[0]), shapeSummary(second.children[0]));
});

test('uses the injected document object for every node', () => {
  const { documentObject, created } = makeDocument();
  const svg = createNodeCreationMenuIcon('redo', { documentObject });
  assert.equal(created.length, 2);
  assert.equal(created[0], svg);
  assert.equal(created[1].tagName, 'path');
  assert.equal(created[1].attributes.d, 'M15 7l5 5-5 5M20 12h-9a7 7 0 0 0-7 7');
  assert.equal(created[1].namespace, SVG_NS);
});
