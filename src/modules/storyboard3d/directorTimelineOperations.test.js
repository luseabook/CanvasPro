import assert from 'node:assert/strict';
import test from 'node:test';

import {
  collectDirectorKeys,
  copyDirectorKeys,
  deleteDirectorKeys,
  directorKeyIdentity,
  directorSnapTime,
  pasteDirectorKeys,
  shiftDirectorKeys,
} from './directorTimelineOperations.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} != ${b}`);

const key = (id, time, value) => ({ id, time, value });

const project = () => ({
  fps: 24,
  duration: 6,
  cameraKeyframes: [key('a', 0, [0, 0, 0]), key('b', 5, [1, 0, 0])],
  objectTracks: [
    {
      objectId: 'o1',
      positionKeyframes: [key('op', 1, [0, 1, 0])],
      rotationKeyframes: [key('or', 2, [0, 0, 0])],
      scaleKeyframes: [key('os', 3, [1, 1, 1])],
    },
  ],
  actionClips: [{ start: 1, end: 2 }],
  motionClips: [{ start: 4, end: 5 }],
});

test('关键帧收集：摄像机在前，物体按 位置/旋转/缩放 展开', () => {
  const all = collectDirectorKeys(project());
  assert.equal(all.length, 5);
  assert.deepEqual(
    all.map((k) => directorKeyIdentity(k)),
    ['camera:::a', 'camera:::b', 'object:o1:position:op', 'object:o1:rotation:or', 'object:o1:scale:os'],
  );
  assert.deepEqual(collectDirectorKeys({ cameraKeyframes: [], objectTracks: [] }), []);
  assert.deepEqual(collectDirectorKeys({ cameraKeyframes: [key('solo', 1)], objectTracks: [] }).length, 1);
});

test('关键帧身份：缺省字段填空串，回退到 keyframeId', () => {
  assert.equal(directorKeyIdentity({ type: 'camera', key: { id: 'a' } }), 'camera:::a');
  assert.equal(
    directorKeyIdentity({ type: 'object', objectId: 'o', property: 'position', key: { id: 'k' } }),
    'object:o:position:k',
  );
  assert.equal(directorKeyIdentity({ type: 'object', objectId: 'o', keyframeId: 'kf' }), 'object:o::kf');
});

test('平移关键帧：仅移动选中项且不修改入参', () => {
  const p = project();
  const out = shiftDirectorKeys(p, ['camera:::a'], 1);
  assert.equal(out.cameraKeyframes[0].time, 1);
  assert.equal(out.cameraKeyframes[1].time, 5);
  assert.equal(p.cameraKeyframes[0].time, 0);
  assert.notEqual(out, p);
});

test('平移关键帧：无命中时原样返回副本', () => {
  const p = project();
  const out = shiftDirectorKeys(p, ['camera:::zzz'], 1);
  assert.deepEqual(out, p);
  assert.notEqual(out, p);
  assert.deepEqual(shiftDirectorKeys(p, [], 1), p);
});

test('平移关键帧：时间按帧率量化', () => {
  const out = shiftDirectorKeys(project(), ['camera:::a'], 0.07);
  close(out.cameraKeyframes[0].time, Math.round(0.07 * 24) / 24);
});

test('平移关键帧：非法时间与越界抛错', () => {
  assert.throws(() => shiftDirectorKeys(project(), ['camera:::a'], 'abc'), /请输入有效时间/);
  assert.throws(() => shiftDirectorKeys(project(), ['camera:::a'], -1), /0–3600 秒范围/);
  const late = project();
  late.cameraKeyframes[1].time = 3600;
  assert.throws(() => shiftDirectorKeys(late, ['camera:::b'], 1), /0–3600 秒范围/);
});

test('平移关键帧：与未选中同轨关键帧共帧时抛错，整组平移则放行', () => {
  const p = project();
  p.cameraKeyframes = [key('a', 0, [0, 0, 0]), key('b', 2, [1, 0, 0])];
  assert.throws(() => shiftDirectorKeys(p, ['camera:::a'], 2), /移动后与已有关键帧冲突/);
  const both = shiftDirectorKeys(p, ['camera:::a', 'camera:::b'], 2);
  assert.equal(both.cameraKeyframes[0].time, 2);
  assert.equal(both.cameraKeyframes[1].time, 4);
  const other = shiftDirectorKeys(p, ['object:o1:position:op'], 1);
  assert.equal(other.objectTracks[0].positionKeyframes[0].time, 2);
  assert.equal(other.cameraKeyframes[0].time, 0);
});

