import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DIRECTOR_AXIS_VIEWS,
  findDirectorObstacleRoute,
  sampleDirectorGroundRoute,
  transformDirectorScene,
} from './directorSceneAuthoring.js';

function closeTo(actual, expected, label = 'value', epsilon = 1e-9) {
  assert.equal(actual.length, expected.length, label + ' 长度');
  for (let index = 0; index < expected.length; index += 1) {
    assert.ok(
      Math.abs(actual[index] - expected[index]) <= epsilon,
      `${label}[${index}] 期望 ${expected[index]} 实际 ${actual[index]}`,
    );
  }
}

function baseScene() {
  return {
    objects: [{ id: 'a', transform: { position: [1, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } }],
    shots: [
      {
        camera: { position: [0, 1, 5], target: [0, 0, 0] },
        animation: {
          cameraKeyframes: [],
          objectTracks: [],
          cameraConstraint: { followOffset: [0, 0, 0], lookAtOffset: [0, 0, 1] },
        },
      },
    ],
    directorSettings: { groundHeight: 1.5 },
  };
}

test('导演编排：六向轴视图与俯仰角', () => {
  assert.equal(DIRECTOR_AXIS_VIEWS.length, 6);
  assert.deepEqual(
    DIRECTOR_AXIS_VIEWS.map((entry) => entry[0]),
    ['front', 'back', 'left', 'right', 'top', 'bottom'],
  );
  assert.deepEqual(
    DIRECTOR_AXIS_VIEWS.map((entry) => entry[1]),
    ['前', '后', '左', '右', '上', '下'],
  );
  const byKey = Object.fromEntries(DIRECTOR_AXIS_VIEWS.map((entry) => [entry[0], entry]));
  assert.deepEqual(byKey.front.slice(2), [0, 0]);
  closeTo(byKey.back.slice(2), [Math.PI, 0]);
  closeTo(byKey.left.slice(2), [-Math.PI / 2, 0]);
  closeTo(byKey.right.slice(2), [Math.PI / 2, 0]);
  closeTo(byKey.top.slice(2), [0, Math.PI / 2 - 0.0001]);
  closeTo(byKey.bottom.slice(2), [0, -Math.PI / 2 + 0.0001]);
});

test('导演编排：贴地采样按步长插值并叠加高程', () => {
  const route = [
    [0, 0, 0],
    [0, 0, 1],
  ];
  const sampled = sampleDirectorGroundRoute(route, (_x, z) => z, 0, 0.25);
  assert.equal(sampled.length, 5);
  closeTo(sampled[0], [0, 0, 0]);
  closeTo(sampled[1], [0, 0.25, 0.25]);
  closeTo(sampled[2], [0, 0.5, 0.5]);
  closeTo(sampled[3], [0, 0.75, 0.75]);
  closeTo(sampled[4], [0, 1, 1]);

  const offset = sampleDirectorGroundRoute(route, () => 0, 2, 0.25);
  closeTo(offset[0], [0, 2, 0]);
  closeTo(offset[4], [0, 2, 1]);
});

test('导演编排：多段路线去重首点', () => {
  const multi = sampleDirectorGroundRoute(
    [
      [0, 0, 0],
      [0, 0, 1],
      [0, 0, 2],
    ],
    () => 0,
    0,
    0.5,
  );
  assert.equal(multi.length, 5);
  closeTo(
    multi.map((point) => point[2]),
    [0, 0.5, 1, 1.5, 2],
  );
});

test('导演编排：贴地采样超过 100 点抛错', () => {
  assert.throws(
    () =>
      sampleDirectorGroundRoute(
        [
          [0, 0, 0],
          [0, 0, 25],
        ],
        () => 0,
        0,
        0.25,
      ),
    /路径过长/,
  );
});

test('导演编排：整体变换校验参数与锁定对象', () => {
  const scene = baseScene();
  assert.throws(() => transformDirectorScene(scene, { scale: 0 }), /整体变换参数无效/);
  assert.throws(() => transformDirectorScene(scene, { scale: 100.5 }), /整体变换参数无效/);
  assert.throws(() => transformDirectorScene(scene, { x: Number.NaN }), /整体变换参数无效/);
  assert.throws(() => transformDirectorScene({}, { yaw: Number.POSITIVE_INFINITY }), /整体变换参数无效/);

  const locked = baseScene();
  locked.objects[0].locked = true;
  assert.throws(() => transformDirectorScene(locked), /场景含锁定对象/);
});

test('导演编排：整体变换平移缩放与地面高度且不改动入参', () => {
  const scene = baseScene();
  const snapshot = baseScene();
  const out = transformDirectorScene(scene, { x: 1, y: 2, z: 3, scale: 2 });
  closeTo(out.objects[0].transform.position, [3, 2, 3]);
  assert.deepEqual(out.objects[0].transform.scale, [2, 2, 2]);
  closeTo(out.shots[0].camera.position, [1, 4, 13]);
  closeTo(out.shots[0].camera.target, [1, 2, 3]);
  closeTo(out.shots[0].animation.cameraConstraint.followOffset, [0, 0, 0]);
  closeTo(out.shots[0].animation.cameraConstraint.lookAtOffset, [0, 0, 2]);
  assert.equal(out.directorSettings.groundHeight, 5);
  assert.deepEqual(scene, snapshot);
  assert.notEqual(out, scene);
});

test('导演编排：整体变换传播到关键帧与轨道', () => {
  const scene = baseScene();
  scene.shots[0].animation.cameraKeyframes = [
    { camera: { position: [1, 0, 0], target: [1, 0, 1] }, inTangent: [1, 0, 0] },
  ];
  scene.shots[0].animation.objectTracks = [
    {
      positionKeyframes: [{ value: [0, 0, 1], outTangent: [0, 0, 1] }],
      rotationKeyframes: [{ value: [0, 0, 0] }],
      scaleKeyframes: [{ value: [1, 1, 1] }],
    },
  ];
  const out = transformDirectorScene(scene, { scale: 2 });
  closeTo(out.shots[0].animation.cameraKeyframes[0].camera.position, [2, 0, 0]);
  closeTo(out.shots[0].animation.cameraKeyframes[0].camera.target, [2, 0, 2]);
  closeTo(out.shots[0].animation.cameraKeyframes[0].inTangent, [2, 0, 0]);

  const track = out.shots[0].animation.objectTracks[0];
  closeTo(track.positionKeyframes[0].value, [0, 0, 2]);
  closeTo(track.positionKeyframes[0].outTangent, [0, 0, 2]);
  closeTo(track.rotationKeyframes[0].value, [0, 0, 0]);
  assert.deepEqual(track.scaleKeyframes[0].value, [2, 2, 2]);
});

test('导演编排：整体变换绕 Y 轴偏航', () => {
  const out = transformDirectorScene(baseScene(), { yaw: 90 });
  closeTo(out.objects[0].transform.position, [0, 0, -1]);
  closeTo(out.objects[0].transform.rotation, [0, Math.PI / 2, 0]);
  closeTo(out.shots[0].camera.position, [5, 1, 0]);
  assert.equal(out.directorSettings.groundHeight, 1.5);
});

const BLOCKING_OBSTACLE = { min: [0.5, 0, -0.5], max: [1.5, 1, 0.5] };

function insideBlockedRegion(point) {
  return point[0] >= 0.5 - 0.4 && point[0] <= 1.5 + 0.4 && point[2] >= -0.5 - 0.4 && point[2] <= 0.5 + 0.4;
}

test('导演编排：避障路线返回首尾并绕行障碍', () => {
  const start = [0, 0, 0];
  const end = [2, 0, 0];
  const route = findDirectorObstacleRoute(start, end, [BLOCKING_OBSTACLE], { step: 1, clearance: 0.4 });
  assert.ok(route.length >= 3, '应产生绕行控制点');
  assert.deepEqual(route[0], start);
  assert.deepEqual(route[route.length - 1], end);
  for (const point of route) assert.equal(insideBlockedRegion(point), false);
});

test('导演编排：无障碍时首尾直连', () => {
  const route = findDirectorObstacleRoute([0, 0, 0], [2, 0, 0], [], { step: 1, clearance: 0 });
  assert.deepEqual(route, [
    [0, 0, 0],
    [2, 0, 0],
  ]);
});

test('导演编排：起点或终点落在障碍内抛错', () => {
  assert.throws(
    () => findDirectorObstacleRoute([1, 0, 0], [2, 0, 0], [BLOCKING_OBSTACLE], { step: 1, clearance: 0.4 }),
    /路线起点或终点位于障碍物内/,
  );
});

test('导演编排：终点被障碍围死导致无路可通抛错', () => {
  // 搜索网格总会在障碍外扩 margin，因此单块墙总能被绕过；
  // 用四块障碍围住终点格子（自身不被占用）才能形成真正的不可达。
  const ring = [
    { min: [1, -1, -1], max: [1, 1, 1] },
    { min: [3, -1, -1], max: [3, 1, 1] },
    { min: [1, -1, 1], max: [3, 1, 1] },
    { min: [1, -1, -1], max: [3, 1, -1] },
  ];
  assert.throws(
    () => findDirectorObstacleRoute([0, 0, 0], [2, 0, 0], ring, { step: 1, clearance: 0 }),
    /找不到可通行路线/,
  );
  // 同一组障碍下终点落在障碍内时改报起点/终点错误
  assert.throws(
    () => findDirectorObstacleRoute([0, 0, 0], [2, 0, 1], ring, { step: 1, clearance: 0 }),
    /路线起点或终点位于障碍物内/,
  );
});

test('导演编排：避障网格过大抛错', () => {
  assert.throws(() => findDirectorObstacleRoute([0, 0, 0], [10000, 0, 0], [], { step: 0.5 }), /避障区域过大/);
});
