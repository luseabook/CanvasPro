import test from 'node:test';
import assert from 'node:assert/strict';

import { showReplicationWorkspaceBetaNotice } from './replicationWorkspaceBetaNotice.js';

const STORAGE_KEY = 'aicanvas.replicationWorkspace.betaNoticeSeen.v1';

function createElement(tag) {
  return {
    tagName: String(tag).toUpperCase(),
    id: '',
    className: '',
    textContent: '',
    dataset: {},
    attributes: {},
    children: [],
    hidden: false,
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    append(...items) {
      this.children.push(...items);
    },
    remove() {
      this.removed = true;
    },
    focus() {},
    addEventListener(type, handler) {
      this.listeners = this.listeners || {};
      this.listeners[type] = handler;
    },
  };
}

function createHarness({ storage = {} } = {}) {
  const created = [];
  const body = createElement('body');
  const documentObject = {
    body,
    createElement(tag) {
      const node = createElement(tag);
      created.push(node);
      return node;
    },
    getElementById: () => null,
    addEventListener() {},
    removeEventListener() {},
  };
  const windowObject = {
    localStorage: {
      store: { ...storage },
      getItem(key) {
        return Object.hasOwn(this.store, key) ? this.store[key] : null;
      },
      setItem(key, value) {
        this.store[key] = String(value);
      },
    },
  };
  return { documentObject, windowObject, created, body };
}

test('replicationWorkspaceBetaNotice: 没有 document.body 时直接返回 false', () => {
  assert.equal(
    showReplicationWorkspaceBetaNotice({ documentObject: {}, windowObject: {} }),
    false,
  );
});

test('replicationWorkspaceBetaNotice: 首次提示会挂出浮层并落上已读标记', () => {
  const harness = createHarness();
  assert.equal(
    showReplicationWorkspaceBetaNotice({
      documentObject: harness.documentObject,
      windowObject: harness.windowObject,
    }),
    true,
  );

  assert.equal(harness.windowObject.localStorage.getItem(STORAGE_KEY), '1');
  assert.equal(harness.body.children.length, 1);
  const overlay = harness.body.children[0];
  assert.equal(overlay.id, 'story-beta-notice-overlay');
  assert.equal(overlay.className, 'custom-confirm-overlay');
  assert.equal(overlay.dataset.workspaceModeNotice, '1');
  assert.equal(typeof overlay._workspaceNoticeClose, 'function');

  const texts = harness.created.map((node) => node.textContent).filter(Boolean);
  assert.ok(texts.includes('复刻工作室 Beta 测试版'));
  assert.ok(texts.some((text) => text.includes('复刻工作室目前为 Beta 测试版')));
});

test('replicationWorkspaceBetaNotice: 已读之后不再重复提示', () => {
  const harness = createHarness({ storage: { [STORAGE_KEY]: '1' } });
  assert.equal(
    showReplicationWorkspaceBetaNotice({
      documentObject: harness.documentObject,
      windowObject: harness.windowObject,
    }),
    false,
  );
  assert.equal(harness.body.children.length, 0);
  assert.equal(harness.created.length, 0);
});

test('replicationWorkspaceBetaNotice: 浮层关闭按钮会移除浮层', () => {
  const harness = createHarness();
  showReplicationWorkspaceBetaNotice({
    documentObject: harness.documentObject,
    windowObject: harness.windowObject,
  });
  const overlay = harness.body.children[0];
  overlay._workspaceNoticeClose();
  assert.equal(overlay.removed, true);
});

test('replicationWorkspaceBetaNotice: 窗口没有 localStorage 时仍会展示一次', () => {
  const harness = createHarness();
  assert.equal(
    showReplicationWorkspaceBetaNotice({
      documentObject: harness.documentObject,
      windowObject: {},
    }),
    true,
  );
  assert.equal(harness.body.children.length, 1);
});
