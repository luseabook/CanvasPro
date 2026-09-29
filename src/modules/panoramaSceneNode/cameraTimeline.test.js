import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CAMERA_TIMELINE_EASINGS,
  applyCameraTimelineEasing,
  cameraTimelineFrameToTime,
  cameraTimelineTimeToFrame,
  createDefaultCameraTimeline,
  normalizeCameraTimeline,
  removeCameraKeyframe,
  sampleCameraTimeline,
  updateCameraTimelineSettings,
  upsertCameraKeyframe,
} from './cameraTimeline.js';

function makeTimeline(keyframes, over = {}) {
  return normalizeCameraTimeline({ keyframes, duration: 10, ...over });
}

function closeTo(actual, expected, epsilon = 1e-9) {
  assert.ok(Math.abs(actual - expected) < epsilon, 'expected ' + actual + ' to be close to ' + expected);
}

const LINEAR_PAIR = [
  {
    id: 'a',
    time: 0,
    position: { x: 0, y: 0, z: 0 },
    target: { x: 0, y: 0, z: 0 },
    fov: 10,
    easing: 'linear',
  },
  {
    id: 'b',
    time: 10,
    position: { x: 10, y: 20, z: 30 },
    target: { x: 1, y: 2, z: 3 },
    fov: 110,
    easing: 'linear',
  },
];

test('默认时间轴给出 6 秒 24 帧的空关键帧列表', () => {
  assert.deepEqual(createDefaultCameraTimeline(), {
    duration: 6,
    fps: 24,
    loop: false,
    currentTime: 0,
    isPlaying: false,
    keyframes: [],
  });
});

test('空输入规范化后与默认时间轴一致', () => {
  assert.deepEqual(normalizeCameraTimeline(), createDefaultCameraTimeline());
  assert.deepEqual(normalizeCameraTimeline({}), createDefaultCameraTimeline());
});

test('关键帧缺省字段按索引补齐并给出默认机位', () => {
  const timeline = normalizeCameraTimeline({ keyframes: [{}] });
  assert.deepEqual(timeline.keyframes, [
    {
      id: 'camera-keyframe-1',
      time: 0,
      position: { x: 0, y: 1.6, z: 6 },
      target: { x: 0, y: 1.6, z: 2 },
      fov: 55,
      easing: 'linear',
    },
  ]);
});

test('关键帧 id 去空白，时间为负归零，fov 与缓动被收敛', () => {
  const timeline = normalizeCameraTimeline({
    keyframes: [
      { id: '  cam-a  ', time: -5, fov: 500, easing: 'EASE-IN' },
      { id: '', time: 3, fov: -20, easing: 'unknown' },
    ],
  });
  assert.equal(timeline.keyframes[0].id, 'cam-a');
  assert.equal(timeline.keyframes[0].time, 0);
  assert.equal(timeline.keyframes[0].fov, 120);
  assert.equal(timeline.keyframes[0].easing, 'ease-in');
  assert.equal(timeline.keyframes[1].id, 'camera-keyframe-2');
  assert.equal(timeline.keyframes[1].fov, 10);
  assert.equal(timeline.keyframes[1].easing, 'linear');
});

test('时长至少覆盖最后一个关键帧并被限制在 0.1 到 3600 之间', () => {
  assert.equal(normalizeCameraTimeline({ duration: 2, keyframes: [{ time: 9 }] }).duration, 9);
  assert.equal(
    normalizeCameraTimeline({
      duration: 2,
      keyframes: [
        { id: 'a', time: 1 },
        { id: 'b', time: 9 },
      ],
    }).duration,
    9,
  );
  assert.equal(normalizeCameraTimeline({ duration: 0.01 }).duration, 0.1);
  assert.equal(normalizeCameraTimeline({ duration: 99999 }).duration, 3600);
  assert.equal(normalizeCameraTimeline({ duration: 'abc' }).duration, 6);
});

test('帧率取整并限制在 1 到 120 之间，布尔字段为严格真值', () => {
  const clamped = normalizeCameraTimeline({ fps: 0.4, loop: 1, isPlaying: 'true' });
  assert.equal(clamped.fps, 1);
  assert.equal(clamped.loop, false);
  assert.equal(clamped.isPlaying, false);
  const high = normalizeCameraTimeline({ fps: 250.6, loop: true, isPlaying: true });
  assert.equal(high.fps, 120);
  assert.equal(high.loop, true);
  assert.equal(high.isPlaying, true);
});

test('关键帧按 id 去重保留后一条并按时间与 id 排序', () => {
  const timeline = normalizeCameraTimeline({
    duration: 20,
    keyframes: [
      { id: 'dup', time: 5, fov: 11 },
      { id: 'zz', time: 2 },
      { id: 'dup', time: 1, fov: 22 },
      { id: 'aa', time: 2 },
    ],
  });
  assert.deepEqual(
    timeline.keyframes.map((keyframe) => [keyframe.id, keyframe.time, keyframe.fov]),
    [
      ['dup', 1, 22],
      ['aa', 2, 55],
      ['zz', 2, 55],
    ],
  );
});

