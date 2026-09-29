import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCustomProviderEditorShell,
  CUSTOM_PROVIDER_TUTORIAL_ID,
} from './appTopbarCustomProviderPresentation.js';

function documentAdapter() {
  const log = { tags: [] };
  function createElement(tag) {
    const attributes = new Map();
    const node = {
      localName: tag,
      className: '',
      dataset: {},
      childNodes: [],
      parentNode: null,
      textContent: '',
      type: undefined,
      setAttribute(name, value) {
        attributes.set(name, String(value));
      },
      getAttribute(name) {
        return attributes.get(name) ?? null;
      },
      append(...values) {
        for (const value of values) {
          if (value.parentNode) {
            const siblings = value.parentNode.childNodes;
            siblings.splice(siblings.indexOf(value), 1);
          }
          value.parentNode = node;
          node.childNodes.push(value);
        }
      },
      get children() {
        return node.childNodes;
      },
    };
    log.tags.push(tag);
    return node;
  }
  return { document: { createElement }, log };
}

function byClass(root, className) {
  const found = [];
  const walk = (node) => {
    for (const child of node.childNodes) {
      if (child.className.split(/\s+/).includes(className)) found.push(child);
      walk(child);
    }
  };
  walk(root);
  return found;
}

test('the tutorial id is the frozen constant', () => {
  assert.equal(CUSTOM_PROVIDER_TUTORIAL_ID, 'api-guide');
});

test('a document without createElement is rejected', () => {
  assert.throws(() => createCustomProviderEditorShell(), TypeError);
  assert.throws(() => createCustomProviderEditorShell({ documentObject: {} }), TypeError);
  assert.throws(() => createCustomProviderEditorShell({ documentObject: null }), TypeError);
});

test('the root carries the editor id in its dataset', () => {
  const { document } = documentAdapter();
  const shell = createCustomProviderEditorShell({ documentObject: document, editorId: 'cp-7' });
  assert.equal(shell.className, 'custom-provider-editor-item');
  assert.equal(shell.dataset.customProviderEditorId, 'cp-7');
  assert.equal(shell.children.length, 2);
});

test('the head holds a tab button and the delete button', () => {
  const { document } = documentAdapter();
  const shell = createCustomProviderEditorShell({ documentObject: document, editorId: 'cp-7' });
  const head = shell.children[0];
  assert.equal(head.className, 'custom-provider-editor-item-head');
  assert.equal(head.children.length, 2);
  const tab = head.children[0];
  assert.equal(tab.localName, 'button');
  assert.equal(tab.type, 'button');
  assert.equal(tab.className, 'custom-provider-editor-tab');
  assert.equal(tab.dataset.customProviderEditorTab, '');
  assert.equal(tab.getAttribute('aria-selected'), 'false');
});

test('the tab nests a title placeholder span', () => {
  const { document } = documentAdapter();
  const shell = createCustomProviderEditorShell({ documentObject: document, editorId: 'cp-7' });
  const tab = shell.children[0].children[0];
  assert.equal(tab.children.length, 1);
  const title = tab.children[0];
  assert.equal(title.localName, 'span');
  assert.equal(title.className, 'custom-provider-editor-item-title');
  assert.equal(title.dataset.customProviderEditorTitle, '');
});

test('the delete button is a close-styled button with the × glyph', () => {
  const { document } = documentAdapter();
  const shell = createCustomProviderEditorShell({
    documentObject: document,
    editorId: 'cp-7',
    deleteAriaLabel: '删除服务商',
  });
  const remove = shell.children[0].children[1];
  assert.equal(remove.localName, 'button');
  assert.equal(remove.type, 'button');
  assert.equal(remove.className, 'custom-provider-delete-btn canvas-tab-close');
  assert.equal(remove.dataset.customProviderDelete, '');
  assert.equal(remove.getAttribute('aria-label'), '删除服务商');
  assert.equal(remove.textContent, '×');
});

test('the actions row holds the tutorial and discover buttons in order', () => {
  const { document } = documentAdapter();
  const shell = createCustomProviderEditorShell({
    documentObject: document,
    editorId: 'cp-7',
    tutorialLabel: '接入教程',
    discoverLabel: '自动发现',
  });
  const actions = shell.children[1];
  assert.equal(actions.className, 'custom-provider-editor-item-actions');
  assert.deepEqual(
    actions.children.map((child) => child.className),
    [
      'settings-provider-guide-btn custom-provider-tutorial-btn',
      'custom-provider-primary-btn custom-provider-discover-btn',
    ],
  );
  const [tutorial, discover] = actions.children;
  assert.equal(tutorial.dataset.customProviderTutorial, '');
  assert.equal(tutorial.dataset.apiTutorialTrigger, CUSTOM_PROVIDER_TUTORIAL_ID);
  assert.equal(tutorial.textContent, '接入教程');
  assert.equal(discover.dataset.customProviderDiscover, '');
  assert.equal(discover.textContent, '自动发现');
  assert.equal(discover.type, 'button');
});

test('the labels default to empty strings', () => {
  const { document } = documentAdapter();
  const shell = createCustomProviderEditorShell({ documentObject: document, editorId: 'cp-7' });
  const [tutorial, discover] = shell.children[1].children;
  assert.equal(tutorial.textContent, '');
  assert.equal(discover.textContent, '');
  assert.equal(shell.children[0].children[1].getAttribute('aria-label'), '');
});

test('every button in the shell is a plain type=button', () => {
  const { document, log } = documentAdapter();
  const shell = createCustomProviderEditorShell({ documentObject: document, editorId: 'cp-7' });
  assert.deepEqual(log.tags, ['div', 'div', 'button', 'span', 'div', 'button', 'button', 'button']);
  const buttons = byClass(shell, 'custom-provider-editor-tab');
  assert.equal(buttons.length, 1);
  assert.equal(buttons[0].type, 'button');
});

test('the adapter is not consulted beyond element creation', () => {
  const calls = [];
  const document = {
    createElement(tag) {
      calls.push(tag);
      return {
        dataset: {},
        childNodes: [],
        append(...values) {
          for (const value of values) this.childNodes.push(value);
        },
        setAttribute() {},
        className: '',
        textContent: '',
      };
    },
  };
  createCustomProviderEditorShell({ documentObject: document, editorId: 'x' });
  assert.deepEqual(calls, ['div', 'div', 'button', 'span', 'div', 'button', 'button', 'button']);
});
