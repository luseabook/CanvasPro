import assert from 'node:assert/strict';
import test from 'node:test';

import {
  addDirectorCameraPathPoint,
  normalizeDirectorCameraPath,
  readDirectorCameraPath,
  removeDirectorCameraPathPoint,
  updateDirectorCameraPathPoint,
} from './directorCameraPath.js';

const camera = (x) => ({
  position: [x, 0, 0],
  target: [x, 0, -1],
  focalLength: 35,
  roll: 0,
});

const project = () => ({
  fps: 24,
  duration: 2,
  cameraKeyframes: [
    { id: 'a', time: 0, camera: camera(0), easing: 'linear' },
    { id: 'b', time: 2, camera: camera(2), easing: 'linear' },
  ],
  cameraPath: { pointIds: ['a', 'b'] },
  objectTracks: [],
});

test('路径归一化：按关键帧顺序保留仍存在的控制点', () => {
  const keys = [{ id: 'b' }, { id: 'a' }, { id: 'c' }];
  assert.deepEqual(normalizeDirectorCameraPath({ pointIds: ['c', 'a', 'zz'] }, keys), {
    pointIds: ['a', 'c'],
  });
  assert.deepEqual(normalizeDirectorCameraPath({ pointIds: 'a' }, keys), { pointIds: [] });
  assert.deepEqual(normalizeDirectorCameraPath(undefined, keys), { pointIds: [] });
  assert.deepEqual(normalizeDirectorCameraPath({ pointIds: ['a'] }, []), { pointIds: [] });
});

test('读取路径：返回命中 pointIds 的关键帧，缺省为空数组', () => {
  const p = project();
  assert.deepEqual(
    readDirectorCameraPath(p).map((k) => k.id),
    ['a', 'b'],
  );
  p.cameraPath = { pointIds: ['b'] };
  assert.deepEqual(
    readDirectorCameraPath(p).map((k) => k.id),
    ['b'],
  );
  assert.deepEqual(readDirectorCameraPath({ cameraKeyframes: p.cameraKeyframes }), []);
  assert.deepEqual(readDirectorCameraPath({}), []);
});

test('追加控制点：无路径时以末个关键帧起锚并在最大时间上加 1 秒', () => {
  const p = project();
  delete p.cameraPath;
  const next = addDirectorCameraPathPoint(p, camera(3));
  assert.deepEqual(next.cameraPath.pointIds.slice(0, 1), ['b']);
  assert.equal(next.cameraPath.pointIds.length, 2);
  assert.equal(next.cameraKeyframes.length, 3);
  const added = next.cameraKeyframes.at(-1);
  assert.equal(added.time, 3);
  assert.equal(added.easing, 'linear');
  assert.equal(added.camera.position[0], 3);
  assert.ok(added.id.startsWith('camera-path-'));
  assert.equal(next.cameraPath.pointIds.at(-1), added.id);
  assert.equal(next.duration, 3);
  assert.equal(p.cameraKeyframes.length, 2);
  assert.equal(p.cameraPath, undefined);
});

test('追加控制点：已有路径时接在末个控制点之后 1 秒', () => {
  const p = project();
  const next = addDirectorCameraPathPoint(p, camera(4));
  assert.equal(next.cameraKeyframes.at(-1).time, 3);
  const again = addDirectorCameraPathPoint(next, camera(5));
  assert.equal(again.cameraKeyframes.at(-1).time, 4);
  assert.equal(again.cameraKeyframes.at(-1).camera.position[0], 5);
  assert.equal(again.duration, 4);
});

test('追加控制点：超出时长上限与 100 个上限均抛错', () => {
  const late = project();
  late.cameraKeyframes[1].time = 3600;
  assert.throws(() => addDirectorCameraPathPoint(late, camera(1)), /轨道已达到镜头时长上限/);
  const full = project();
  full.cameraKeyframes = Array.from({ length: 100 }, (_, i) => ({
    id: 'k' + i,
    time: i,
    camera: camera(i),
  }));
  full.cameraPath = { pointIds: full.cameraKeyframes.map((k) => k.id) };
  assert.throws(() => addDirectorCameraPathPoint(full, camera(1)), /最多 100 个控制点/);
});

