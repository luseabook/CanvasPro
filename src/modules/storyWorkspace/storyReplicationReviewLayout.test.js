import test from 'node:test';
import assert from 'node:assert/strict';

import { bindStoryReplicationReviewLayout } from './storyReplicationReviewLayout.js';

function createSplitter(side) {
  return {
    dataset: { reviewSplitter: side },
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    closest(selector) {
      return selector === '[data-review-splitter]' ? this : null;
    },
  };
}

function createHarness(ratios = { left: 30, right: 70 }) {
  const layout = {
    style: { vars: {}, setProperty(name, value) { this.vars[name] = value; } },
    splitters: [createSplitter('left'), createSplitter('right')],
    querySelectorAll(selector) {
      return selector === '[data-review-splitter]' ? this.splitters : [];
    },
  };
  const listeners = {};
  const root = {
    addEventListener(type, handler) { listeners[type] = handler; },
    removeEventListener(type) { delete listeners[type]; },
  };
  root.querySelector = (selector) => (selector === '.story-source-review-layout' ? layout : null);
  const tabs = [
    { key: 'a', focused: 0, clicked: 0, focus() { this.focused += 1; }, click() { this.clicked += 1; } },
    { key: 'b', focused: 0, clicked: 0, focus() { this.focused += 1; }, click() { this.clicked += 1; } },
    { key: 'c', focused: 0, clicked: 0, focus() { this.focused += 1; }, click() { this.clicked += 1; } },
  ];
  const tabHost = {
    querySelectorAll: (selector) => (selector === 'button' ? tabButtons : []),
  };
  const tabButtons = tabs.map((t) => ({
    dataset: { replicationTab: t.key },
    parentElement: tabHost,
    closest(selector) {
      return selector === '.story-source-tabs [data-replication-tab]' ? this : null;
    },
    ...t,
  }));
  return { layout, root, listeners, ratios, tabs, tabButtons, tabHost };
}

test('storyReplicationReviewLayout: 绑定即把比例写成 CSS 变量与滑块语义', () => {
  const harness = createHarness({ left: 30, right: 70 });
  const controller = bindStoryReplicationReviewLayout(harness.root, harness.ratios);

  assert.deepEqual(harness.layout.style.vars, {
    '--review-left': '30fr',
    '--review-middle': '40fr',
    '--review-right': '30fr',
  });
  const [left, right] = harness.layout.splitters;
  assert.equal(left.attributes['aria-valuenow'], '30');
  assert.equal(left.attributes['aria-valuemin'], '12');
  assert.equal(left.attributes['aria-valuemax'], '38');
  assert.equal(right.attributes['aria-valuenow'], '70');
  assert.equal(right.attributes['aria-valuemin'], '50');
  assert.equal(right.attributes['aria-valuemax'], '75');
  assert.equal(typeof harness.listeners.pointerdown, 'function');
  assert.equal(typeof harness.listeners.keydown, 'function');
  controller.destroy();
  assert.equal(harness.listeners.pointerdown, undefined);
  assert.equal(harness.listeners.keydown, undefined);
});

test('storyReplicationReviewLayout: 方向键按 2 个单位步进并夹在合法区间', () => {
  const harness = createHarness({ left: 30, right: 70 });
  const controller = bindStoryReplicationReviewLayout(harness.root, harness.ratios);
  const keydown = harness.listeners.keydown;
  const leftSplitter = harness.layout.splitters[0];
  const rightSplitter = harness.layout.splitters[1];

  keydown({ target: leftSplitter, key: 'ArrowRight', preventDefault() {}, stopPropagation() {} });
  assert.equal(harness.ratios.left, 32);
  for (let i = 0; i < 3; i += 1) keydown({ target: leftSplitter, key: 'ArrowLeft', preventDefault() {}, stopPropagation() {} });
  assert.equal(harness.ratios.left, 26, '每次步进 2');
  for (let i = 0; i < 20; i += 1) keydown({ target: leftSplitter, key: 'ArrowLeft', preventDefault() {}, stopPropagation() {} });
  assert.equal(harness.ratios.left, 12, '继续压会被夹在下限 12');

  for (let i = 0; i < 6; i += 1) keydown({ target: rightSplitter, key: 'ArrowRight', preventDefault() {}, stopPropagation() {} });
  assert.equal(harness.ratios.right, 75, '右滑块上限 75');
  assert.equal(harness.layout.style.vars['--review-middle'], '63fr', '中列 = right − left = 75 − 12');
  controller.destroy();
});

test('storyReplicationReviewLayout: 比例互相约束，中间列不小于 20', () => {
  const harness = createHarness({ left: 30, right: 70 });
  const controller = bindStoryReplicationReviewLayout(harness.root, harness.ratios);
  const keydown = harness.listeners.keydown;

  // 把右滑块一路压到下限：right >= left + 20
  for (let i = 0; i < 30; i += 1) keydown({ target: harness.layout.splitters[1], key: 'ArrowLeft', preventDefault() {}, stopPropagation() {} });
  assert.equal(harness.ratios.right, 50, '右滑块最低到 left+20');
  assert.equal(harness.layout.style.vars['--review-middle'], '20fr');

  // 再把左滑块拉到上限：left <= min(38, right-20)
  for (let i = 0; i < 30; i += 1) keydown({ target: harness.layout.splitters[0], key: 'ArrowRight', preventDefault() {}, stopPropagation() {} });
  assert.equal(harness.ratios.left, 30, '左滑块最高到 right-20');
  controller.destroy();
});

test('storyReplicationReviewLayout: 分集页签支持方向键与首尾跳转', () => {
  const harness = createHarness({ left: 30, right: 70 });
  const controller = bindStoryReplicationReviewLayout(harness.root, harness.ratios);
  const keydown = harness.listeners.keydown;
  const tab = (index) => ({
    target: harness.tabButtons[index],
    key: '',
    preventDefault() { this.defaulted = true; },
    stopPropagation() { this.stopped = true; },
  });

  const evt = tab(1);
  evt.key = 'ArrowLeft';
  keydown(evt);
  assert.equal(harness.tabButtons[0].focused, 1, '向左移动焦点');
  assert.equal(harness.tabButtons[0].clicked, 1);
  assert.equal(evt.defaulted, true);
  assert.equal(evt.stopped, true);

  const wrap = tab(0);
  wrap.key = 'ArrowLeft';
  keydown(wrap);
  assert.equal(harness.tabButtons[2].focused, 1, '越界回绕到最后一个');

  const home = tab(1);
  home.key = 'Home';
  keydown(home);
  assert.equal(harness.tabButtons[0].focused, 2);

  const end = tab(0);
  end.key = 'End';
  keydown(end);
  assert.equal(harness.tabButtons[2].focused, 2);

  const noop = tab(0);
  noop.key = 'Enter';
  keydown(noop);
  assert.equal(noop.defaulted, undefined, '无关按键不拦截');
  controller.destroy();
});
