import assert from 'node:assert/strict';
import test from 'node:test';
import {
  __setCustomPromptPresetsForTest,
  __setPromptPresetSettingsForTest,
  getDefaultQuickCapturePresetNodeType,
  getPromptPresetCollectionLabel,
  isPromptPresetNodeTypeSupported,
  loadPromptPresetSettings,
  openQuickCapturePromptPresetDraft,
  setDefaultQuickCapturePresetNodeType,
} from './promptPresets.js';

function createClassList() {
  const classes = new Set();
  return {
    classes: classes,
    toggle: (name, force) => {
      const shouldAdd = force === undefined ? !classes.has(name) : Boolean(force);
      shouldAdd ? classes.add(name) : classes.delete(name);
      return shouldAdd;
    },
    add: (name) => classes.add(name),
    remove: (name) => classes.delete(name),
    contains: (name) => classes.has(name),
  };
}

function createElementStub(tagName, namespaceURI = '') {
  const attributes = new Map();
  const listeners = new Map();
  const element = {
    tagName: tagName,
    namespaceURI: namespaceURI,
    attributes: attributes,
    listeners: listeners,
    children: [],
    dataset: {},
    style: {},
    className: '',
    textContent: '',
    innerHTML: '',
    value: '',
    type: '',
    placeholder: '',
    title: '',
    id: '',
    contentEditable: '',
    spellcheck: true,
    tabIndex: 0,
    scrollTop: 0,
    disabled: false,
    hidden: false,
    isConnected: true,
    removed: false,
    classList: createClassList(),
    setAttribute: (name, value) => attributes.set(name, String(value)),
    getAttribute: (name) => (attributes.has(name) ? attributes.get(name) : null),
    removeAttribute: (name) => attributes.delete(name),
    hasAttribute: (name) => attributes.has(name),
    appendChild: (child) => {
      element.children.push(child);
      if (child) child.parentNode = element;
      return child;
    },
    append: (...nodes) => nodes.forEach((node) => {
      element.children.push(node);
      if (node) node.parentNode = element;
    }),
    replaceChildren: (...nodes) => {
      element.children = nodes.slice();
      nodes.forEach((node) => {
        if (node) node.parentNode = element;
      });
    },
    insertBefore: (node, reference) => {
      const index = reference ? element.children.indexOf(reference) : -1;
      if (index >= 0) element.children.splice(index, 0, node);
      else element.children.push(node);
      if (node) node.parentNode = element;
      return node;
    },
    removeChild: (child) => {
      element.children = element.children.filter((candidate) => candidate !== child);
      if (child) child.parentNode = null;
      return child;
    },
    get childNodes() {
      return element.children;
    },
    get firstChild() {
      return element.children[0] || null;
    },
    get nextSibling() {
      const parent = element.parentNode;
      if (!parent || !Array.isArray(parent.children)) return null;
      const index = parent.children.indexOf(element);
      return index >= 0 ? parent.children[index + 1] || null : null;
    },
    remove: () => {
      element.removed = true;
      element.isConnected = false;
    },
    addEventListener: (type, handler) => {
      const handlers = listeners.get(type) || [];
      handlers.push(handler);
      listeners.set(type, handlers);
    },
    removeEventListener: () => {},
    dispatch: (type, payload = {}) => {
      const handlers = listeners.get(type) || [];
      return Promise.all(
        handlers.map((handler) =>
          handler({
            preventDefault: () => {},
            stopPropagation: () => {},
            ...payload,
          }),
        ),
      );
    },
    focus: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    contains: () => false,
    getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }),
    scrollIntoView: () => {},
    getRangeAt: () => ({ commonAncestorContainer: null }),
  };
  return element;
}

function installDocumentStub() {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;
  const created = [];
  const toasts = [];
  const body = createElementStub('body');
  body.remove = () => {};
  const documentStub = {
    created: created,
    body: body,
    createElement: (tagName) => {
      const element = createElementStub(tagName);
      created.push(element);
      return element;
    },
    createElementNS: (namespaceURI, tagName) => {
      const element = createElementStub(tagName, namespaceURI);
      created.push(element);
      return element;
    },
    createTextNode: (text) => ({ nodeType: 3, textContent: String(text), isConnected: true }),
    createRange: () => ({
      selectNodeContents: () => {},
      setStart: () => {},
      setEnd: () => {},
      collapse: () => {},
      deleteContents: () => {},
      insertNode: () => {},
      rangeCount: 1,
      getRangeAt: () => ({ commonAncestorContainer: null }),
      commonAncestorContainer: null,
    }),
    getSelection: () => ({ rangeCount: 0, removeAllRanges: () => {}, addRange: () => {} }),
  };
  globalThis.document = documentStub;
  globalThis.window = {
    showToast: (message, tone) => toasts.push({ message: message, tone: tone }),
  };
  return {
    created: created,
    toasts: toasts,
    documentStub: documentStub,
    restore: () => {
      globalThis.document = originalDocument;
      globalThis.window = originalWindow;
    },
  };
}

