import assert from 'node:assert/strict';
import test from 'node:test';

import {
  copyDirectorClip,
  createDirectorClip,
  duplicateDirectorClip,
  editDirectorClip,
  normalizeDirectorClips,
  pasteDirectorClip,
  resolveDirectorClipSample,
} from './directorClips.js';

function timeline(overrides = {}) {
  return {
    fps: 30,
    duration: 10,
    cameraKeyframes: [
      { id: 'c1', time: 0 },
      { id: 'c2', time: 2 },
      { id: 'c3', time: 5 },
    ],
    objectTracks: [
      {
        objectId: 'o1',
        positionKeyframes: [
          { id: 'p1', time: 0 },
          { id: 'p2', time: 1 },
        ],
        rotationKeyframes: [],
        scaleKeyframes: [],
      },
    ],
    actionClips: [],
    motionClips: [],
    ...overrides,
  };
}

test('运动片段：归一化丢弃失效片段、去重占位并排序', () => {
  const clips = normalizeDirectorClips(
    [
      { id: 'a', keyframeIds: ['c3', 'c3', 'ghost'], start: 4, end: 9 },
      { id: 'b', keyframeIds: ['c3'], start: 1 },
      { id: 'c', keyframeIds: ['c1'], start: -5 },
      { id: 'd', keyframeIds: [] },
      { keyframeIds: ['p1'] },
    ],
    timeline(),
  );
  assert.deepEqual(clips, [
    { id: 'c', name: '运动片段', keyframeIds: ['c1'], start: 0, end: 0.1 },
    { id: 'motion-clip-4', name: '运动片段', keyframeIds: ['p1'], start: 0, end: 0.1 },
    { id: 'a', name: '运动片段', keyframeIds: ['c3'], start: 4, end: 9 },
  ]);
});

test('运动片段：归一化裁剪名称长度并限制数量', () => {
  const long = 'x'.repeat(200);
  const clips = normalizeDirectorClips(
    [{ id: 'a', name: long, keyframeIds: ['c1'], start: 0, end: 1 }],
    timeline(),
  );
  assert.equal(clips[0].name.length, 120);

  const many = Array.from({ length: 305 }, (_, index) => ({
    id: 'm' + index,
    keyframeIds: ['c1'],
    start: index,
    end: index + 1,
  }));
  // 只有第一个片段能占用 c1，其余因关键帧已被认领而被丢弃。
  assert.equal(normalizeDirectorClips(many, timeline()).length, 1);
  assert.equal(normalizeDirectorClips(null, timeline()).length, 0);
});

test('运动片段：采样回退到原始轨道', () => {
  const keys = [
    { id: 'c1', time: 0 },
    { id: 'c2', time: 2 },
    { id: 'c3', time: 5 },
  ];
  assert.deepEqual(resolveDirectorClipSample([], keys, 1), { keys, time: 1 });
  assert.deepEqual(resolveDirectorClipSample([{ keyframeIds: ['ghost'] }], keys, 1), { keys, time: 1 });
});

test('运动片段：采样剔除被认领关键帧或收窄到片段内', () => {
  const keys = [
    { id: 'c1', time: 0 },
    { id: 'c2', time: 2 },
    { id: 'c3', time: 5 },
  ];
  const clips = [{ id: 'm1', keyframeIds: ['c2'], start: 2, end: 4 }];

  assert.deepEqual(resolveDirectorClipSample(clips, keys, 1), {
    keys: [
      { id: 'c1', time: 0 },
      { id: 'c3', time: 5 },
    ],
    time: 1,
  });
  assert.deepEqual(resolveDirectorClipSample(clips, keys, 3), { keys: [{ id: 'c2', time: 2 }], time: 3 });
  assert.deepEqual(resolveDirectorClipSample(clips, keys, 5), { keys: [{ id: 'c3', time: 5 }], time: 5 });
});

test('运动片段：创建要求选中关键帧且未被他片段占用', () => {
  const source = timeline();
  assert.throws(() => createDirectorClip(source, []), /请先选择关键帧或创建轨迹/);

  const created = createDirectorClip(source, ['c1', 'c2'], '走路');
  assert.equal(source.motionClips.length, 0);
  assert.equal(created.motionClips.length, 1);
  assert.equal(created.motionClips[0].name, '走路');
  assert.deepEqual(created.motionClips[0].keyframeIds, ['c1', 'c2']);
  assert.equal(created.motionClips[0].start, 0);
  assert.equal(created.motionClips[0].end, 2);
  assert.match(created.motionClips[0].id, /^motion-/);

  const claimed = timeline({
    motionClips: [{ id: 'm1', keyframeIds: ['c1'], start: 0, end: 1 }],
  });
  assert.throws(() => createDirectorClip(claimed, ['c1']), /已属于运动片段/);
});

