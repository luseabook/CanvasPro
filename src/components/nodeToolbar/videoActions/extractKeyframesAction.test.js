import test from 'node:test';
import assert from 'node:assert/strict';
import { bindVideoExtractKeyframesAction } from './extractKeyframesAction.js';
function createButtonStub() {
  let value = null;
  const classList = {
      active: false,
      toggle(item, enabled) {
        this.active = !!enabled;
      },
    },
    button = {
      dataset: {},
      disabled: false,
      attrs: {},
      addEventListener(key, index) {
        if (key === 'click') value = index;
      },
      querySelector(result) {
        if (result === 'svg') return { classList: classList };
        return null;
      },
      setAttribute(data, options) {
        this.attrs[data] = options;
        if (data === 'data-tooltip') this.dataset.tooltip = options;
      },
      click() {
        return value?.({ stopPropagation() {} });
      },
    };
  return { button: button, svgClassList: classList };
}
function withWindow(handler) {
  const target = global.window,
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
        global.window = target;
      })
  );
}
(test('video extract keyframes action: calls smart clip keyframe runner with default options', async () => {
  await withWindow(async (source) => {
    const { button: button2, svgClassList: svgClassList } = createButtonStub();
    let next = null;
    (bindVideoExtractKeyframesAction({
      toolbarEl: {
        querySelector(current) {
          return current === '.act-extract-keyframes' ? button2 : null;
        },
      },
      nodeData: { id: 'video-1' },
      getStateSnapshot() {
        return { videoClip: { active: false }, videoKeying: { active: false } };
      },
      VideoClipController: { exit() {} },
      VideoKeyingController: { exit() {} },
      async runSmartClipKeyframeExtractionFromVideoNode(entry) {
        return (
          (next = entry),
          entry.onProgress?.({ text: '分析中 (10%)' }),
          { ok: true, nodeIds: ['img-1', 'img-2'] }
        );
      },
    }),
      await button2.click(),
      assert.equal(next.nodeId, 'video-1'),
      assert.equal(Object.prototype.hasOwnProperty.call(next, 'options'), false),
      assert.equal(button2.disabled, false),
      assert.equal(button2.dataset.loading, 'false'),
      assert.equal(svgClassList.active, false),
      assert.deepEqual(source.at(-1), { message: '✅ 智能剪辑完成，已生成 2 张关键帧', type: 'success' }));
  });
}),
  test('video extract keyframes action: blocks while video edit mode is active', async () => {
    await withWindow(async (record) => {
      const { button: button3 } = createButtonStub();
      let payload = false;
      (bindVideoExtractKeyframesAction({
        toolbarEl: {
          querySelector(handle) {
            return handle === '.act-extract-keyframes' ? button3 : null;
          },
        },
        nodeData: { id: 'video-1' },
        getStateSnapshot() {
          return { videoClip: { active: true }, videoKeying: { active: false } };
        },
        VideoClipController: { exit() {} },
        VideoKeyingController: { exit() {} },
        async runSmartClipKeyframeExtractionFromVideoNode() {
          return ((payload = true), { ok: true, nodeIds: ['img-1'] });
        },
      }),
        await button3.click(),
        assert.equal(payload, false),
        assert.equal(button3.disabled, false),
        assert.deepEqual(record.at(-1), { message: '请先退出裁剪视频模式', type: 'info' }));
    });
  }));
