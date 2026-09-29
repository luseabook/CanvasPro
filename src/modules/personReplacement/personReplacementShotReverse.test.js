import test from 'node:test';
import assert from 'node:assert/strict';

import {
  materializePersonReplacementShotPlayback,
  resolveShotCutSubmissionUi,
  togglePersonReplacementShotReverseAtTimelineSec,
} from './personReplacementShotReverse.js';

const SHOTS = [
  { id: 'sh1', sourceId: 'v1', startSec: 0, endSec: 5, durationSec: 5 },
  { id: 'sh2', sourceId: 'v1', startSec: 5, endSec: 10, durationSec: 5 },
];

test('personReplacementShotReverse: 在时间线上切换当前片段的倒放', () => {
  const first = togglePersonReplacementShotReverseAtTimelineSec(SHOTS, 7);
  assert.equal(first.isReversed, true);
  assert.equal(first.message, '当前片段已倒放。');
  assert.equal(first.draft[0].isReversed, undefined, '其余片段不受影响');
  assert.equal(first.draft[1].isReversed, true);
  assert.equal(first.position.shotIndex, 1);

  const second = togglePersonReplacementShotReverseAtTimelineSec(first.draft, 7);
  assert.equal(second.isReversed, false);
  assert.equal(second.message, '已取消当前片段倒放。');
  assert.equal(second.draft[1].isReversed, false);
  assert.equal(SHOTS[1].isReversed, undefined, '原数组不被就地修改');
});

test('personReplacementShotReverse: 空时间线返回 null', () => {
  assert.equal(togglePersonReplacementShotReverseAtTimelineSec([], 3), null);
});

test('personReplacementShotReverse: 提交态按倒放/裁切/智能裁切分流', () => {
  assert.deepEqual(resolveShotCutSubmissionUi('reverse', false), {
    reversePending: true,
    cutSubmitting: false,
    editorBusy: true,
    loadingTitle: '正在倒放视频',
    loadingDescription: '正在处理当前片段，完成后会直接更新时间线。',
  });
  assert.deepEqual(resolveShotCutSubmissionUi('cuts', true), {
    reversePending: false,
    cutSubmitting: true,
    editorBusy: true,
    loadingTitle: '智能裁切中',
    loadingDescription: '正在检测并裁切视频，完成后会自动更新时间线。',
  });
  assert.deepEqual(resolveShotCutSubmissionUi('', false), {
    reversePending: false,
    cutSubmitting: false,
    editorBusy: false,
    loadingTitle: '正在应用切口',
    loadingDescription: '正在裁切视频，完成后会自动更新时间线。',
  });
});

test('personReplacementShotReverse: 参数不完整直接抛错', async () => {
  await assert.rejects(
    () => materializePersonReplacementShotPlayback({ currentShot: null, range: { startSec: 0, endSec: 1 }, enqueueMediaTask: async () => ({}), resolveMediaRef: (x) => x }),
    { message: '镜头片段倒放参数不完整' },
  );
  await assert.rejects(
    () => materializePersonReplacementShotPlayback({ currentShot: {}, range: { startSec: 0, endSec: 1 } }),
    { message: '镜头片段倒放参数不完整' },
  );
});

test('personReplacementShotReverse: 区间与倒放态都没变时直接复用现有引用', async () => {
  const enqueued = [];
  const result = await materializePersonReplacementShotPlayback({
    currentShot: { startTimeSec: 0, endTimeSec: 5, videoRef: 'data/uploads/shot.mp4', materializedIsReversed: false },
    range: { startSec: 0, endSec: 5, isReversed: false },
    epsilonSec: 0.01,
    enqueueMediaTask: async (task) => {
      enqueued.push(task);
      return { success: true };
    },
    resolveMediaRef: (r) => r,
  });
  assert.deepEqual(enqueued, []);
  assert.deepEqual(result, { videoRef: 'data/uploads/shot.mp4', reverseChanged: false, videoRefIsCropped: false });
});

test('personReplacementShotReverse: 新片段倒放要走导出加倒放两段', async () => {
  const enqueued = [];
  const result = await materializePersonReplacementShotPlayback({
    currentShot: { startTimeSec: 0, endTimeSec: 5 },
    range: { startSec: 1, endSec: 4, isReversed: true },
    isNewShot: true,
    sourceVideoRef: 'data/uploads/source.mp4',
    outputFps: 30,
    enqueueMediaTask: async (task, options) => {
      enqueued.push([task, options]);
      if (task.kind === 'mediaClipExport') return { success: true, ref: 'clip-ref' };
      return { success: true, ref: 'reversed-ref' };
    },
    resolveMediaRef: (result) => result.ref,
  });

  assert.equal(enqueued.length, 2);
  assert.equal(enqueued[0][0].kind, 'mediaClipExport');
  assert.deepEqual(enqueued[0][0].args, { videoStart: 1, videoEnd: 4, fps: 30 });
  assert.deepEqual(enqueued[0][1], { wait: true, timeout: 600000 });
  assert.equal(enqueued[1][0].kind, 'videoReverse');
  assert.equal(enqueued[1][0].src, 'clip-ref');
  assert.deepEqual(result, { videoRef: 'reversed-ref', reverseChanged: true, videoRefIsCropped: false });
});

test('personReplacementShotReverse: 导出失败按原因抛错', async () => {
  await assert.rejects(
    () =>
      materializePersonReplacementShotPlayback({
        currentShot: { startTimeSec: 0, endTimeSec: 5 },
        range: { startSec: 1, endSec: 4, isReversed: false },
        isNewShot: true,
        enqueueMediaTask: async () => ({ success: false, error: '磁盘已满' }),
        resolveMediaRef: () => 'x',
      }),
    { message: '磁盘已满' },
  );
  await assert.rejects(
    () =>
      materializePersonReplacementShotPlayback({
        currentShot: { startTimeSec: 0, endTimeSec: 5 },
        range: { startSec: 1, endSec: 4, isReversed: true },
        isNewShot: true,
        enqueueMediaTask: async (task) =>
          task.kind === 'mediaClipExport' ? { success: true, ref: 'c' } : { success: false, message: '倒放被取消' },
        resolveMediaRef: (r) => r,
      }),
    { message: '倒放被取消' },
  );
});