test('运动片段：动作片段编辑修正偏移量', () => {
  const state = timeline({
    actionClips: [
      { id: 'a1', start: 0, end: 1, offset: 0, speed: 2 },
      { id: 'a2', start: 1, end: 2, offset: 0, speed: 1 },
    ],
  });
  assert.deepEqual(editDirectorClip(state, { kind: 'action', id: 'missing', start: 0, end: 1 }), state);

  const widened = editDirectorClip(state, { kind: 'action', id: 'a1', start: 0.5, end: 1.5 });
  assert.equal(state.actionClips[0].start, 0);
  assert.equal(widened.actionClips[0].start, 0.5);
  assert.equal(widened.actionClips[0].end, 1.5);
  assert.equal(widened.actionClips[0].offset, 1);

  assert.throws(
    () => editDirectorClip(state, { kind: 'action', id: 'a2', start: 0.5, end: 1.5 }),
    /无法向前扩展到动作源起点之前/,
  );
  assert.throws(
    () => editDirectorClip(state, { kind: 'action', id: 'a1', start: -1, end: 1 }),
    /片段范围必须在 0–3600 秒内且至少一帧/,
  );
  assert.throws(
    () => editDirectorClip(state, { kind: 'action', id: 'a1', start: 0, end: 4000 }),
    /片段范围必须在 0–3600 秒内且至少一帧/,
  );
});

test('运动片段：运动片段编辑可整体移动源关键帧', () => {
  const state = timeline({
    motionClips: [{ id: 'm1', keyframeIds: ['p1', 'p2'], start: 0, end: 1 }],
  });
  const resized = editDirectorClip(state, { kind: 'motion', id: 'm1', start: 0.5, end: 1.5 });
  assert.equal(resized.motionClips[0].start, 0.5);
  assert.equal(resized.motionClips[0].end, 1.5);
  assert.deepEqual(
    resized.objectTracks[0].positionKeyframes.map((key) => key.time),
    [0, 1],
  );

  const moved = editDirectorClip(state, { kind: 'motion', id: 'm1', start: 0.5, end: 1.5, move: true });
  assert.deepEqual(
    moved.objectTracks[0].positionKeyframes.map((key) => key.time),
    [0.5, 1.5],
  );
  assert.equal(state.objectTracks[0].positionKeyframes[0].time, 0);

  assert.throws(
    () => editDirectorClip(state, { kind: 'motion', id: 'm1', start: 3599.5, end: 3600, move: true }),
    /移动后源关键帧超出范围/,
  );
});

test('运动片段：复制保留条目，粘贴重建 id 与时间', () => {
  const state = timeline({
    motionClips: [{ id: 'm1', keyframeIds: ['p1', 'p2'], start: 0, end: 1 }],
    actionClips: [{ id: 'a1', start: 0, end: 1, offset: 0, speed: 1 }],
  });
  const motionCopy = copyDirectorClip(state, 'motion', 'm1');
  assert.equal(motionCopy.kind, 'motion');
  assert.equal(motionCopy.clip.id, 'm1');
  assert.deepEqual(
    motionCopy.entries.map((entry) => entry.key.id),
    ['p1', 'p2'],
  );
  assert.deepEqual(copyDirectorClip(state, 'action', 'a1').entries, []);
  assert.throws(() => copyDirectorClip(state, 'motion', 'ghost'), /片段已不存在/);

  const pasted = pasteDirectorClip(state, motionCopy, 4);
  assert.equal(state.motionClips.length, 1);
  assert.equal(pasted.motionClips.length, 2);
  const clone = pasted.motionClips[1];
  assert.match(clone.id, /^clip-/);
  assert.equal(clone.start, 4);
  assert.equal(clone.end, 5);
  assert.equal(clone.keyframeIds.length, 2);
  assert.notEqual(clone.keyframeIds[0], 'p1');
  const times = pasted.objectTracks[0].positionKeyframes.map((key) => key.time).sort((a, b) => a - b);
  assert.deepEqual(times, [0, 1, 4, 5]);
  for (const key of pasted.objectTracks[0].positionKeyframes.slice(2)) {
    assert.match(key.id, /^key-/);
  }
});

test('运动片段：粘贴守卫超出镜头时长与缺失轨道', () => {
  const state = timeline({
    motionClips: [{ id: 'm1', keyframeIds: ['p1'], start: 0, end: 1 }],
  });
  const payload = copyDirectorClip(state, 'motion', 'm1');
  assert.throws(() => pasteDirectorClip(state, payload, -1), /复制片段超出镜头时长范围/);
  assert.throws(() => pasteDirectorClip(state, payload, 3600), /复制片段超出镜头时长范围/);
  assert.throws(
    () =>
      pasteDirectorClip(
        state,
        {
          kind: 'motion',
          clip: { id: 'x', keyframeIds: ['k1'], start: 0, end: 1 },
          entries: [{ key: { id: 'k1', time: 0 }, type: 'object', objectId: 'ghost', property: 'position' }],
        },
        2,
      ),
    /片段对应物体轨道已不存在/,
  );
});

test('运动片段：复制即复制加粘贴', () => {
  const state = timeline({
    motionClips: [{ id: 'm1', keyframeIds: ['p1', 'p2'], start: 0, end: 1 }],
  });
  const duplicated = duplicateDirectorClip(state, 'motion', 'm1', 6);
  assert.equal(duplicated.motionClips.length, 2);
  assert.equal(duplicated.motionClips[1].start, 6);
  assert.equal(duplicated.motionClips[1].end, 7);
});
