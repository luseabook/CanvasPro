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

test('previewGenerateButtonUi: 去抖按浏览器序列化后的形态比较（<line/> 会变成 <line>）', () => {
  // 真实浏览器把赋进去的 HTML 重新序列化：自闭合标签补成开标签、style 补分号、
  // 属性顺序归位。于是 `el.innerHTML` 永远不等于源字符串，若拿二者直接比，
  // 去抖就退化成「每次都重写」——2026-10-23 真机验收实测到的正是这一条。
  // 这个假元素复现序列化行为，否则测试永远测不出来。
  const serialize = (html) => String(html).replace(/\/>/g, '>');
  const previousDocument = globalThis.document;
  globalThis.document = {
    createElement() {
      let html = '';
      return {
        get innerHTML() {
          return html;
        },
        set innerHTML(value) {
          html = serialize(value);
        },
      };
    },
  };
  let html = '',
    writes = 0;
  const button = {
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
      html = serialize(value);
    },
  };
  try {
    setGenerateButtonLoadingUi(button);
    assert.equal(writes, 1);
    setGenerateButtonLoadingUi(button);
    setGenerateButtonLoadingUi(button);
    assert.equal(writes, 1, '图标相同（序列化后相等）就不该重建子树');
  } finally {
    globalThis.document = previousDocument;
  }
});