test('更新控制点：未知 id 原样返回且不修改入参', () => {
  const p = project();
  const out = updateDirectorCameraPathPoint(p, 'nope', { time: 1 });
  assert.deepEqual(out, p);
  assert.notEqual(out, p);
});

test('更新控制点：时间按帧率量化并重排', () => {
  const p = project();
  const out = updateDirectorCameraPathPoint(p, 'a', { time: 2.51 });
  assert.equal(out.cameraKeyframes[0].id, 'b');
  assert.equal(out.cameraKeyframes[1].id, 'a');
  assert.equal(out.cameraKeyframes[1].time, Math.round(2.51 * 24) / 24);
  assert.equal(p.cameraKeyframes[0].id, 'a');
  assert.equal(p.cameraKeyframes[0].time, 0);
});

test('更新控制点：越界与共帧冲突抛错', () => {
  assert.throws(() => updateDirectorCameraPathPoint(project(), 'a', { time: -1 }), /0–3600 秒之间/);
  assert.throws(() => updateDirectorCameraPathPoint(project(), 'a', { time: 3601 }), /0–3600 秒之间/);
  assert.throws(() => updateDirectorCameraPathPoint(project(), 'a', { time: 'abc' }), /0–3600 秒之间/);
  assert.throws(() => updateDirectorCameraPathPoint(project(), 'a', { time: 2 }), /该帧已有摄像机控制点/);
});

test('更新控制点：同帧并列时按 id 字典序稳定排序', () => {
  const p = project();
  p.cameraKeyframes = [
    { id: 'z', time: 0, camera: camera(0) },
    { id: 'm', time: 0, camera: camera(1) },
  ];
  p.cameraPath = { pointIds: ['z', 'm'] };
  const out = updateDirectorCameraPathPoint(p, 'm', { camera: camera(9) });
  assert.deepEqual(
    out.cameraKeyframes.map((k) => k.id),
    ['m', 'z'],
  );
});

test('更新控制点：缓动覆盖 easingCurve，切线按 hasOwn 复制或删除', () => {
  const p = project();
  p.cameraKeyframes[0].easingCurve = [0, 0, 1, 1];
  p.cameraKeyframes[0].outTangent = [1, 1, 1];
  const eased = updateDirectorCameraPathPoint(p, 'a', { easing: 'ease-in' });
  assert.equal(eased.cameraKeyframes[0].easing, 'ease-in');
  assert.equal(eased.cameraKeyframes[0].easingCurve, undefined);

  const tangents = updateDirectorCameraPathPoint(p, 'a', {
    outTangent: [2, 2, 2],
    inTangent: null,
    easingCurve: [0.1, 0.2, 0.3, 0.4],
  });
  assert.deepEqual(tangents.cameraKeyframes[0].outTangent, [2, 2, 2]);
  assert.equal(tangents.cameraKeyframes[0].inTangent, undefined);
  assert.deepEqual(tangents.cameraKeyframes[0].easingCurve, [0.1, 0.2, 0.3, 0.4]);
  assert.deepEqual(p.cameraKeyframes[0].outTangent, [1, 1, 1]);
  assert.deepEqual(p.cameraKeyframes[0].easingCurve, [0, 0, 1, 1]);
});

test('更新控制点：相机与路径一并刷新', () => {
  const p = project();
  const out = updateDirectorCameraPathPoint(p, 'a', { camera: camera(7) });
  assert.equal(out.cameraKeyframes[0].camera.position[0], 7);
  assert.equal(out.cameraKeyframes[0].camera.target[0], 7);
  assert.deepEqual(out.cameraPath, { pointIds: ['a', 'b'] });
});

test('删除控制点：最后一个控制点受保护', () => {
  const p = project();
  p.cameraKeyframes = [{ id: 'a', time: 0, camera: camera(0) }];
  p.cameraPath = { pointIds: ['a'] };
  assert.throws(() => removeDirectorCameraPathPoint(p, 'a'), /至少保留一个摄像机控制点/);
});

test('删除控制点：移除后路径同步去掉', () => {
  const p = project();
  const out = removeDirectorCameraPathPoint(p, 'a');
  assert.deepEqual(
    out.cameraKeyframes.map((k) => k.id),
    ['b'],
  );
  assert.deepEqual(out.cameraPath, { pointIds: ['b'] });
  assert.equal(p.cameraKeyframes.length, 2);
});
