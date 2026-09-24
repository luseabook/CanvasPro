import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createStoryboard3DTransformSession,
  resolveStoryboard3DTransformConstraint,
  updateStoryboard3DTransformSession,
} from './transformSession.js';

function closeTo(actual, expected, label = 'value', epsilon = 1e-9) {
  assert.equal(actual.length, expected.length, label + ' 长度');
  for (let index = 0; index < expected.length; index += 1) {
    assert.ok(
      Math.abs(actual[index] - expected[index]) <= epsilon,
      `${label}[${index}] 期望 ${expected[index]} 实际 ${actual[index]}`,
    );
  }
}

function makeSession(overrides = {}) {
  return createStoryboard3DTransformSession({
    sceneId: 'scene-1',
    activeTool: 'move',
    initialTransforms: { a: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } },
    dragState: {},
    settings: {},
    ...overrides,
  });
}

test('变换会话：约束解析优先级', () => {
  assert.equal(resolveStoryboard3DTransformConstraint({}), 'xyz');
  assert.equal(resolveStoryboard3DTransformConstraint({ constraint: 'yx' }), 'xy');
  assert.equal(resolveStoryboard3DTransformConstraint({ constraint: 'zYx' }), 'xyz');
  assert.equal(resolveStoryboard3DTransformConstraint({ constraint: 'a' }), 'xyz');
  assert.equal(resolveStoryboard3DTransformConstraint({ mode: 'scale-uniform' }), 'xyz');
  assert.equal(resolveStoryboard3DTransformConstraint({ handleKey: 'scale-uniform' }), 'xyz');
  assert.equal(resolveStoryboard3DTransformConstraint({ handleKey: 'plane-xz' }), 'xz');
  assert.equal(resolveStoryboard3DTransformConstraint({ handleKey: 'plane-zy' }), 'yz');
  assert.equal(resolveStoryboard3DTransformConstraint({ handleKey: 'axis-y' }), 'y');
  assert.equal(resolveStoryboard3DTransformConstraint({ handleKey: 'rotate-z' }), 'z');
  assert.equal(resolveStoryboard3DTransformConstraint({ handleKey: 'scale-x' }), 'x');
});

test('变换会话：无初始变换返回 null 且未知工具回落 move', () => {
  assert.equal(createStoryboard3DTransformSession(), null);
  assert.equal(createStoryboard3DTransformSession({ initialTransforms: {} }), null);

  const session = makeSession({ activeTool: 'bogus' });
  assert.equal(session.activeTool, 'move');
  assert.equal(session.sceneId, 'scene-1');
  assert.equal(session.constraint, 'xyz');
});

test('变换会话：默认设置夹取与快照派生', () => {
  const session = makeSession();
  assert.deepEqual(session.settings, {
    groundLock: false,
    groundPositions: {},
    uniformScale: false,
    snapEnabled: false,
    translationSnap: 0.25,
    rotationSnap: Math.PI / 12,
    scaleSnap: 0.1,
  });
  assert.equal(session.pivot.x, 0);
  assert.equal(session.pivot.y, 0);
  assert.equal(session.pivot.z, 0);
  assert.equal(session.axisWorld.x, 1);
  assert.equal(session.axisWorld.y, 0);
  assert.equal(session.axisWorld.z, 0);
  assert.equal(session.gizmoQuaternion.w, 1);
  assert.equal(session.forcedUniformScale, false);
  assert.notEqual(session.initialTransforms, session.latestTransforms);
  assert.deepEqual(session.latestTransforms, session.initialTransforms);

  const explicit = makeSession({
    dragState: {
      constraint: 'y',
      pivot: { x: 1, y: 2, z: 3 },
      axisWorld: { x: 0, y: 0, z: 3 },
      gizmoQuaternion: { x: 0, y: 0, z: 0, w: 2 },
    },
  });
  assert.equal(explicit.constraint, 'y');
  assert.deepEqual([explicit.pivot.x, explicit.pivot.y, explicit.pivot.z], [1, 2, 3]);
  assert.deepEqual([explicit.axisWorld.x, explicit.axisWorld.y, explicit.axisWorld.z], [0, 0, 1]);
  assert.equal(explicit.gizmoQuaternion.w, 1);
});

test('变换会话：设置归一化与地面位置过滤', () => {
  const session = makeSession({
    settings: {
      snap: { enabled: true, translation: 0.5, rotation: 0.2, scale: 0.25 },
      groundPositions: { a: 1, b: 'nope' },
      groundLock: true,
      uniformScale: true,
    },
  });
  assert.equal(session.settings.snapEnabled, true);
  assert.equal(session.settings.translationSnap, 0.5);
  assert.equal(session.settings.rotationSnap, 0.2);
  assert.equal(session.settings.scaleSnap, 0.25);
  assert.deepEqual(session.settings.groundPositions, { a: 1 });
  assert.equal(session.settings.groundLock, true);
  assert.equal(session.settings.uniformScale, true);

  const clamped = makeSession({ settings: { translationSnap: 0, rotationSnap: -5, scaleSnap: 0 } });
  assert.equal(clamped.settings.translationSnap, 0.0001);
  assert.equal(clamped.settings.rotationSnap, 0.0001);
  assert.equal(clamped.settings.scaleSnap, 0.0001);
});