function installFailingFetchStub() {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('offline');
  };
  return () => {
    globalThis.fetch = originalFetch;
  };
}

function findElements(created, predicate) {
  return created.filter(predicate);
}

function hasClassToken(element, token) {
  return String(element.className || '')
    .split(/\s+/)
    .includes(token);
}

function buildDraftCase(initialDraftTemplate) {
  return openQuickCapturePromptPresetDraft(initialDraftTemplate);
}

test('only the four preset manager node types are accepted', () => {
  for (const nodeType of ['ai-image', 'ai-text', 'ai-video', 'ai-audio']) {
    assert.equal(isPromptPresetNodeTypeSupported(nodeType), true, nodeType);
    assert.equal(isPromptPresetNodeTypeSupported(`  ${nodeType}  `), true, nodeType);
  }
  for (const nodeType of ['', ' ', 'text', 'ai-', null, undefined, 42, {}, []]) {
    assert.equal(isPromptPresetNodeTypeSupported(nodeType), false, String(nodeType));
  }
});

test('collection labels resolve through the node type i18n keys', () => {
  const labels = ['ai-text', 'ai-image', 'ai-video', 'ai-audio'].map((nodeType) =>
    getPromptPresetCollectionLabel(nodeType),
  );
  assert.equal(new Set(labels).size, labels.length);
  for (const label of labels) assert.equal(typeof label, 'string');
  for (const label of labels) assert.notEqual(label.trim(), '');
  for (const nodeType of ['text', '', 'ai-sound', null, undefined]) {
    assert.equal(getPromptPresetCollectionLabel(nodeType), '');
  }
});

test('quick capture settings normalize to a supported node type or to empty', () => {
  __setPromptPresetSettingsForTest({ defaultQuickCaptureNodeType: 'ai-video' });
  assert.equal(getDefaultQuickCapturePresetNodeType(), 'ai-video');

  for (const nodeType of ['ai-image', 'ai-text', 'ai-audio']) {
    __setPromptPresetSettingsForTest({ defaultQuickCaptureNodeType: nodeType });
    assert.equal(getDefaultQuickCapturePresetNodeType(), nodeType);
  }

  for (const value of ['', '  ', 'text', 'ai-', null, undefined, 42, {}]) {
    __setPromptPresetSettingsForTest({ defaultQuickCaptureNodeType: value });
    assert.equal(getDefaultQuickCapturePresetNodeType(), '', String(value));
  }

  __setPromptPresetSettingsForTest({ defaultQuickCaptureNodeType: ['ai-text'] });
  assert.equal(getDefaultQuickCapturePresetNodeType(), 'ai-text');

  __setPromptPresetSettingsForTest();
  assert.equal(getDefaultQuickCapturePresetNodeType(), '');
});

test('a padded but supported quick capture type survives normalization', () => {
  __setPromptPresetSettingsForTest({ defaultQuickCaptureNodeType: '  ai-text  ' });
  assert.equal(getDefaultQuickCapturePresetNodeType(), 'ai-text');
});

test('an unsupported quick capture node type is rejected before any request', async () => {
  const restoreFetch = installFailingFetchStub();
  try {
    for (const value of ['', '  ', 'text', 'ai-', null, undefined]) {
      await assert.rejects(
        () => setDefaultQuickCapturePresetNodeType(value),
        /Invalid quick capture preset node type/,
      );
    }
  } finally {
    restoreFetch();
  }
});

test('a forced settings reload against a dead server falls back to the empty default', async () => {
  __setPromptPresetSettingsForTest({ defaultQuickCaptureNodeType: 'ai-video' });
  const restoreFetch = installFailingFetchStub();
  try {
    const settings = await loadPromptPresetSettings({ force: true });
    assert.deepEqual(settings, { defaultQuickCaptureNodeType: '' });
    assert.equal(getDefaultQuickCapturePresetNodeType(), '');
  } finally {
    restoreFetch();
    __setPromptPresetSettingsForTest({});
  }
});

