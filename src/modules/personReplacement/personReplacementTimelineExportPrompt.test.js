import test from 'node:test';
import assert from 'node:assert/strict';
import { createPersonReplacementTimelineExportPrompt } from './personReplacementTimelineExportPrompt.js';

function makeElement(tagName = 'div') {
  const element = {
    tagName,
    className: '',
    innerHTML: '',
    textContent: '',
    disabled: false,
    children: {},
    listeners: {},
    attributes: {},
    focused: [],
    removed: 0,
    addEventListener(type, handler) {
      element.listeners[type] = handler;
    },
    removeEventListener() {},
    remove() {
      element.removed += 1;
    },
    focus(options) {
      element.focused.push(options);
    },
    setAttribute(name, value) {
      element.attributes[name] = value;
    },
    getAttribute() {
      return null;
    },
    querySelector(selector) {
      return element.children[selector] || null;
    },
    querySelectorAll() {
      return [];
    },
  };
  return element;
}

function makeDocumentObject() {
  const created = [];
  const body = {
    appended: [],
    appendChild(node) {
      body.appended.push(node);
    },
  };
  const documentObject = {
    body,
    created,
    createElement(tagName) {
      const overlay = makeElement(tagName);
      const message = makeElement('div');
      const dialog = makeElement('section');
      const cancel = makeElement('button');
      const ok = makeElement('button');
      overlay.children['.confirm-msg'] = message;
      overlay.children['[role=dialog]'] = dialog;
      overlay.children['.confirm-cancel'] = cancel;
      overlay.children['.confirm-ok'] = ok;
      dialog.children['.confirm-cancel'] = cancel;
      dialog.children['.confirm-ok'] = ok;
      dialog.querySelectorAll = () => [cancel, ok];
      overlay.parts = { message, dialog, cancel, ok };
      created.push(overlay);
      return overlay;
    },
  };
  return documentObject;
}

test('timelineExportPrompt: 工厂返回冻结的 show/close/destroy（close 与 destroy 同函数）', () => {
  const prompt = createPersonReplacementTimelineExportPrompt({
    documentObject: makeDocumentObject(),
    openJianying: async () => ({ success: true }),
  });
  assert.equal(Object.isFrozen(prompt), true);
  assert.deepEqual(Object.keys(prompt).sort(), ['close', 'destroy', 'show']);
  assert.equal(prompt.close, prompt.destroy);
  assert.equal(typeof prompt.show, 'function');
  assert.equal(prompt.close(), undefined, '无对话框时 close 无副作用');
});

test('timelineExportPrompt: 无 DOM 时直接回传原对象且不打开剪映', async () => {
  const input = { mode: 'jianying-draft', nested: { a: 1 } };
  for (const documentObject of [null, {}, { createElement: () => makeElement() }]) {
    let opened = 0;
    const prompt = createPersonReplacementTimelineExportPrompt({
      documentObject,
      openJianying: async () => {
        opened += 1;
        return { success: true };
      },
    });
    const result = prompt.show(input, '草稿名');
    assert.equal(typeof result.then, 'function', '返回 Promise ' + String(documentObject));
    assert.equal(await result, input, '原对象直通（非副本）');
    assert.equal(opened, 0, '不调用 openJianying');
    assert.equal('jianyingLaunch' in input, false);
  }
});

test('timelineExportPrompt: DOM 路径挂载对话框并在取消时以 skipped 收束', async () => {
  const documentObject = makeDocumentObject();
  const prompt = createPersonReplacementTimelineExportPrompt({
    documentObject,
    openJianying: async () => ({ success: true }),
  });
  const input = { mode: 'jianying-draft' };
  const promise = prompt.show(input, '');
  const overlay = documentObject.created[0];
  assert.equal(overlay.tagName, 'div');
  assert.equal(overlay.className, 'custom-confirm-overlay person-replacement-timeline-export-confirm');
  assert.equal(overlay.parts.message.textContent, '草稿“替换工作室”已保存到剪映草稿目录。', '草稿名回落');
  assert.equal(overlay.innerHTML.includes('role="dialog"'), true);
  assert.equal(overlay.innerHTML.includes('aria-modal="true"'), true);
  assert.equal(overlay.innerHTML.includes('aria-labelledby="person-replacement-export-confirm-'), true);
  assert.equal(overlay.innerHTML.includes('-message"'), true);
  // 本文件第一个真正挂载 DOM 的对话框（前两个用例不走 DOM 分支），序号必须是 1 而非 0。
  assert.equal(
    overlay.innerHTML.match(/aria-labelledby="([^"]+)"/)[1],
    'person-replacement-export-confirm-1',
    '首个对话框 id 由前置自增产生',
  );
  assert.equal(overlay.innerHTML.includes('是否立即打开剪映？'), true);
  assert.equal(overlay.innerHTML.includes('tabindex="-1"'), true);
  assert.deepEqual(documentObject.body.appended, [overlay]);
  assert.equal(overlay.parts.cancel.focused.length, 1, '首选聚焦取消按钮');
  assert.equal(overlay.parts.cancel.focused[0].preventScroll, true);
  assert.equal('jianyingLaunch' in input, false, '入参未被改动');

  overlay.listeners.click({ target: overlay.parts.dialog });
  assert.equal(overlay.removed, 0, '点击内部不关闭');
  overlay.listeners.click({ target: null });
  assert.equal(overlay.removed, 0, '缺 target 不关闭');
  overlay.parts.cancel.listeners.click();
  const result = await promise;
  assert.deepEqual(result, { mode: 'jianying-draft', jianyingLaunch: 'skipped' });
  assert.notEqual(result, input);
  assert.equal(overlay.removed, 1);
  assert.equal(prompt.close(), undefined, '已关闭后 close 无副作用');
  assert.equal(overlay.removed, 1);
});