test('复制关键帧：相对最早时间归零，无命中返回空数组', () => {
  const p = project();
  const clip = copyDirectorKeys(p, ['camera:::a', 'camera:::b', 'object:o1:scale:os']);
  assert.equal(clip.length, 3);
  assert.deepEqual(
    clip.map((c) => c.key.time),
    [0, 5, 3],
  );
  assert.deepEqual(
    clip.map((c) => directorKeyIdentity(c)),
    ['camera:::a', 'camera:::b', 'object:o1:scale:os'],
  );
  assert.deepEqual(copyDirectorKeys(p, ['nope']), []);
  assert.equal(clip[0].key.value[0], 0);
});

test('粘贴关键帧：重新生成 id 并按偏移落位，不修改入参', () => {
  const p = project();
  const clip = copyDirectorKeys(p, ['camera:::a', 'camera:::b']);
  const out = pasteDirectorKeys(p, clip, 1);
  assert.equal(out.cameraKeyframes.length, 4);
  const added = out.cameraKeyframes.slice(2);
  assert.equal(added[0].time, 1);
  assert.equal(added[1].time, 6);
  assert.notEqual(added[0].id, 'a');
  assert.ok(added[0].id.startsWith('key-'));
  assert.equal(added[0].value[0], 0);
  assert.equal(p.cameraKeyframes.length, 2);
});

test('粘贴关键帧：越界、目标轨道缺失、位置冲突分别抛错', () => {
  const p = project();
  const clip = copyDirectorKeys(p, ['camera:::a']);
  assert.throws(() => pasteDirectorKeys(p, clip, 3601), /粘贴超出镜头时长范围/);
  assert.throws(() => pasteDirectorKeys(p, clip, 0), /粘贴位置已有关键帧/);
  const ghost = [{ ...clip[0], type: 'object', objectId: 'ghost', property: 'position' }];
  assert.throws(() => pasteDirectorKeys(p, ghost, 1), /粘贴目标轨道已不存在/);
  const objectClip = copyDirectorKeys(p, ['object:o1:position:op']);
  const ok = pasteDirectorKeys(p, objectClip, 3);
  assert.equal(ok.objectTracks[0].positionKeyframes.length, 2);
  assert.equal(ok.objectTracks[0].positionKeyframes.at(-1).time, 3);
});

test('删除关键帧：按身份剔除，摄像机最后一帧受保护', () => {
  const p = project();
  const out = deleteDirectorKeys(p, ['camera:::b', 'object:o1:rotation:or']);
  assert.deepEqual(
    out.cameraKeyframes.map((k) => k.id),
    ['a'],
  );
  assert.equal(out.objectTracks[0].rotationKeyframes.length, 0);
  assert.equal(out.objectTracks[0].positionKeyframes.length, 1);
  assert.equal(p.cameraKeyframes.length, 2);
  const single = project();
  single.cameraKeyframes = [key('a', 0)];
  assert.throws(() => deleteDirectorKeys(single, ['camera:::a']), /至少保留一个摄像机关键帧/);
});

test('吸附时间：无阈值时仅量化到帧', () => {
  const p = project();
  assert.equal(directorSnapTime(2.01, p), Math.round(2.01 * 24) / 24);
  assert.equal(directorSnapTime(2.01, p, 0), Math.round(2.01 * 24) / 24);
  assert.equal(directorSnapTime(3.01, p, 0), 3);
});

test('吸附时间：命中关键帧与片段边界时吸附', () => {
  const p = project();
  assert.equal(directorSnapTime(3.01, p, 0.5), 3);
  close(directorSnapTime(3.4, p, 0.5), 3);
  close(directorSnapTime(0.9, p, 0.5), 1);
  close(directorSnapTime(4.4, p, 0.5), 4);
  close(directorSnapTime(3.4, p, 0.2), Math.round(3.4 * 24) / 24);
});

test('吸附时间：排除集合内的关键帧不参与吸附，同距取更早候选', () => {
  const p = project();
  assert.equal(directorSnapTime(3.01, p, 0.5, ['a']), 3);
  const tie = {
    fps: 24,
    duration: 10,
    cameraKeyframes: [key('l', 2), key('r', 4)],
    objectTracks: [],
    actionClips: [],
  };
  assert.equal(directorSnapTime(3, tie, 2), 2);
});
