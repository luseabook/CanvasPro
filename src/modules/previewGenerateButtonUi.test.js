import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GENERATE_CANCEL_ICON_HTML,
  GENERATE_ICON_HTML,
  GENERATE_LOADING_ICON_HTML,
  resetGenerateButtonIdleUi,
  setGenerateButtonCancellableUi,
  setGenerateButtonLoadingUi,
} from './previewGenerateButtonUi.js';

/**
 * 记录 innerHTML 被赋值的次数。真实 DOM 里每次赋值都会重建子树，
 * 这里用 setter 计数模拟「子树被重建」这件事。
 */
function createButton(initialHtml = '') {
  let html = initialHtml,
    writes = 0;
  const element = {
    disabled: false,
    title: '',
    style: {},
    dataset: {},
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {},
    getAttribute() {
      return null;
    },
    get innerHTML() {
      return html;
    },
    set innerHTML(value) {
      writes += 1;
      html = value;
    },
    get writes() {
      return writes;
    },
  };
  return element;
}

test('previewGenerateButtonUi: 图标没变时不重写 innerHTML', () => {
  const button = createButton();
  setGenerateButtonLoadingUi(button);
  assert.equal(button.innerHTML, GENERATE_LOADING_ICON_HTML);
  assert.equal(button.writes, 1);

  // 同状态再刷一次：动画图标不该被重建（重建 = 旋转从 0 度重来）。
  setGenerateButtonLoadingUi(button);
  setGenerateButtonLoadingUi(button);
  assert.equal(button.writes, 1, '图标相同时不应再写 innerHTML');
});

test('previewGenerateButtonUi: 图标变化时才重写', () => {
  const button = createButton();
  setGenerateButtonLoadingUi(button);
  setGenerateButtonCancellableUi(button);
  assert.equal(button.innerHTML, GENERATE_CANCEL_ICON_HTML);
  assert.equal(button.writes, 2);

  resetGenerateButtonIdleUi(button);
  assert.equal(button.innerHTML, GENERATE_ICON_HTML);
  assert.equal(button.writes, 3);
});

test('previewGenerateButtonUi: 回到空闲态后重复调用不再重写', () => {
  const button = createButton();
  resetGenerateButtonIdleUi(button);
  resetGenerateButtonIdleUi(button);
  assert.equal(button.innerHTML, GENERATE_ICON_HTML);
  assert.equal(button.writes, 1, '已经是空闲图标，重复 reset 不应重建子树');
  assert.equal(button.disabled, false);
});
