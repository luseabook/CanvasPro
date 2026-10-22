import test from 'node:test';
import assert from 'node:assert/strict';
import AudioClipController, {
  normalizeAudioClipSplitSec,
  shouldAudioClipSelectionPointerUpSeek,
} from './AudioClipController.js';
function createController(overrides = {}) {
  // 单例对象：用原型派生一个实例，避免测试之间互相污染状态。
  const controller = Object.create(AudioClipController);
  return Object.assign(controller, {
    active: true,
    durationSec: 10,
    startSec: 2,
    endSec: 8,
    _splitSec: null,
    _splitRanges: null,
    _activeSplitRangeId: '',
    _dragRangeId: '',
    _sourceOptions: null,
    _audioCurrentTime: 5,
    _renderCalls: 0,
    _getAudioEl: () => ({ currentTime: controller._audioCurrentTime }),
    _render() {
      this._renderCalls += 1;
    },
    ...overrides,
  });
}
test('audio clip split: 切点必须让左右两段都不短于最短长度', () => {
  const base = { startSec: 0, endSec: 10, durationSec: 10, minLenSec: 0.1 };
  (assert.equal(normalizeAudioClipSplitSec({ ...base, splitSec: 5 }), 5),
    // 左段只剩 0.05s：不可切。
    assert.equal(normalizeAudioClipSplitSec({ ...base, splitSec: 0.05 }), null),
    // 右段只剩 0.05s：不可切。
    assert.equal(normalizeAudioClipSplitSec({ ...base, splitSec: 9.95 }), null),
    // 越界夹到时长内，夹完仍要满足两侧长度。
    assert.equal(normalizeAudioClipSplitSec({ ...base, splitSec: 99 }), null),
    assert.equal(normalizeAudioClipSplitSec({ ...base, splitSec: -5 }), null),
    // 总时长非法 / 切点非数字一律拒绝。
    assert.equal(normalizeAudioClipSplitSec({ ...base, durationSec: 0, splitSec: 1 }), null),
    assert.equal(normalizeAudioClipSplitSec({ ...base, splitSec: Number.NaN }), null),
    // 恰好等于最短长度视为合法。
    assert.equal(normalizeAudioClipSplitSec({ ...base, splitSec: 0.1 }), 0.1));
});
test('audio clip split: pointerup 只在未真正拖动的移动模式下回跳', () => {
  (assert.equal(shouldAudioClipSelectionPointerUpSeek('move', false), true),
    assert.equal(shouldAudioClipSelectionPointerUpSeek('move', true), false),
    assert.equal(shouldAudioClipSelectionPointerUpSeek('left', false), false),
    assert.equal(shouldAudioClipSelectionPointerUpSeek('scrub', false), false));
});
test('audio clip split: 最短选区在极短素材上退让到素材长度', () => {
  (assert.equal(createController({ durationSec: 10 })._getMinSelectionSec(), 0.1),
    assert.equal(createController({ durationSec: 0.05 })._getMinSelectionSec(), 0.05),
    assert.equal(createController({ durationSec: 0 })._getMinSelectionSec(), 0.1));
});
test('audio clip split: 分段越界被夹取，短于最短长度则作废', () => {
  const controller = createController();
  (assert.deepEqual(controller._normalizeSplitRange({ startSec: -3, endSec: 20 }, 'left'), {
    id: 'left',
    startSec: 0,
    endSec: 10,
  }),
    // endSec < startSec 时按起点对齐，长度 0 → null。
    assert.equal(controller._normalizeSplitRange({ startSec: 5, endSec: 1 }, 'left'), null),
    assert.equal(controller._normalizeSplitRange({ startSec: 1, endSec: 1.02 }, 'left'), null),
    // 时长未知时无法归一化。
    assert.equal(createController({ durationSec: 0 })._normalizeSplitRange({}, 'left'), null));
});
test('audio clip split: 两段必须不重叠且缺 id 时按位置兜底', () => {
  const controller = createController();
  (controller._splitRanges = [
    { startSec: 0, endSec: 4 },
    { startSec: 5, endSec: 10 },
  ]),
    assert.deepEqual(
      controller._getSplitRanges().map((range) => range.id),
      ['left', 'right'],
    );
  // 重叠 → 判定为无效。
  (controller._splitRanges = [
    { id: 'left', startSec: 0, endSec: 6 },
    { id: 'right', startSec: 5, endSec: 10 },
  ]),
    assert.equal(controller._getSplitRanges(), null);
  // 少于两段 → 无效。
  (controller._splitRanges = [{ id: 'left', startSec: 0, endSec: 4 }]),
    assert.equal(controller._getSplitRanges(), null);
});
test('audio clip split: 选区包络覆盖两段总跨度', () => {
  const controller = createController({ startSec: 9, endSec: 9.5 });
  controller._splitRanges = [
    { id: 'left', startSec: 1, endSec: 4 },
    { id: 'right', startSec: 6, endSec: 9 },
  ];
  const splitRanges = controller._syncSelectionEnvelopeFromSplitRanges();
  (assert.equal(splitRanges.length, 2),
    assert.equal(controller.startSec, 1),
    assert.equal(controller.endSec, 9));
});
test('audio clip split: 活动段默认取左段，播放区间跟随活动段', () => {
  const controller = createController();
  (controller._splitRanges = [
    { id: 'left', startSec: 1, endSec: 4 },
    { id: 'right', startSec: 6, endSec: 9 },
  ]),
    assert.equal(controller._getActiveSplitRange().id, 'left'),
    assert.equal(controller._activeSplitRangeId, 'left'),
    assert.equal(controller._getPlaybackRange().endSec, 4),
    assert.equal(controller._setActiveSplitRange('right').id, 'right'),
    assert.equal(controller._getPlaybackRange().startSec, 6),
    assert.equal(controller._setActiveSplitRange('missing'), null);
  // 未切分时回落到选区。
  controller._splitRanges = null;
  (assert.equal(controller._getActiveSplitRange(), null),
    assert.equal(controller._getPlaybackRange().id, 'selection'));
});
test('audio clip split: 分段边界被相邻段夹住', () => {
  const controller = createController();
  controller._splitRanges = [
    { id: 'left', startSec: 1, endSec: 4 },
    { id: 'right', startSec: 6, endSec: 9 },
  ];
  (assert.deepEqual(controller._getSplitRangeBounds('left'), { minStart: 0, maxEnd: 6 }),
    assert.deepEqual(controller._getSplitRangeBounds('right'), { minStart: 4, maxEnd: 10 }),
    assert.equal(controller._getSplitRangeBounds('missing'), null));
});
test('audio clip split: 平移分段时长度不变且不越过相邻段', () => {
  const controller = createController();
  controller._splitRanges = [
    { id: 'left', startSec: 1, endSec: 4 },
    { id: 'right', startSec: 6, endSec: 9 },
  ];
  const movedRight = controller._moveSplitRangeByDelta('right', -1);
  (assert.equal(movedRight.startSec, 5),
    assert.equal(movedRight.endSec, 8),
    // 右段左移后左段的新上限变成 5，左段（长 3）最多只能从 2 开始。
    assert.equal(controller._moveSplitRangeByDelta('left', 99).startSec, 2));
  // 重置回初始分段，单独验证左段的两个夹取方向。
  controller._splitRanges = [
    { id: 'left', startSec: 1, endSec: 4 },
    { id: 'right', startSec: 6, endSec: 9 },
  ];
  (assert.equal(controller._moveSplitRangeByDelta('left', 99).startSec, 3),
    assert.equal(controller._moveSplitRangeByDelta('left', -99).startSec, 0));
});
test('audio clip split: 拉伸左右边缘受最短长度与相邻段约束', () => {
  const controller = createController();
  controller._splitRanges = [
    { id: 'left', startSec: 1, endSec: 4 },
    { id: 'right', startSec: 6, endSec: 9 },
  ];
  (assert.equal(controller._resizeSplitRangeEdge('left', 'left', 0).startSec, 0),
    // 左段右边不能超过右段起点 6。
    assert.equal(controller._resizeSplitRangeEdge('left', 'left', 99).startSec, 3.9),
    // 拉伸方向非法 → null。
    assert.equal(controller._resizeSplitRangeEdge('left', 'middle', 2), null),
    assert.equal(controller._resizeSplitRangeEdge('right', 'right', 99).endSec, 10));
});
test('audio clip split: 裁剪按钮只在允许切分且切点合法时生效', () => {
  const controller = createController({ _sourceOptions: null, _audioCurrentTime: 5 });
  // 来源未声明 allowSplit。
  (assert.equal(controller._stageSplitAtCurrentTime(), false),
    assert.equal(controller._splitRanges, null));
  controller._sourceOptions = { allowSplit: true };
  (assert.equal(controller._stageSplitAtCurrentTime(), true),
    assert.equal(controller._splitSec, 5),
    assert.equal(controller._splitRanges.length, 2),
    assert.equal(controller._activeSplitRangeId, 'right'),
    // 已切分后不再重复切。
    assert.equal(controller._stageSplitAtCurrentTime(), false));
});
test('audio clip split: 切点落在选区外时拒绝并提示', () => {
  const previousWindow = globalThis.window,
    toasts = [];
  globalThis.window = {
    showToast: (message, level) => toasts.push({ message, level }),
  };
  try {
    const controller = createController({ _sourceOptions: { allowSplit: true }, _audioCurrentTime: 9.95 });
    (assert.equal(controller._stageSplitAtCurrentTime(), false),
      assert.equal(controller._splitRanges, null),
      assert.equal(toasts.length, 1),
      assert.equal(toasts[0].level, 'warn'));
  } finally {
    if (typeof previousWindow === 'undefined') delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
test('audio clip split: 撤回裁剪清掉分段状态并重渲染', () => {
  const controller = createController({ _sourceOptions: { allowSplit: true } });
  controller._stageSplitAtCurrentTime();
  const renderCalls = controller._renderCalls;
  (controller._clearSplit(), assert.equal(controller._splitSec, null));
  (assert.equal(controller._splitRanges, null),
    assert.equal(controller._activeSplitRangeId, ''),
    assert.equal(controller._dragRangeId, ''),
    assert.equal(controller._renderCalls, renderCalls + 1));
  // 已经是干净状态时不再重渲染。
  const cleanCalls = controller._renderCalls;
  (controller._clearSplit(), assert.equal(controller._renderCalls, cleanCalls));
});
test('audio clip split: 分段元素按 id 查找，从事件目标可回溯所属段', () => {
  const leftEl = { dataset: { splitRangeId: 'left' } };
  const rightEl = { dataset: { splitRangeId: 'right' } };
  const controller = createController({
    splitLeftSelectionEl: leftEl,
    splitRightSelectionEl: rightEl,
  });
  controller._splitRanges = [
    { id: 'left', startSec: 1, endSec: 4 },
    { id: 'right', startSec: 6, endSec: 9 },
  ];
  (assert.equal(controller._getSplitRangeElement('left'), leftEl),
    assert.equal(controller._getSplitRangeElement('right'), rightEl),
    assert.equal(controller._getSplitRangeElement('other'), null),
    assert.equal(controller._getSplitRangeElementFromTarget({ closest: () => leftEl }), leftEl),
    // 段 id 不在当前分段里 → 不认。
    assert.equal(
      controller._getSplitRangeElementFromTarget({ closest: () => ({ dataset: { splitRangeId: 'ghost' } }) }),
      null,
    ),
    assert.equal(controller._getSplitRangeElementFromTarget(null), null));
});
