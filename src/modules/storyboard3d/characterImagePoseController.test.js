import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createStoryboard3DBoneOverridesSignature,
  createStoryboard3DCharacterImagePoseController,
} from './characterImagePoseController.js';

function character(id = 'char-1') {
  return { id, type: 'character', name: '主角' };
}

function makeController(overrides = {}) {
  const states = [];
  const applied = [];
  const estimator = {
    analyzeCalls: [],
    disposeCalls: 0,
    pending: [],
    analyze(file, options) {
      this.analyzeCalls.push({ file, options });
      const deferred = {};
      deferred.promise = new Promise((resolve, reject) => {
        deferred.resolve = resolve;
        deferred.reject = reject;
      });
      this.pending.push(deferred);
      return deferred.promise;
    },
    dispose() {
      this.disposeCalls += 1;
    },
  };
  const characterStore = new Map([[character().id, character()]]);
  const controller = createStoryboard3DCharacterImagePoseController({
    estimator,
    retarget: overrides.retarget || (() => ({ boneOverrides: {}, confidence: 0, warnings: [] })),
    getCharacter: (id) => characterStore.get(id) ?? null,
    applyPose: (payload) => {
      applied.push(payload);
      return Promise.resolve();
    },
    onStateChange: (state) => states.push(state),
    ...overrides.controller,
  });
  return { controller, estimator, states, applied, characterStore };
}

function poseWithBones(count, { confidence = 0.8, warnings = [] } = {}) {
  const boneOverrides = {};
  for (let index = 0; index < count; index += 1) boneOverrides['bone_' + index] = [index, 0, 0, 1];
  return { boneOverrides, confidence, warnings };
}

test('图像姿势控制器：签名对键排序并把分量收敛到 8 位小数', () => {
  assert.equal(createStoryboard3DBoneOverridesSignature(null), '[]');
  assert.equal(createStoryboard3DBoneOverridesSignature({}), '[]');
  assert.equal(
    createStoryboard3DBoneOverridesSignature({ b: [1, 0.123456789], a: [2] }),
    '[["a",[2]],["b",[1,0.12345679]]]',
  );
  // 非数组值与缺省分量一律折叠为空数组。
  assert.equal(createStoryboard3DBoneOverridesSignature({ a: 'x' }), '[["a",[]]]');
  assert.equal(createStoryboard3DBoneOverridesSignature({ a: [0.1, 0.2, 0.3, 0.4] }).includes('0.1'), true);
});

test('图像姿势控制器：缺少必需回调直接抛 TypeError', () => {
  assert.throws(
    () => createStoryboard3DCharacterImagePoseController({ applyPose: () => {} }),
    /getCharacter is required\./,
  );
  assert.throws(
    () => createStoryboard3DCharacterImagePoseController({ getCharacter: () => null }),
    /applyPose is required\./,
  );
});

test('图像姿势控制器：成功路径写入姿势并广播 running→success', async () => {
  const { controller, estimator, states, applied } = makeController({
    retarget: () => poseWithBones(6, { confidence: 0.75, warnings: ['低置信度骨骼'] }),
  });
  const promise = controller.extract({ objectId: 'char-1', file: { name: 'ref.png' } });
  assert.equal(estimator.analyzeCalls.length, 1);
  assert.equal(estimator.analyzeCalls[0].file.name, 'ref.png');
  assert.equal(states[0].status, 'running');
  assert.equal(states[0].fileName, 'ref.png');
  assert.ok(Object.isFrozen(states[0]));

  estimator.pending[0].resolve({ landmarks: [] });
  const result = await promise;

  assert.equal(applied.length, 1);
  assert.equal(applied[0].objectId, 'char-1');
  assert.equal(Object.keys(applied[0].boneOverrides).length, 6);
  assert.equal(applied[0].confidence, 0.75);
  assert.deepEqual(applied[0].warnings, ['低置信度骨骼']);

  assert.equal(result.state.status, 'success');
  assert.equal(result.state.objectId, 'char-1');
  assert.equal(result.state.fileName, 'ref.png');
  assert.equal(result.state.boneCount, 6);
  assert.equal(result.state.warningCount, 1);
  assert.equal(result.state.confidence, 0.75);
  assert.equal(result.state.poseSignature, createStoryboard3DBoneOverridesSignature(result.boneOverrides));
  assert.equal(states.at(-1).status, 'success');
  assert.equal(controller.getSnapshot('char-1').status, 'success');
});

test('图像姿势控制器：可见关节不足时判失败并保留错误态', async () => {
  const { controller, estimator, states, applied } = makeController({
    retarget: () => poseWithBones(5),
  });
  const promise = controller.extract({ objectId: 'char-1', file: { name: 'ref.png' } });
  estimator.pending[0].resolve({ landmarks: [] });
  await assert.rejects(promise, (error) => {
    assert.equal(error.code, 'POSE_RETARGET_INSUFFICIENT');
    assert.match(error.message, /可见关节太少/);
    return true;
  });
  assert.equal(applied.length, 0);
  assert.equal(states.at(-1).status, 'error');
  assert.match(states.at(-1).error, /可见关节太少/);
  assert.equal(controller.getSnapshot('char-1').status, 'error');
});

