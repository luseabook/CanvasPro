import test from 'node:test';
import assert from 'node:assert/strict';
import { bindVideoReverseAction } from './reverseAction.js';
function createClassList() {
  const map = new Set();
  return {
    toggle(value, item) {
      if (item) map.add(value);
      else map.delete(value);
    },
    contains(key) {
      return map.has(key);
    },
  };
}
function createButtonStub() {
  let index = null;
  const classList = createClassList(),
    button = {
      dataset: { tooltip: 'Video reverse' },
      disabled: false,
      attrs: {},
      addEventListener(result, data) {
        if (result === 'click') index = data;
      },
      querySelector(options) {
        if (options === 'svg') return { classList: classList };
        return null;
      },
      setAttribute(target, source) {
        this.attrs[target] = source;
        if (target === 'data-tooltip') this.dataset.tooltip = source;
      },
      getAttribute(next) {
        if (next === 'data-tooltip') return this.dataset.tooltip || null;
        return this.attrs[next] ?? null;
      },
      removeAttribute(current) {
        delete this.attrs[current];
        if (current === 'data-tooltip') delete this.dataset.tooltip;
      },
      click() {
        return index?.({ stopPropagation() {} });
      },
    };
  return { button: button, svgClassList: classList };
}
function createToolbar(entry) {
  return {
    querySelector(record) {
      return record === '.act-reverse' ? entry : null;
    },
  };
}
function createDeferred() {
  let resolve, reject;
  const promise = new Promise((payload, handle) => {
    ((resolve = payload), (reject = handle));
  });
  return { promise: promise, resolve: resolve, reject: reject };
}
function withWindow(handler) {
  const config = global.window,
    list = [];
  return (
    (global.window = {
      showToast(message, type) {
        list.push({ message: message, type: type });
      },
    }),
    Promise.resolve()
      .then(() => handler(list))
      .finally(() => {
        global.window = config;
      })
  );
}
function bindReverseForTest({
  button: button2,
  state: state = { videoClip: { active: false }, videoKeying: { active: false } },
  runVideoReverseFromNode: runVideoReverseFromNode = async () => null,
  exits: exits = [],
} = {}) {
  bindVideoReverseAction({
    toolbarEl: createToolbar(button2),
    nodeData: { id: 'video-1' },
    getStateSnapshot() {
      return state;
    },
    VideoClipController: {
      exit(args) {
        exits.push({ controller: 'clip', args: args });
      },
    },
    VideoKeyingController: {
      exit(args2) {
        exits.push({ controller: 'keying', args: args2 });
      },
    },
    runVideoReverseFromNode: runVideoReverseFromNode,
  });
}
(test('video reverse action: spins toolbar icon until runner settles', async () => {
  await withWindow(async () => {
    const { button: button3, svgClassList: svgClassList } = createButtonStub(),
      promise2 = createDeferred();
    let scope = 0;
    bindReverseForTest({
      button: button3,
      runVideoReverseFromNode(input) {
        return ((scope += 1), assert.equal(input, 'video-1'), promise2.promise);
      },
    });
    const output = button3.click();
    (assert.equal(scope, 1),
      assert.equal(button3.dataset.loading, 'true'),
      assert.equal(button3.disabled, true),
      assert.equal(button3.attrs['aria-busy'], 'true'),
      assert.equal(button3.dataset.tooltip, 'Video reverse中...'),
      assert.equal(svgClassList.contains('v2-spinning'), true),
      await button3.click(),
      assert.equal(scope, 1),
      promise2.resolve(null),
      await output,
      assert.equal(button3.dataset.loading, 'false'),
      assert.equal(button3.disabled, false),
      assert.equal(button3.getAttribute('aria-busy'), null),
      assert.equal(button3.dataset.tooltip, 'Video reverse'),
      assert.equal(svgClassList.contains('v2-spinning'), false));
  });
}),
  test('video reverse action: restores toolbar icon when runner rejects', async () => {
    await withWindow(async (value2) => {
      const { button: button4, svgClassList: svgClassList2 } = createButtonStub();
      (bindReverseForTest({
        button: button4,
        async runVideoReverseFromNode() {
          throw new Error('boom');
        },
      }),
        await button4.click(),
        assert.equal(button4.dataset.loading, 'false'),
        assert.equal(button4.disabled, false),
        assert.equal(button4.getAttribute('aria-busy'), null),
        assert.equal(svgClassList2.contains('v2-spinning'), false),
        assert.deepEqual(value2.at(-1), { message: '视频倒放失败: boom', type: 'error' }));
    });
  }),
  test('video reverse action: does not spin or run while clip mode is active', async () => {
    await withWindow(async (value3) => {
      const { button: button5, svgClassList: svgClassList3 } = createButtonStub(),
        exits2 = [];
      let value4 = 0;
      (bindReverseForTest({
        button: button5,
        exits: exits2,
        state: { videoClip: { active: true }, videoKeying: { active: false } },
        async runVideoReverseFromNode() {
          value4 += 1;
        },
      }),
        await button5.click(),
        assert.equal(value4, 0),
        assert.deepEqual(exits2, []),
        assert.notEqual(button5.dataset.loading, 'true'),
        assert.equal(button5.disabled, false),
        assert.equal(svgClassList3.contains('v2-spinning'), false),
        assert.deepEqual(value3.at(-1), { message: '请先退出裁剪视频模式', type: 'info' }));
    });
  }),
  test('video reverse action: does not spin or run while keying mode is active', async () => {
    await withWindow(async (value5) => {
      const { button: button6, svgClassList: svgClassList4 } = createButtonStub(),
        exits3 = [];
      let value6 = 0;
      (bindReverseForTest({
        button: button6,
        exits: exits3,
        state: { videoClip: { active: false }, videoKeying: { active: true } },
        async runVideoReverseFromNode() {
          value6 += 1;
        },
      }),
        await button6.click(),
        assert.equal(value6, 0),
        assert.deepEqual(exits3, []),
        assert.notEqual(button6.dataset.loading, 'true'),
        assert.equal(button6.disabled, false),
        assert.equal(svgClassList4.contains('v2-spinning'), false),
        assert.deepEqual(value5.at(-1), { message: '请先退出当前视频编辑模式', type: 'info' }));
    });
  }));
