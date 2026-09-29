import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PROVIDER_API_KEY_GUIDES,
  bindProviderApiKeyGuideTriggers,
  closeProviderApiKeyGuide,
  showProviderApiKeyGuide,
} from './providerApiKeyGuide.js';

function createFakeDocument() {
  const byId = new Map();
  const createElement = (tagName = 'div') => {
    const listeners = new Map();
    const attributes = new Map();
    const classNames = new Set();
    const element = {
      tagName: String(tagName).toUpperCase(),
      children: [],
      childNodes: [],
      dataset: {},
      style: {},
      listeners,
      attributes,
      classList: {
        add: (...names) => names.forEach((name) => classNames.add(name)),
        remove: (...names) => names.forEach((name) => classNames.delete(name)),
        contains: (name) => classNames.has(name),
      },
      append(...nodes) {
        for (const node of nodes) this.appendChild(node);
      },
      appendChild(node) {
        node.parent = this;
        this.children.push(node);
        this.childNodes.push(node);
        if (node.id) byId.set(node.id, node);
      },
      setAttribute(name, value) {
        attributes.set(name, String(value));
      },
      getAttribute(name) {
        return attributes.get(name) ?? null;
      },
      addEventListener(type, handler) {
        listeners.set(type, [...(listeners.get(type) || []), handler]);
      },
      removeEventListener(type, handler) {
        listeners.set(type, (listeners.get(type) || []).filter((entry) => entry !== handler));
      },
      remove() {
        if (element.parent) {
          element.parent.children = element.parent.children.filter((node) => node !== element);
          element.parent.childNodes = element.parent.childNodes.filter((node) => node !== element);
        }
        if (element.id) byId.delete(element.id);
      },
      focus() {},
      closest(selector) {
        if (
          selector === '[data-provider-api-key-guide-action]' &&
          element.dataset.providerApiKeyGuideAction
        ) {
          return element;
        }
        return element.parent?.closest(selector) || null;
      },
    };
    Object.defineProperty(element, 'id', {
      get: () => attributes.get('id') || '',
      set: (value) => {
        const normalized = String(value || '');
        attributes.set('id', normalized);
        if (normalized) byId.set(normalized, element);
      },
    });
    return element;
  };

  const documentListeners = new Map();
  const body = createElement('body');
  body.id = '__body__';
  return {
    body,
    createElement,
    getElementById: (id) => byId.get(String(id)) || null,
    addEventListener(type, handler) {
      documentListeners.set(type, [...(documentListeners.get(type) || []), handler]);
    },
    removeEventListener(type, handler) {
      documentListeners.set(type, (documentListeners.get(type) || []).filter((entry) => entry !== handler));
    },
    emit(type, event = {}) {
      for (const handler of documentListeners.get(type) || []) handler(event);
    },
  };
}

function collectElements(root, result = []) {
  result.push(root);
  for (const child of root.children || []) collectElements(child, result);
  return result;
}

test('providerApiKeyGuide: ships immutable provider-specific guide metadata', () => {
  assert.deepEqual(Object.keys(PROVIDER_API_KEY_GUIDES), [
    'apimart',
    'agnes',
    'agnes-domestic',
    'volcengine',
    'grsai',
  ]);
  assert.deepEqual(PROVIDER_API_KEY_GUIDES.apimart.inputIds, ['providerKey-apimart']);
  assert.equal(PROVIDER_API_KEY_GUIDES.apimart.imageWidth, 960);
  assert.equal(PROVIDER_API_KEY_GUIDES.apimart.imageHeight, 2100);
  assert.equal(Object.isFrozen(PROVIDER_API_KEY_GUIDES), true);
  assert.equal(Object.isFrozen(PROVIDER_API_KEY_GUIDES.apimart), true);
});

test('providerApiKeyGuide: opens a configured guide and closes by backdrop or Escape', (t) => {
  const fakeDocument = createFakeDocument();
  const previousDocument = globalThis.document;
  globalThis.document = fakeDocument;
  t.after(() => {
    globalThis.document = previousDocument;
  });

  showProviderApiKeyGuide('missing-provider');
  assert.equal(fakeDocument.getElementById('provider-api-key-guide'), null);

  showProviderApiKeyGuide('apimart');
  const dialog = fakeDocument.getElementById('provider-api-key-guide');
  const backdrop = fakeDocument.getElementById('provider-api-key-guide-backdrop');
  assert.ok(dialog);
  assert.ok(backdrop);
  assert.equal(dialog.getAttribute('role'), 'dialog');
  assert.equal(dialog.classList.contains('open'), true);
  const image = collectElements(dialog).find((element) => element.tagName === 'IMG');
  assert.equal(image.src, PROVIDER_API_KEY_GUIDES.apimart.guideImage);
  assert.equal(image.width, PROVIDER_API_KEY_GUIDES.apimart.imageWidth);
  assert.equal(image.height, PROVIDER_API_KEY_GUIDES.apimart.imageHeight);
  assert.equal(
    collectElements(dialog).some(
      (element) => element.dataset.providerApiKeyGuideAction === 'open-console',
    ),
    true,
  );

  backdrop.listeners.get('click')[0]({});
  assert.equal(fakeDocument.getElementById('provider-api-key-guide'), null);
  showProviderApiKeyGuide('grsai');
  fakeDocument.emit('keydown', { key: 'Escape', preventDefault() {} });
  assert.equal(fakeDocument.getElementById('provider-api-key-guide'), null);
  closeProviderApiKeyGuide();
});

test('providerApiKeyGuide: triggers bind once and select the requested provider', (t) => {
  const fakeDocument = createFakeDocument();
  const previousDocument = globalThis.document;
  globalThis.document = fakeDocument;
  t.after(() => {
    globalThis.document = previousDocument;
  });

  const trigger = fakeDocument.createElement('button');
  trigger.dataset.providerApiKeyGuideTrigger = 'grsai';
  const root = { querySelectorAll: () => [trigger] };
  let prevented = 0;
  bindProviderApiKeyGuideTriggers(root);
  bindProviderApiKeyGuideTriggers(root);
  assert.equal(trigger.dataset.providerApiKeyGuideBound, '1');
  assert.equal(trigger.listeners.get('click').length, 1);
  trigger.listeners.get('click')[0]({
    preventDefault() {
      prevented += 1;
    },
  });
  assert.equal(prevented, 1);
  const dialog = fakeDocument.getElementById('provider-api-key-guide');
  const image = collectElements(dialog).find((element) => element.tagName === 'IMG');
  assert.equal(image.src, PROVIDER_API_KEY_GUIDES.grsai.guideImage);
});