test('timelineExportPrompt: 点击遮罩自身等同取消', async () => {
  const documentObject = makeDocumentObject();
  const prompt = createPersonReplacementTimelineExportPrompt({
    documentObject,
    openJianying: async () => ({}),
  });
  const promise = prompt.show({ mode: 'jianying-draft' }, 'A');
  const overlay = documentObject.created[0];
  assert.equal(overlay.parts.message.textContent, '草稿“A”已保存到剪映草稿目录。');
  overlay.listeners.click({ target: overlay });
  assert.deepEqual(await promise, { mode: 'jianying-draft', jianyingLaunch: 'skipped' });
  assert.equal(overlay.removed, 1);
});

test('timelineExportPrompt: 确认后按 openJianying 结果回传状态', async () => {
  const cases = [
    [{ success: true }, 'opened', undefined],
    [{ success: false, error: 'boom' }, 'failed', '草稿已保存，boom'],
    [{ success: false }, 'failed', '草稿已保存，请手动打开剪映。'],
    [{}, 'failed', '草稿已保存，请手动打开剪映。'],
    [null, 'failed', '草稿已保存，请手动打开剪映。'],
  ];
  for (const [openResult, launch, error] of cases) {
    const documentObject = makeDocumentObject();
    let calls = 0;
    const prompt = createPersonReplacementTimelineExportPrompt({
      documentObject,
      openJianying: async () => {
        calls += 1;
        return openResult;
      },
    });
    const promise = prompt.show({ mode: 'jianying-draft' }, '草稿A');
    const overlay = documentObject.created[0];
    const pending = overlay.parts.ok.listeners.click();
    assert.equal(overlay.parts.ok.disabled, true, '确认中禁用确认');
    assert.equal(overlay.parts.cancel.disabled, true, '确认中禁用取消');
    assert.equal(overlay.parts.ok.attributes['aria-busy'], 'true');
    assert.equal(overlay.parts.ok.innerHTML.includes('storyboard-script-loading-spinner'), true);
    assert.equal(overlay.parts.ok.innerHTML.includes('正在打开…'), true);
    assert.equal(overlay.parts.dialog.focused.length, 1, '打开时聚焦对话框');
    assert.equal(overlay.parts.dialog.focused[0].preventScroll, true);
    overlay.parts.cancel.listeners.click();
    overlay.parts.ok.listeners.click();
    await pending;
    const result = await promise;
    assert.equal(result.jianyingLaunch, launch, JSON.stringify(openResult));
    if (error === undefined) assert.equal('jianyingLaunchError' in result, false);
    else assert.equal(result.jianyingLaunchError, error);
    assert.equal(calls, 1, '重复点击/取消不重复调用');
    assert.equal(overlay.removed, 1);
  }
});

test('timelineExportPrompt: openJianying 抛错回退为手动打开提示', async () => {
  const documentObject = makeDocumentObject();
  const prompt = createPersonReplacementTimelineExportPrompt({
    documentObject,
    openJianying: async () => {
      throw new Error('nope');
    },
  });
  const promise = prompt.show({ mode: 'jianying-draft' });
  await documentObject.created[0].parts.ok.listeners.click();
  const result = await promise;
  assert.equal(result.jianyingLaunch, 'failed');
  assert.equal(result.jianyingLaunchError, '草稿已保存，请手动打开剪映。');
  assert.equal(documentObject.created[0].removed, 1);
});

test('timelineExportPrompt: 再次 show 会先以 skipped 收束上一个对话框', async () => {
  const documentObject = makeDocumentObject();
  const prompt = createPersonReplacementTimelineExportPrompt({
    documentObject,
    openJianying: async () => ({ success: true }),
  });
  const first = prompt.show({ tag: 1 }, 'A');
  const firstOverlay = documentObject.created[0];
  const second = prompt.show({ tag: 2 }, 'B');
  const secondOverlay = documentObject.created[1];
  assert.notEqual(firstOverlay, secondOverlay);
  assert.equal(firstOverlay.removed, 1, '旧对话框被移除');
  assert.deepEqual(await first, { tag: 1, jianyingLaunch: 'skipped' });
  const firstId = firstOverlay.innerHTML.match(/aria-labelledby="([^"]+)"/)[1];
  const secondId = secondOverlay.innerHTML.match(/aria-labelledby="([^"]+)"/)[1];
  assert.notEqual(firstId, secondId, 'id 序号递增');
  assert.equal(secondId.startsWith('person-replacement-export-confirm-'), true);
  assert.equal(Number(secondId.split('-').pop()) > Number(firstId.split('-').pop()), true);
  prompt.close();
  assert.equal(secondOverlay.removed, 1);
  assert.deepEqual(await second, { tag: 2, jianyingLaunch: 'skipped' });
  assert.equal(documentObject.body.appended.length, 2);
});