test('变换会话：移动叠加增量并支持精度', () => {
  const session = makeSession();
  const moved = updateStoryboard3DTransformSession(session, { x: 1, y: 2, z: 3 });
  assert.deepEqual(moved, { a: { position: [1, 2, 3], rotation: [0, 0, 0], scale: [1, 1, 1] } });
  assert.deepEqual(session.latestTransforms, moved);

  const precise = updateStoryboard3DTransformSession(
    makeSession(),
    { x: 1, y: 2, z: 3 },
    { precision: true },
  );
  closeTo(precise.a.position, [0.1, 0.2, 0.3]);

  const noop = updateStoryboard3DTransformSession(makeSession(), undefined);
  assert.deepEqual(noop.a.position, [0, 0, 0]);
  const partial = updateStoryboard3DTransformSession(makeSession(), { y: 4 });
  assert.deepEqual(partial.a.position, [0, 4, 0]);
});

test('变换会话：约束轴吸附与吸附开关反转', () => {
  const snapping = makeSession({
    dragState: { constraint: 'x' },
    settings: { snapEnabled: true, translationSnap: 0.5 },
  });
  assert.deepEqual(
    updateStoryboard3DTransformSession(snapping, { x: 1.3, y: 0.7, z: 0.7 }).a.position,
    [1.5, 0, 0],
  );

  const toggledOff = updateStoryboard3DTransformSession(
    makeSession({ settings: { snapEnabled: true, translationSnap: 0.5 } }),
    { x: 1.3 },
    { toggleSnap: true },
  );
  assert.deepEqual(toggledOff.a.position, [1.3, 0, 0]);

  const toggledOn = updateStoryboard3DTransformSession(
    makeSession({ settings: { snapEnabled: false, translationSnap: 0.5 } }),
    { x: 1.3 },
    { toggleSnap: true },
  );
  assert.deepEqual(toggledOn.a.position, [1.5, 0, 0]);
});

test('变换会话：地面锁定写入地面高度', () => {
  const locked = makeSession({ settings: { groundLock: true, groundPositions: { a: 2.5 } } });
  assert.deepEqual(updateStoryboard3DTransformSession(locked, { y: 5 }).a.position, [0, 2.5, 0]);

  const unlocked = makeSession({ settings: { groundLock: true, groundPositions: {} } });
  assert.deepEqual(updateStoryboard3DTransformSession(unlocked, { y: 5 }).a.position, [0, 5, 0]);
});

test('变换会话：绕轴旋转位置与朝向', () => {
  const session = createStoryboard3DTransformSession({
    activeTool: 'rotate',
    initialTransforms: { a: { position: [1, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } },
    dragState: { axisWorld: { x: 0, y: 1, z: 0 }, pivot: { x: 0, y: 0, z: 0 } },
  });
  assert.equal(session.activeTool, 'rotate');
  assert.equal(session.axisWorld.y, 1);

  const rotated = updateStoryboard3DTransformSession(session, Math.PI / 2);
  closeTo(rotated.a.position, [0, 0, -1], 'position');
  closeTo(rotated.a.rotation, [0, Math.PI / 2, 0], 'rotation');

  const preciseAngle = (Math.PI / 4) * 0.1;
  const half = updateStoryboard3DTransformSession(session, Math.PI / 4, { precision: true });
  closeTo(half.a.position, [Math.cos(preciseAngle), 0, -Math.sin(preciseAngle)], 'precision position');
  assert.notDeepEqual(half.a.position, rotated.a.position);
});

test('变换会话：缩放轴向与强制等比', () => {
  const uniform = updateStoryboard3DTransformSession(makeSession({ activeTool: 'scale' }), 2);
  assert.deepEqual(uniform.a.scale, [2, 2, 2]);
  assert.deepEqual(uniform.a.position, [0, 0, 0]);

  const axisOnly = updateStoryboard3DTransformSession(
    makeSession({ activeTool: 'scale', dragState: { constraint: 'x' } }),
    2,
  );
  assert.deepEqual(axisOnly.a.scale, [2, 1, 1]);

  const two = createStoryboard3DTransformSession({
    activeTool: 'scale',
    dragState: { constraint: 'x' },
    initialTransforms: {
      a: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      b: { position: [2, 0, 0], rotation: [0, Math.PI / 2, 0], scale: [1, 1, 1] },
    },
  });
  assert.equal(two.forcedUniformScale, true);
  const forced = updateStoryboard3DTransformSession(two, 2);
  assert.deepEqual(forced.a.scale, [2, 2, 2]);
  assert.deepEqual(forced.b.scale, [2, 2, 2]);
  assert.deepEqual(forced.b.position, [4, 0, 0]);
});

test('变换会话：空会话更新返回空对象', () => {
  assert.deepEqual(updateStoryboard3DTransformSession(null, [1, 2, 3]), {});
  assert.deepEqual(updateStoryboard3DTransformSession(undefined, [1, 2, 3]), {});
  assert.deepEqual(updateStoryboard3DTransformSession(null, 1, { precision: true }), {});
});
