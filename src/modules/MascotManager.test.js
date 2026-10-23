import test from 'node:test';
import assert from 'node:assert/strict';

import MascotManager, { getMascotTipText } from './MascotManager.js';
import zhCN from '../i18n/messages/zh-CN.js';
import enUS from '../i18n/messages/en-US.js';

const TIP_KEYS = Object.keys(zhCN.mascot.tips);

test('mascotTip: 每条提示的占位符都被真实键位填满（中文）', () => {
  for (const key of TIP_KEYS) {
    const text = getMascotTipText(key);
    assert.ok(text && text.length > 0, key + ' 没有文案');
    assert.doesNotMatch(text, /\{[a-zA-Z0-9_]+\}/, key + ' 还有没填的占位符：' + text);
  }
});

test('mascotTip: 每条提示的占位符都被真实键位填满（英文）', () => {
  // 英文文案的占位符名必须和中文一致，否则换语言就露 `{shortcut}`。
  assert.deepEqual(Object.keys(enUS.mascot.tips).sort(), [...TIP_KEYS].sort());
  for (const key of TIP_KEYS) {
    const text = getMascotTipText(key, { 'fit-all': { keys: ['G'] } });
    assert.doesNotMatch(text, /\{[a-zA-Z0-9_]+\}/, key + ' 还有没填的占位符：' + text);
  }
});

test('mascotTip: 提示里的键位跟着用户当前绑定走', () => {
  // 默认预设下是 F；用户改成 Shift + G 之后提示必须跟着变，否则就是在教错按键。
  assert.match(getMascotTipText('viewFocus'), /【F】/);
  assert.match(
    getMascotTipText('viewFocus', { 'fit-all': { keys: ['Shift', 'G'] } }),
    /【Shift \+ G】/
  );
});

test('mascotTip: 备选绑定一起展示、去重后用 / 连接', () => {
  const text = getMascotTipText('viewFocus', {
    'fit-all': { keys: ['Shift', 'G'], alternateKeys: [['G'], ['Shift', 'G']] },
  });
  assert.match(text, /【Shift \+ G \/ G】/);
});

test('mascotTip: 动作没绑定过就显示「未设置」，不留空括号', () => {
  // 传一个别的动作，让快捷键表非空、但当前动作查不到。
  const text = getMascotTipText('viewFocus', { 'zoom-in': { keys: ['Ctrl', '+'] } });
  assert.match(text, /【未设置】/);
  assert.doesNotMatch(text, /【】/);
});

test('mascotTip: 快捷键表为空时退回内置预设，启动早期不会显示「未设置」', () => {
  assert.match(getMascotTipText('viewFocus', {}), /【F】/);
});

test('mascotTip: 打组提示的动词取自 i18n，不硬编码', () => {
  const text = getMascotTipText('organizeGroup');
  assert.match(text, /编组/);
  assert.doesNotMatch(text, /\{action\}/);
});

test('mascotTip: 工具类提示把整串键位都列出来', () => {
  const text = getMascotTipText('imageTools');
  assert.doesNotMatch(text, /\{shortcuts\}/);
  // 十种图像工具各一个数字键，用 / 连成一串。
  assert.match(text, /1 \/ 2 \/ 3/);
});

test('mascotManager: 快捷键更新后重算当前提示，不会一直显示旧键位', () => {
  const listeners = new Map();
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const elements = new Map();
  const makeElement = () => ({
    textContent: '',
    offsetHeight: 0,
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {},
  });
  for (const id of ['fabBtn', 'mascotWrap', 'mascotText', 'mascotFigure'])
    elements.set(id, makeElement());
  globalThis.window = {
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
  };
  globalThis.document = {
    getElementById: (id) => elements.get(id) || null,
  };
  try {
    // 用独立实例，避免污染模块单例的 _visible/_lastIdx。
    const manager = Object.create(MascotManager);
    manager._lastIdx = -1;
    manager._visible = false;
    manager._rotationTimer = null;
    manager._unsubscribeLocale = null;
    manager._bindFabButton = false;
    manager.init();
    assert.ok(listeners.has('shortcuts-updated'), '没有订阅快捷键更新');
    const text = elements.get('mascotText');
    // 未展示时不重算，避免无谓的 i18n 取词。
    text.textContent = 'sentinel';
    listeners.get('shortcuts-updated')();
    assert.equal(text.textContent, 'sentinel');
    // 展示中且有当前条目时重算。
    manager._visible = true;
    manager._lastIdx = 0;
    listeners.get('shortcuts-updated')();
    assert.notEqual(text.textContent, 'sentinel');
    assert.match(text.textContent, /^💡/);
  } finally {
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
  }
});
