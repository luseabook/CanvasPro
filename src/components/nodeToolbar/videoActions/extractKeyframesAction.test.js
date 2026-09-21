import test from 'node:test';
import assert from 'node:assert/strict';
import { bindVideoExtractKeyframesAction } from './extractKeyframesAction.js';
function createButtonStub() {
  let _0x2d3290 = null;
  const _0x16b72f = {
      active: false,
      toggle(_0x3cfa26, _0x15473b) {
        this.active = !!_0x15473b;
      },
    },
    _0x42ba42 = {
      dataset: {},
      disabled: false,
      attrs: {},
      addEventListener(_0x37c47e, _0x2ad6d9) {
        if (_0x37c47e === 'click') _0x2d3290 = _0x2ad6d9;
      },
      querySelector(_0x2858e6) {
        if (_0x2858e6 === 'svg') return { classList: _0x16b72f };
        return null;
      },
      setAttribute(_0x6ac063, _0x180afd) {
        this.attrs[_0x6ac063] = _0x180afd;
        if (_0x6ac063 === 'data-tooltip') this.dataset.tooltip = _0x180afd;
      },
      click() {
        return _0x2d3290?.({ stopPropagation() {} });
      },
    };
  return { button: _0x42ba42, svgClassList: _0x16b72f };
}
function withWindow(_0x92fd69) {
  const _0x203937 = global.window,
    _0x19a47b = [];
  return (
    (global.window = {
      showToast(_0x13eed3, _0x2dbc44) {
        _0x19a47b.push({ message: _0x13eed3, type: _0x2dbc44 });
      },
    }),
    Promise.resolve()
      .then(() => _0x92fd69(_0x19a47b))
      .finally(() => {
        global.window = _0x203937;
      })
  );
}
(test('video extract keyframes action: calls smart clip keyframe runner with default options', async () => {
  await withWindow(async (_0x566397) => {
    const { button: _0x950f27, svgClassList: _0x6635dd } = createButtonStub();
    let _0x2a2231 = null;
    (bindVideoExtractKeyframesAction({
      toolbarEl: {
        querySelector(_0x5edb82) {
          return _0x5edb82 === '.act-extract-keyframes' ? _0x950f27 : null;
        },
      },
      nodeData: { id: 'video-1' },
      getStateSnapshot() {
        return { videoClip: { active: false }, videoKeying: { active: false } };
      },
      VideoClipController: { exit() {} },
      VideoKeyingController: { exit() {} },
      async runSmartClipKeyframeExtractionFromVideoNode(_0x37cddf) {
        return (
          (_0x2a2231 = _0x37cddf),
          _0x37cddf.onProgress?.({ text: '分析中 (10%)' }),
          { ok: true, nodeIds: ['img-1', 'img-2'] }
        );
      },
    }),
      await _0x950f27.click(),
      assert.equal(_0x2a2231.nodeId, 'video-1'),
      assert.equal(Object.prototype.hasOwnProperty.call(_0x2a2231, 'options'), false),
      assert.equal(_0x950f27.disabled, false),
      assert.equal(_0x950f27.dataset.loading, 'false'),
      assert.equal(_0x6635dd.active, false),
      assert.deepEqual(_0x566397.at(-1), { message: '✅ 智能剪辑完成，已生成 2 张关键帧', type: 'success' }));
  });
}),
  test('video extract keyframes action: blocks while video edit mode is active', async () => {
    await withWindow(async (_0x54a1e0) => {
      const { button: _0x5b781b } = createButtonStub();
      let _0x4d43c8 = false;
      (bindVideoExtractKeyframesAction({
        toolbarEl: {
          querySelector(_0x5d75f1) {
            return _0x5d75f1 === '.act-extract-keyframes' ? _0x5b781b : null;
          },
        },
        nodeData: { id: 'video-1' },
        getStateSnapshot() {
          return { videoClip: { active: true }, videoKeying: { active: false } };
        },
        VideoClipController: { exit() {} },
        VideoKeyingController: { exit() {} },
        async runSmartClipKeyframeExtractionFromVideoNode() {
          return ((_0x4d43c8 = true), { ok: true, nodeIds: ['img-1'] });
        },
      }),
        await _0x5b781b.click(),
        assert.equal(_0x4d43c8, false),
        assert.equal(_0x5b781b.disabled, false),
        assert.deepEqual(_0x54a1e0.at(-1), { message: '请先退出裁剪视频模式', type: 'info' }));
    });
  }));