test('当前时间与关键帧时间被限制在时长范围内', () => {
  const timeline = normalizeCameraTimeline({
    duration: 5,
    currentTime: 99,
    keyframes: [{ id: 'late', time: 30 }],
  });
  assert.equal(timeline.duration, 30);
  assert.equal(timeline.currentTime, 30);
  const narrow = normalizeCameraTimeline({
    duration: 4,
    currentTime: -3,
    keyframes: [{ id: 'k', time: 2 }],
  });
  assert.equal(narrow.currentTime, 0);
});

test('upsertCameraKeyframe 追加关键帧并同步当前时间与时长', () => {
  const base = makeTimeline(LINEAR_PAIR);
  const next = upsertCameraKeyframe(base, { id: 'c', time: 15, position: { x: 1, y: 1, z: 1 } });
  assert.equal(next.keyframes.length, 3);
  assert.equal(next.duration, 15);
  assert.equal(next.currentTime, 15);
  assert.deepEqual(
    next.keyframes.map((keyframe) => keyframe.id),
    ['a', 'b', 'c'],
  );
});

test('upsertCameraKeyframe 同 id 覆盖原关键帧且不新增', () => {
  const base = makeTimeline(LINEAR_PAIR);
  const next = upsertCameraKeyframe(base, { id: 'b', time: 4, fov: 33 });
  assert.equal(next.keyframes.length, 2);
  const replaced = next.keyframes.find((keyframe) => keyframe.id === 'b');
  assert.equal(replaced.time, 4);
  assert.equal(replaced.fov, 33);
  assert.equal(next.currentTime, 4);
  assert.equal(next.duration, 10);
});

test('upsertCameraKeyframe 缺省 id 时按现有条数生成序号', () => {
  const base = makeTimeline(LINEAR_PAIR);
  const next = upsertCameraKeyframe(base, { time: 3 });
  assert.ok(next.keyframes.some((keyframe) => keyframe.id === 'camera-keyframe-3'));
});

test('removeCameraKeyframe 按去空白 id 删除，未知 id 不改变结果', () => {
  const base = makeTimeline(LINEAR_PAIR);
  const removed = removeCameraKeyframe(base, '  a  ');
  assert.deepEqual(
    removed.keyframes.map((keyframe) => keyframe.id),
    ['b'],
  );
  const untouched = removeCameraKeyframe(base, 'nope');
  assert.deepEqual(
    untouched.keyframes.map((keyframe) => keyframe.id),
    ['a', 'b'],
  );
});

test('updateCameraTimelineSettings 覆盖设置但保留关键帧', () => {
  const base = makeTimeline(LINEAR_PAIR);
  const next = updateCameraTimelineSettings(base, { duration: 20, fps: 30, loop: true });
  assert.equal(next.duration, 20);
  assert.equal(next.fps, 30);
  assert.equal(next.loop, true);
  assert.equal(next.keyframes.length, 2);
});

test('帧与秒互换使用钳制后的帧率', () => {
  assert.equal(cameraTimelineFrameToTime(12), 0.5);
  assert.equal(cameraTimelineTimeToFrame(0.5), 12);
  assert.equal(cameraTimelineFrameToTime(-4), 0);
  assert.equal(cameraTimelineTimeToFrame(-1), 0);
  assert.equal(cameraTimelineFrameToTime(24, 0), 24);
  assert.equal(cameraTimelineTimeToFrame(0.5, 0), 1);
  assert.equal(cameraTimelineFrameToTime(24, 999), 0.2);
  assert.equal(cameraTimelineTimeToFrame(0.5, 999), 60);
});

test('缓动函数覆盖四种取值且入参被限制在 0 到 1', () => {
  assert.equal(applyCameraTimelineEasing(0.5, 'linear'), 0.5);
  assert.equal(applyCameraTimelineEasing(0.5, 'ease-in'), 0.25);
  assert.equal(applyCameraTimelineEasing(0.5, 'ease-out'), 0.75);
  assert.equal(applyCameraTimelineEasing(0.25, 'ease-in-out'), 0.125);
  assert.equal(applyCameraTimelineEasing(0.75, 'ease-in-out'), 0.875);
  closeTo(applyCameraTimelineEasing(0.55, 'ease-in-out'), 0.595);
  assert.equal(applyCameraTimelineEasing(-3, 'linear'), 0);
  assert.equal(applyCameraTimelineEasing(9, 'linear'), 1);
  assert.equal(applyCameraTimelineEasing(0.5, 'bogus'), 0.5);
  assert.deepEqual(CAMERA_TIMELINE_EASINGS, ['linear', 'ease-in', 'ease-out', 'ease-in-out']);
});

test('sampleCameraTimeline 在无关键帧时返回 null', () => {
  assert.equal(sampleCameraTimeline(createDefaultCameraTimeline(), 1), null);
  assert.equal(sampleCameraTimeline({ keyframes: [] }), null);
});

