import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORY_WORKSPACE_BETA_NOTICE_STORAGE_KEY,
  hasSeenStoryWorkspaceBetaNotice,
  markStoryWorkspaceBetaNoticeSeen,
  showStoryWorkspaceBetaNotice,
} from './storyWorkspaceBetaNotice.js';

function createHarness({ storage = {} } = {}) {
  const created = [];
  const makeNode = (tag) => ({
    tagName: String(tag).toUpperCase(),
    id: '',
    className: '',
    textContent: '',
    dataset: {},
    attributes: {},
    children: [],
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
    addEventListener() {},
  });
  const body = makeNode('body');
  const documentObject = {
    body,
    createElement(tag) {
      const node = makeNode(tag);
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

test('storyWorkspaceBetaNotice: storage key 是固定值且独立于其它工作室', () => {
  assert.equal(STORY_WORKSPACE_BETA_NOTICE_STORAGE_KEY, 'aicanvas.storyWorkspace.betaNoticeSeen.v1');
});

test('storyWorkspaceBetaNotice: hasSeen/mark 走传入的 window，不碰全局', () => {
  const { windowObject } = createHarness();
  assert.equal(hasSeenStoryWorkspaceBetaNotice(windowObject), false);
  assert.equal(markStoryWorkspaceBetaNoticeSeen(windowObject), true);
  assert.equal(hasSeenStoryWorkspaceBetaNotice(windowObject), true);
});

test('storyWorkspaceBetaNotice: 首次提示挂出剧本工作室专属文案', () => {
  const harness = createHarness();
  assert.equal(
    showStoryWorkspaceBetaNotice({
      documentObject: harness.documentObject,
      windowObject: harness.windowObject,
    }),
    true,
  );

  assert.equal(harness.windowObject.localStorage.getItem(STORY_WORKSPACE_BETA_NOTICE_STORAGE_KEY), '1');
  const overlay = harness.body.children[0];
  assert.equal(overlay.id, 'story-beta-notice-overlay');
  assert.equal(overlay.className, 'custom-confirm-overlay');
  const texts = harness.created.map((node) => node.textContent).filter(Boolean);
  assert.ok(texts.includes('剧本工作室 Beta 测试版'));
  assert.ok(texts.some((text) => text.includes('该功能目前为 Beta 测试版')));
});

test('storyWorkspaceBetaNotice: 已读后不再提示，且没有 localStorage 也能展示', () => {
  const seen = createHarness({ storage: { [STORY_WORKSPACE_BETA_NOTICE_STORAGE_KEY]: '1' } });
  assert.equal(
    showStoryWorkspaceBetaNotice({ documentObject: seen.documentObject, windowObject: seen.windowObject }),
    false,
  );
  assert.equal(seen.body.children.length, 0);

  const noStorage = createHarness();
  assert.equal(
    showStoryWorkspaceBetaNotice({
      documentObject: noStorage.documentObject,
      windowObject: {},
    }),
    true,
  );
  assert.equal(noStorage.body.children.length, 1);
});
