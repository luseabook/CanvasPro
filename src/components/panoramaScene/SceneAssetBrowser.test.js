import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { createSceneAssetBrowser } from './SceneAssetBrowser.js';

const originalDocument = globalThis.document;

afterEach(() => {
  if (typeof originalDocument === 'undefined') delete globalThis.document;
  else globalThis.document = originalDocument;
});

function matchesSimple(element, selector) {
  return selector.split(',').some((part) => {
    const token = part.trim();
    if (!token) return false;
    if (token.startsWith('.')) {
      return String(element.className || '')
        .split(/\s+/)
        .includes(token.slice(1));
    }
    const attributeMatch = token.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
    if (attributeMatch) {
      const attributeName = attributeMatch[1];
      const datasetName = attributeName.startsWith('data-')
        ? attributeName.slice(5).replace(/-([a-z])/g, (_, character) => character.toUpperCase())
        : attributeName;
      const value = element.dataset?.[datasetName] ?? element.attributes?.[attributeName];
      return attributeMatch[2] === undefined ? value !== undefined : String(value) === attributeMatch[2];
    }
    return element.tagName === token.toLowerCase();
  });
}

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.className = '';
    this.dataset = {};
    this.children = [];
    this.events = new Map();
    this.options = [];
    this.value = '';
    this.hidden = false;
    this.attributes = {};
  }

  append(...nodes) {
    for (const node of nodes) this.appendChild(node);
  }

  appendChild(node) {
    node.parentNode = this;
    this.children.push(node);
    if (this.tagName === 'select' && node.tagName === 'option') this.options.push(node);
    return node;
  }

  addEventListener(type, handler) {
    if (!this.events.has(type)) this.events.set(type, []);
    this.events.get(type).push(handler);
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  replaceChildren(...nodes) {
    this.children = [];
    this.append(...nodes);
  }

  querySelectorAll(selector) {
    const matches = [];
    const visit = (element) => {
      for (const child of element.children) {
        if (matchesSimple(child, selector)) matches.push(child);
        visit(child);
      }
    };
    visit(this);
    return matches;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  closest(selector) {
    let node = this;
    while (node) {
      if (matchesSimple(node, selector)) return node;
      node = node.parentNode;
    }
    return null;
  }
}

test('SceneAssetBrowser: filters results and reports the selected asset', () => {
  globalThis.document = {
    createElement(tagName) {
      return new FakeElement(tagName);
    },
  };
  const selected = [];
  const browser = createSceneAssetBrowser({ onSelect: (assetId) => selected.push(assetId) });
  const results = browser.querySelector('.panorama-asset-browser__results');
  const search = browser.querySelector('.panorama-asset-browser__search');
  const empty = browser.querySelector('.panorama-asset-browser__empty');

  assert.ok(results.children.length > 0);
  assert.equal(empty.hidden, true);

  const first = results.children[0];
  results.events.get('click')[0]({ target: first });
  assert.deepEqual(selected, [first.dataset.assetId]);

  search.value = 'asset-that-does-not-exist-zz';
  search.events.get('input')[0]();
  assert.equal(results.children.length, 0);
  assert.equal(empty.hidden, false);
});

test('SceneAssetBrowser: creates localized category options and a search input', () => {
  globalThis.document = {
    createElement(tagName) {
      return new FakeElement(tagName);
    },
  };
  const browser = createSceneAssetBrowser();
  const category = browser.querySelector('.panorama-asset-browser__category');
  const search = browser.querySelector('.panorama-asset-browser__search');

  assert.equal(category.options[0].value, 'all');
  assert.ok(category.options.length > 1);
  assert.equal(search.tagName, 'input');
  assert.equal(search.attributes['aria-label']?.length > 0, true);
});