test('sampleCameraTimeline 在只有一个关键帧时复制该帧', () => {
  const timeline = normalizeCameraTimeline({
    duration: 10,
    keyframes: [{ id: 'only', time: 1, position: { x: 1, y: 2, z: 3 }, fov: 40 }],
    currentTime: 6,
  });
  const sample = sampleCameraTimeline(timeline);
  assert.equal(sample.time, 6);
  assert.deepEqual(sample.position, { x: 1, y: 2, z: 3 });
  assert.equal(sample.fov, 40);
  assert.equal(sample.fromKeyframeId, 'only');
  assert.equal(sample.toKeyframeId, 'only');
  assert.equal(sample.progress, 0);
});

test('sampleCameraTimeline 取相邻关键帧做线性插值', () => {
  const timeline = makeTimeline(LINEAR_PAIR);
  const sample = sampleCameraTimeline(timeline, 5);
  assert.equal(sample.time, 5);
  assert.deepEqual(sample.position, { x: 5, y: 10, z: 15 });
  assert.deepEqual(sample.target, { x: 0.5, y: 1, z: 1.5 });
  assert.equal(sample.fov, 60);
  assert.equal(sample.fromKeyframeId, 'a');
  assert.equal(sample.toKeyframeId, 'b');
  assert.equal(sample.progress, 0.5);
});

test('sampleCameraTimeline 使用起始关键帧的缓动', () => {
  const easeIn = makeTimeline([{ ...LINEAR_PAIR[0], easing: 'ease-in' }, LINEAR_PAIR[1]]);
  assert.equal(sampleCameraTimeline(easeIn, 5).progress, 0.25);
  const easeOut = makeTimeline([{ ...LINEAR_PAIR[0], easing: 'ease-out' }, LINEAR_PAIR[1]]);
  assert.equal(sampleCameraTimeline(easeOut, 5).progress, 0.75);
});

test('sampleCameraTimeline 在范围外取首尾关键帧', () => {
  const timeline = makeTimeline(LINEAR_PAIR);
  const before = sampleCameraTimeline(timeline, -2);
  assert.equal(before.time, 0);
  assert.deepEqual(before.position, { x: 0, y: 0, z: 0 });
  assert.equal(before.progress, 0);
  const after = sampleCameraTimeline(timeline, 99);
  assert.equal(after.time, 10);
  assert.deepEqual(after.position, { x: 10, y: 20, z: 30 });
  assert.equal(after.fromKeyframeId, 'b');
});

test('sampleCameraTimeline 在首个关键帧时刻命中该帧而非区间', () => {
  const timeline = makeTimeline(LINEAR_PAIR);
  const atHead = sampleCameraTimeline(timeline, 0);
  assert.equal(atHead.fromKeyframeId, 'a');
  assert.equal(atHead.toKeyframeId, 'a');
  assert.equal(atHead.progress, 0);
});

test('sampleCameraTimeline 循环模式下把时间折回时长内', () => {
  const timeline = makeTimeline(LINEAR_PAIR, { loop: true });
  const sample = sampleCameraTimeline(timeline, 12);
  assert.equal(sample.time, 2);
  assert.equal(sample.progress, 0.2);
  assert.deepEqual(sample.position, { x: 2, y: 4, z: 6 });
  const wrappedNeg = sampleCameraTimeline(timeline, -3);
  assert.equal(wrappedNeg.time, 7);
  assert.equal(wrappedNeg.progress, 0.7);
});

test('sampleCameraTimeline 多段关键帧时命中对应区间', () => {
  const timeline = normalizeCameraTimeline({
    duration: 20,
    keyframes: [
      { id: 'a', time: 0, position: { x: 0, y: 0, z: 0 }, fov: 10 },
      { id: 'b', time: 4, position: { x: 4, y: 0, z: 0 }, fov: 20 },
      { id: 'c', time: 12, position: { x: 12, y: 0, z: 0 }, fov: 40 },
    ],
  });
  const sample = sampleCameraTimeline(timeline, 8);
  assert.equal(sample.fromKeyframeId, 'b');
  assert.equal(sample.toKeyframeId, 'c');
  assert.equal(sample.progress, 0.5);
  assert.deepEqual(sample.position, { x: 8, y: 0, z: 0 });
  assert.equal(sample.fov, 30);
});

test('sampleCameraTimeline 缺省时间取当前时间', () => {
  const timeline = makeTimeline(LINEAR_PAIR, { currentTime: 2.5 });
  const sample = sampleCameraTimeline(timeline);
  assert.equal(sample.time, 2.5);
  assert.equal(sample.progress, 0.25);
});

test('sampleCameraTimeline 时长大于末帧时末段保持末帧值', () => {
  const timeline = normalizeCameraTimeline({
    duration: 20,
    keyframes: [
      { id: 'a', time: 0, position: { x: 0, y: 0, z: 0 } },
      { id: 'b', time: 5, position: { x: 5, y: 0, z: 0 } },
    ],
  });
  const sample = sampleCameraTimeline(timeline, 15);
  assert.equal(sample.time, 15);
  assert.deepEqual(sample.position, { x: 5, y: 0, z: 0 });
  assert.equal(sample.fromKeyframeId, 'b');
  assert.equal(sample.progress, 0);
});