test('图像姿势控制器：目标人物不存在或识别中途被移除', async () => {
  const { controller, estimator, characterStore } = makeController({
    retarget: () => poseWithBones(6),
  });
  await assert.rejects(
    controller.extract({ objectId: 'ghost', file: { name: 'a.png' } }),
    (error) => error.code === 'POSE_CHARACTER_NOT_FOUND' && /目标人物已不存在/.test(error.message),
  );

  const promise = controller.extract({ objectId: 'char-1', file: { name: 'a.png' } });
  characterStore.clear();
  estimator.pending[0].resolve({ landmarks: [] });
  await assert.rejects(promise, (error) => {
    assert.equal(error.code, 'POSE_CHARACTER_NOT_FOUND');
    assert.match(error.message, /识别完成前目标人物已被移除/);
    return true;
  });
});

test('图像姿势控制器：中止信号回 idle 且不抛错', async () => {
  const { controller, estimator, states } = makeController();
  const promise = controller.extract({ objectId: 'char-1', file: { name: 'a.png' } });
  const abortError = new Error('aborted');
  abortError.name = 'AbortError';
  estimator.pending[0].reject(abortError);
  assert.equal(await promise, null);
  assert.equal(states.at(-1).status, 'idle');
});

test('图像姿势控制器：其它失败写入错误文案并原样上抛', async () => {
  const { controller, estimator, states } = makeController();
  const promise = controller.extract({ objectId: 'char-1', file: { name: 'a.png' } });
  const failure = new Error('推理器崩溃');
  estimator.pending[0].reject(failure);
  await assert.rejects(promise, (error) => error === failure);
  assert.equal(states.at(-1).status, 'error');
  assert.equal(states.at(-1).error, '推理器崩溃');
});

test('图像姿势控制器：后发请求顶替前一个并让前者返回 null', async () => {
  const { controller, estimator } = makeController({ retarget: () => poseWithBones(6) });
  const first = controller.extract({ objectId: 'char-1', file: { name: '1.png' } });
  const second = controller.extract({ objectId: 'char-1', file: { name: '2.png' } });
  assert.equal(estimator.analyzeCalls.length, 2);
  assert.equal(estimator.analyzeCalls[0].options.signal.aborted, true);
  assert.equal(estimator.analyzeCalls[0].options.signal.reason, '开始新的姿势识别。');

  estimator.pending[1].resolve({ landmarks: [] });
  const secondResult = await second;
  assert.equal(secondResult.state.status, 'success');
  assert.equal(secondResult.state.fileName, '2.png');

  estimator.pending[0].resolve({ landmarks: [] });
  assert.equal(await first, null);
});

test('图像姿势控制器：clear 中止同名在途请求并回到 idle', async () => {
  const { controller, estimator } = makeController();
  const promise = controller.extract({ objectId: 'char-1', file: { name: 'a.png' } });
  const cleared = controller.clear('char-1');
  assert.equal(cleared.status, 'idle');
  assert.equal(cleared.objectId, 'char-1');
  assert.equal(estimator.analyzeCalls[0].options.signal.aborted, true);
  assert.equal(estimator.analyzeCalls[0].options.signal.reason, '姿势已重置。');
  estimator.pending[0].resolve({ landmarks: [] });
  assert.equal(await promise, null);

  // 不同目标的 clear 不影响快照查询语义。
  assert.equal(controller.clear().objectId, '');
  assert.deepEqual(controller.getSnapshot('unknown'), {
    status: 'idle',
    objectId: 'unknown',
    fileName: '',
    confidence: 0,
    boneCount: 0,
    warningCount: 0,
    poseSignature: '',
    error: '',
  });
});

test('图像姿势控制器：dispose 后拒绝新请求并清空快照', async () => {
  const { controller, estimator, states } = makeController();
  controller.dispose();
  assert.equal(controller.disposed, true);
  assert.equal(estimator.disposeCalls, 1);
  await assert.rejects(
    controller.extract({ objectId: 'char-1', file: { name: 'a.png' } }),
    (error) => error.code === 'POSE_CONTROLLER_DISPOSED' && /姿势识别器已关闭/.test(error.message),
  );
  // 重复 dispose 为空操作，clear 仍可用。
  controller.dispose();
  assert.equal(estimator.disposeCalls, 1);
  assert.equal(controller.clear('char-1').status, 'idle');
  assert.ok(states.every((state) => Object.isFrozen(state)));
});

test('图像姿势控制器：识别完成前关闭编辑器时在途请求返回 null', async () => {
  const { controller, estimator } = makeController({ retarget: () => poseWithBones(6) });
  const promise = controller.extract({ objectId: 'char-1', file: { name: 'a.png' } });
  controller.dispose();
  estimator.pending[0].resolve({ landmarks: [] });
  assert.equal(await promise, null);
});
