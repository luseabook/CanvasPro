import test from 'node:test';
import assert from 'node:assert/strict';

import {
  REPLACEMENT_STUDIO_BETA_NOTICE_STORAGE_KEY,
  hasSeenReplacementStudioBetaNotice,
  markReplacementStudioBetaNoticeSeen,
  showReplacementStudioBetaNotice,
} from './replacementStudioBetaNotice.js';

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

test('replacementStudioBetaNotice: storage key 是固定值且独立于其它工作室', () => {
  assert.equal(REPLACEMENT_STUDIO_BETA_NOTICE_STORAGE_KEY, 'aicanvas.replacementStudio.betaNoticeSeen.v1');
});

test('replacementStudioBetaNotice: hasSeen/mark 走传入的 window，不碰全局', () => {
  const { windowObject } = createHarness();
  assert.equal(hasSeenReplacementStudioBetaNotice(windowObject), false);
  assert.equal(markReplacementStudioBetaNoticeSeen(windowObject), true);
  assert.equal(hasSeenReplacementStudioBetaNotice(windowObject), true);
});

test('replacementStudioBetaNotice: 首次提示挂出替换工作室专属文案并落已读标记', () => {
  const harness = createHarness();
  assert.equal(
    showReplacementStudioBetaNotice({
      documentObject: harness.documentObject,
      windowObject: harness.windowObject,
    }),
    true,
  );

  assert.equal(
    harness.windowObject.localStorage.getItem(REPLACEMENT_STUDIO_BETA_NOTICE_STORAGE_KEY),
    '1',
  );
  const overlay = harness.body.children[0];
  assert.equal(overlay.id, 'story-beta-notice-overlay');
  const texts = harness.created.map((node) => node.textContent).filter(Boolean);
  assert.ok(texts.includes('替换工作室 Beta 测试版'));
  assert.ok(texts.some((text) => text.includes('替换工作室目前为 Beta 测试版')));
});

test('replacementStudioBetaNotice: 已读后不再提示', () => {
  const seen = createHarness({ storage: { [REPLACEMENT_STUDIO_BETA_NOTICE_STORAGE_KEY]: '1' } });
  assert.equal(
    showReplacementStudioBetaNotice({ documentObject: seen.documentObject, windowObject: seen.windowObject }),
    false,
  );
  assert.equal(seen.body.children.length, 0);
});
