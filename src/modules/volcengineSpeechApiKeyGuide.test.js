import test from 'node:test';
import assert from 'node:assert/strict';

import {
  VOLCENGINE_SPEECH_API_KEY_CONSOLE_URL,
  VOLCENGINE_SPEECH_API_KEY_GUIDE_IMAGE,
  bindVolcengineSpeechApiKeyGuideTriggers,
  closeVolcengineSpeechApiKeyGuide,
  showVolcengineSpeechApiKeyGuide,
} from './volcengineSpeechApiKeyGuide.js';

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
        const handlers = listeners.get(type) || [];
        handlers.push(handler);
        listeners.set(type, handlers);
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
          selector === '[data-volcengine-speech-api-key-guide-action]' &&
          element.dataset.volcengineSpeechApiKeyGuideAction
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
      const handlers = documentListeners.get(type) || [];
      handlers.push(handler);
      documentListeners.set(type, handlers);
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

test('volcengineSpeechApiKeyGuide: exposes the official console URL and guide image', () => {
  assert.equal(
    VOLCENGINE_SPEECH_API_KEY_CONSOLE_URL,
    'https://console.volcengine.com/speech/new/setting/apikeys?',
  );
  assert.equal(
    VOLCENGINE_SPEECH_API_KEY_GUIDE_IMAGE,
    'images/volcengine-speech-api-key-guide.svg',
  );
});

test('volcengineSpeechApiKeyGuide: opens a modal and closes it by backdrop or Escape', (t) => {
  const fakeDocument = createFakeDocument();
  const previousDocument = globalThis.document;
  globalThis.document = fakeDocument;
  t.after(() => {
    globalThis.document = previousDocument;
  });

  showVolcengineSpeechApiKeyGuide();
  const backdrop = fakeDocument.getElementById('audio-voice-api-key-guide-backdrop');
  const dialog = fakeDocument.getElementById('audio-voice-api-key-guide');
  assert.ok(backdrop);
  assert.ok(dialog);
  assert.equal(backdrop.classList.contains('open'), true);
  assert.equal(dialog.classList.contains('open'), true);
  assert.equal(dialog.getAttribute('role'), 'dialog');
  assert.equal(dialog.getAttribute('aria-modal'), 'true');
  assert.equal(
    collectElements(dialog).some(
      (element) => element.dataset.volcengineSpeechApiKeyGuideAction === 'open-console',
    ),
    true,
  );

  backdrop.listeners.get('click')[0]({});
  assert.equal(fakeDocument.getElementById('audio-voice-api-key-guide'), null);

  showVolcengineSpeechApiKeyGuide();
  fakeDocument.emit('keydown', {
    key: 'Escape',
    preventDefault() {},
  });
  assert.equal(fakeDocument.getElementById('audio-voice-api-key-guide'), null);
  closeVolcengineSpeechApiKeyGuide();
});

test('volcengineSpeechApiKeyGuide: triggers bind once and open the guide', (t) => {
  const fakeDocument = createFakeDocument();
  const previousDocument = globalThis.document;
  globalThis.document = fakeDocument;
  t.after(() => {
    globalThis.document = previousDocument;
  });

  const trigger = fakeDocument.createElement('button');
  trigger.dataset.volcengineSpeechApiKeyGuideTrigger = '';
  const root = {
    querySelectorAll: () => [trigger],
  };
  let prevented = 0;

  bindVolcengineSpeechApiKeyGuideTriggers(root);
  bindVolcengineSpeechApiKeyGuideTriggers(root);
  assert.equal(trigger.dataset.volcengineSpeechApiKeyGuideBound, '1');
  assert.equal(trigger.listeners.get('click').length, 1);
  trigger.listeners.get('click')[0]({
    preventDefault() {
      prevented += 1;
    },
  });
  assert.equal(prevented, 1);
  assert.ok(fakeDocument.getElementById('audio-voice-api-key-guide'));
});