test('the quick capture draft opens the configured tab and renders the captured template', async () => {
  const stub = installDocumentStub();
  try {
    __setCustomPromptPresetsForTest({});
    __setPromptPresetSettingsForTest({ defaultQuickCaptureNodeType: 'ai-video' });
    const result = await buildDraftCase('  captured text  ');

    assert.equal(result.nodeType, 'ai-video');
    assert.equal(result.hasConfiguredDefault, true);
    assert.equal(typeof result.overlay, 'object');
    assert.equal(stub.documentStub.body.children.includes(result.overlay), true);

    const editors = findElements(
      stub.created,
      (element) => hasClassToken(element, 'preset-manager-editor') && element.innerHTML.includes('captured'),
    );
    assert.equal(editors.length, 1);
    assert.equal(editors[0].innerHTML.includes('captured text'), true);
    assert.equal(editors[0].contentEditable, 'true');

    const starredTabs = findElements(stub.created, (element) =>
      element.classList.contains('is-quick-capture-default'),
    );
    assert.equal(starredTabs.length, 1);
    assert.equal(starredTabs[0].dataset.nodeType, 'ai-video');
  } finally {
    stub.restore();
    __setPromptPresetSettingsForTest({});
  }
});

test('without a configured default the draft opens the text tab and reports it', async () => {
  const stub = installDocumentStub();
  try {
    __setCustomPromptPresetsForTest({});
    __setPromptPresetSettingsForTest({});
    const result = await buildDraftCase('captured text');

    assert.equal(result.nodeType, 'ai-text');
    assert.equal(result.hasConfiguredDefault, false);
    const activeTabs = findElements(stub.created, (element) => element.classList.contains('is-active'));
    assert.equal(
      activeTabs.some((element) => element.dataset.nodeType === 'ai-text'),
      true,
    );
  } finally {
    stub.restore();
    __setPromptPresetSettingsForTest({});
  }
});

test('a blank capture seeds no draft and shows the empty detail pane', async () => {
  const stub = installDocumentStub();
  try {
    __setCustomPromptPresetsForTest({});
    __setPromptPresetSettingsForTest({ defaultQuickCaptureNodeType: 'ai-text' });
    for (const template of ['', '   ', undefined]) {
      stub.created.length = 0;
      await buildDraftCase(template);
      const editors = findElements(stub.created, (element) =>
        hasClassToken(element, 'preset-manager-editor'),
      );
      assert.equal(editors.length, 0, String(template));
      const emptyDetail = findElements(
        stub.created,
        (element) => element.className === 'preset-manager-detail-empty',
      );
      assert.equal(emptyDetail.length, 1, String(template));
    }
  } finally {
    stub.restore();
    __setPromptPresetSettingsForTest({});
  }
});

test('a second draft closes the overlay it replaced', async () => {
  const stub = installDocumentStub();
  try {
    __setCustomPromptPresetsForTest({});
    __setPromptPresetSettingsForTest({ defaultQuickCaptureNodeType: 'ai-text' });
    const first = await buildDraftCase('first capture');
    const second = await buildDraftCase('second capture');

    assert.notEqual(first.overlay, second.overlay);
    assert.equal(first.overlay.removed, true);
    assert.equal(second.overlay.removed, false);
  } finally {
    stub.restore();
    __setPromptPresetSettingsForTest({});
  }
});

test('every preset manager tab exposes a quick capture default gesture', async () => {
  const stub = installDocumentStub();
  try {
    __setCustomPromptPresetsForTest({});
    __setPromptPresetSettingsForTest({});
    await buildDraftCase('captured text');

    const tabs = findElements(stub.created, (element) => element.className === 'preset-manager-tab');
    assert.equal(tabs.length, 5);
    for (const tab of tabs) {
      assert.equal(typeof tab.dataset.nodeType, 'string');
      assert.notEqual(tab.dataset.nodeType, '');
      assert.equal((tab.listeners.get('contextmenu') || []).length, 1);
      assert.equal((tab.listeners.get('click') || []).length, 1);
    }
  } finally {
    stub.restore();
    __setPromptPresetSettingsForTest({});
  }
});
