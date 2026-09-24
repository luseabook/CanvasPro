import assert from 'node:assert/strict';
import test from 'node:test';
import {
  STORYBOARD_3D_MODEL_IMPORT_JOB_STATUSES,
  Storyboard3DModelImportJob,
  Storyboard3DModelImportJobError,
  createStoryboard3DModelImportJob,
  disposeCancelledStoryboard3DModelImportResult,
  normalizeStoryboard3DModelImportJobError,
  yieldStoryboard3DModelImportStart,
} from './modelImportJob.js';

function fileLike(name, byteLength = 8, overrides = {}) {
  const buffer = new ArrayBuffer(byteLength);
  return {
    name,
    type: 'model/gltf-binary',
    size: byteLength,
    lastModified: 7,
    async arrayBuffer() {
      return buffer;
    },
    ...overrides,
  };
}

function parsedResult(marker = 'parsed') {
  return {
    marker,
    disposeResourcesCount: 0,
    disposeResources() {
      this.disposeResourcesCount += 1;
    },
  };
}

test('模型导入任务：状态集合是冻结的且顺序固定', () => {
  assert.ok(Object.isFrozen(STORYBOARD_3D_MODEL_IMPORT_JOB_STATUSES));
  assert.deepEqual(
    [...STORYBOARD_3D_MODEL_IMPORT_JOB_STATUSES],
    ['queued', 'reading', 'parsing', 'completed', 'error', 'cancelled'],
  );
});

test('模型导入任务：构造期校验可读文件、importModel 与 yieldControl', () => {
  assert.throws(() => new Storyboard3DModelImportJob({}), {
    name: 'TypeError',
    message: 'A readable model file is required',
  });
  assert.throws(() => new Storyboard3DModelImportJob({ file: fileLike('a.glb'), importModel: null }), {
    name: 'TypeError',
    message: /importModel must be a function/,
  });
  assert.throws(() => new Storyboard3DModelImportJob({ file: fileLike('a.glb'), yieldControl: 'nope' }), {
    name: 'TypeError',
    message: /yieldControl must be a function/,
  });
});

test('模型导入任务：成功路径按 queued→reading→parsing→completed 推进并落地结果', async () => {
  const parsed = parsedResult();
  const reasons = [];
  const progressValues = [];
  const job = createStoryboard3DModelImportJob({
    file: fileLike('scene.glb', 16),
    importModel: async () => parsed,
    yieldControl: async () => {},
    onStateChange: (_snapshot, meta) => reasons.push(meta.reason),
    onProgress: (snapshot) => progressValues.push(snapshot.progress),
  });

  assert.ok(job instanceof Storyboard3DModelImportJob);
  assert.equal(job.getSnapshot().status, 'queued');

  const result = await job.start();
  assert.equal(result, parsed);
  assert.deepEqual(reasons, ['queued', 'reading', 'parsing', 'completed']);
  assert.deepEqual(progressValues, [0, 0.12, 0.55, 1]);

  const snapshot = job.getSnapshot();
  assert.equal(snapshot.status, 'completed');
  assert.equal(snapshot.progress, 1);
  assert.equal(snapshot.result, parsed);
  assert.equal(snapshot.fileName, 'scene.glb');
  assert.equal(snapshot.format, 'glb');
  assert.equal(snapshot.error, null);
  assert.notEqual(job.getSnapshot(), job.getSnapshot());
});

test('模型导入任务：start 幂等返回同一个 runPromise', () => {
  const job = createStoryboard3DModelImportJob({
    file: fileLike('a.glb'),
    importModel: async () => parsedResult(),
    yieldControl: async () => {},
  });
  const first = job.start();
  const second = job.start();
  assert.equal(first, second);
});

test('模型导入任务：解析器进度回调按 0.55 + 0.4 * p 折算且不倒退', async () => {
  const progressValues = [];
  const job = createStoryboard3DModelImportJob({
    file: fileLike('a.glb'),
    yieldControl: async () => {},
    onProgress: (snapshot) => progressValues.push(snapshot.progress),
    importModel: async (cached, options) => {
      options.onProgress(0.5, { stage: 'decode' });
      options.onProgress(0.25); // 倒退，应被 max 吸收
      options.onProgress(1);
      return parsedResult();
    },
  });
  await job.start();
  // 倒退的 0.25 被 max 吸收，快照仍报当前进度，因此出现重复的 0.75。
  assert.deepEqual(
    progressValues.map((value) => Number(value.toFixed(6))),
    [0, 0.12, 0.55, 0.75, 0.75, 0.95, 1],
  );
});

test('模型导入任务：文件未返回 ArrayBuffer 时以 MODEL_FILE_UNREADABLE 收尾', async () => {
  const errors = [];
  const job = createStoryboard3DModelImportJob({
    file: fileLike('a.glb', 8, { arrayBuffer: async () => 'not-a-buffer' }),
    importModel: async () => {
      throw new Error('不应被执行');
    },
    yieldControl: async () => {},
    onError: (error, snapshot) => errors.push([error, snapshot]),
  });

  await assert.rejects(
    () => job.start(),
    (error) => {
      assert.ok(error instanceof Storyboard3DModelImportJobError);
      assert.equal(error.name, 'Storyboard3DModelImportJobError');
      assert.equal(error.code, 'MODEL_FILE_UNREADABLE');
      assert.equal(error.stage, 'reading');
      assert.equal(error.cancelled, false);
      return true;
    },
  );
  assert.equal(job.getSnapshot().status, 'error');
  assert.equal(errors.length, 1);
  assert.equal(errors[0][0].code, 'MODEL_FILE_UNREADABLE');
  assert.equal(errors[0][1].status, 'error');
});

test('模型导入任务：导入器抛错时归一为 MODEL_IMPORT_FAILED 并保留原因为 cause', async () => {
  const cause = new TypeError('gltf 解析崩了');
  const job = createStoryboard3DModelImportJob({
    file: fileLike('a.glb'),
    yieldControl: async () => {},
    importModel: async () => {
      throw cause;
    },
  });
  await assert.rejects(
    () => job.start(),
    (error) => {
      assert.equal(error.code, 'MODEL_IMPORT_FAILED');
      assert.equal(error.stage, 'parsing');
      assert.equal(error.message, 'gltf 解析崩了');
      assert.equal(error.cause, cause);
      return true;
    },
  );
});

test('模型导入任务：启动前取消立即回到 cancelled，start 解析为 null 且不可重复取消', async () => {
  const job = createStoryboard3DModelImportJob({
    file: fileLike('a.glb'),
    importModel: async () => parsedResult(),
    yieldControl: async () => {},
  });
  assert.equal(job.cancel('用户取消'), true);
  const snapshot = job.getSnapshot();
  assert.equal(snapshot.status, 'cancelled');
  assert.equal(snapshot.error.code, 'MODEL_IMPORT_CANCELLED');
  assert.equal(snapshot.error.cancelled, true);
  assert.equal(snapshot.error.stage, 'queued');
  assert.equal(snapshot.error.message, '用户取消');
  assert.equal(await job.start(), null);
  assert.equal(job.cancel(), false);
});

test('模型导入任务：解析途中取消会释放已解析结果并以 cancelled 收尾', async () => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const parsed = parsedResult();
  const disposed = [];
  const job = createStoryboard3DModelImportJob({
    file: fileLike('a.glb'),
    yieldControl: async () => {},
    disposeResult: (value) => disposed.push(value),
    importModel: async () => {
      await gate;
      return parsed;
    },
  });

  const run = job.start();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(job.getSnapshot().status, 'parsing');
  job.cancel('解析中取消');
  release();

  assert.equal(await run, null);
  assert.deepEqual(disposed, [parsed]);
  assert.equal(job.getSnapshot().status, 'cancelled');
});

test('模型导入任务：外部 AbortSignal 触发取消并沿用 abort 原因', async () => {
  const controller = new AbortController();
  const job = createStoryboard3DModelImportJob({
    file: fileLike('a.glb'),
    yieldControl: async () => {},
    importModel: async () => parsedResult(),
    signal: controller.signal,
  });
  const run = job.start();
  controller.abort('外部终止');

  assert.equal(await run, null);
  const snapshot = job.getSnapshot();
  assert.equal(snapshot.status, 'cancelled');
  assert.equal(snapshot.error.cancelled, true);
  assert.equal(snapshot.error.message, '外部终止');
});

test('模型导入任务：传入已 aborted 的信号时启动即取消', async () => {
  const controller = new AbortController();
  controller.abort('已取消');
  const job = createStoryboard3DModelImportJob({
    file: fileLike('a.glb'),
    yieldControl: async () => {},
    importModel: async () => parsedResult(),
    signal: controller.signal,
  });
  assert.equal(await job.start(), null);
  assert.equal(job.getSnapshot().status, 'cancelled');
});

test('模型导入任务：取消后解除外部 abort 监听', async () => {
  const controller = new AbortController();
  const job = createStoryboard3DModelImportJob({
    file: fileLike('a.glb'),
    yieldControl: async () => {},
    importModel: async () => parsedResult(),
    signal: controller.signal,
  });
  await job.start();
  assert.equal(job._externalAbortHandler, null);
});

test('模型导入错误归一化：透传本类、识别 AbortError、兜底默认值与 stage', () => {
  const original = new Storyboard3DModelImportJobError('boom', { code: 'X', stage: 'parsing' });
  assert.equal(normalizeStoryboard3DModelImportJobError(original), original);

  const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
  const cancelled = normalizeStoryboard3DModelImportJobError(abortError, { stage: 'reading' });
  assert.equal(cancelled.code, 'MODEL_IMPORT_CANCELLED');
  assert.equal(cancelled.cancelled, true);
  assert.equal(cancelled.stage, 'reading');
  assert.equal(cancelled.cause, abortError);

  const codeOnly = Object.assign(new Error('null-byte'), { code: 'ABORT_ERR' });
  assert.equal(normalizeStoryboard3DModelImportJobError(codeOnly).cancelled, true);

  const plain = new Error('nope');
  const normalized = normalizeStoryboard3DModelImportJobError(plain, { stage: 'parsing' });
  assert.equal(normalized.code, 'MODEL_IMPORT_FAILED');
  assert.equal(normalized.message, 'nope');
  assert.equal(normalized.stage, 'parsing');
  assert.equal(normalized.cause, plain);
  assert.equal(normalized.cancelled, false);

  assert.equal(normalizeStoryboard3DModelImportJobError({}).message, 'Model import failed');
  assert.equal(normalizeStoryboard3DModelImportJobError({}, { stage: 'reading' }).stage, 'reading');
});

test('模型导入让渡控制权：优先 requestAnimationFrame，缺省回落 setTimeout(...0)', async () => {
  const rafCallbacks = [];
  const timeoutDelays = [];
  await yieldStoryboard3DModelImportStart({
    windowObject: {
      requestAnimationFrame: (callback) => {
        rafCallbacks.push(callback);
        callback();
        return 1;
      },
    },
    setTimeoutFn: (callback, delay) => {
      timeoutDelays.push(delay);
      callback();
      return 2;
    },
  });
  assert.equal(rafCallbacks.length, 1);
  assert.deepEqual(timeoutDelays, [0]);

  const fallbackDelays = [];
  await yieldStoryboard3DModelImportStart({
    windowObject: {},
    setTimeoutFn: (callback) => {
      fallbackDelays.push(1);
      callback();
    },
  });
  assert.equal(fallbackDelays.length, 1);
});

test('取消结果清理：释放 disposeResources、几何体、材质与贴图且去重', () => {
  const disposeCounts = { resources: 0, geometry: 0, material: 0, texture: 0 };
  const texture = { isTexture: true, dispose: () => (disposeCounts.texture += 1) };
  const sharedGeometry = { dispose: () => (disposeCounts.geometry += 1) };
  const material = {
    map: texture,
    color: { isTexture: false },
    dispose: () => (disposeCounts.material += 1),
  };
  const meshA = { geometry: sharedGeometry, material };
  const meshB = { geometry: sharedGeometry, material: [material] };
  const scene = { traverse: (callback) => [meshA, meshB].forEach(callback) };
  const payload = {
    scene,
    disposeResources: () => (disposeCounts.resources += 1),
  };

  disposeCancelledStoryboard3DModelImportResult(payload);

  assert.equal(disposeCounts.resources, 1);
  assert.equal(disposeCounts.geometry, 1);
  assert.equal(disposeCounts.material, 1);
  assert.equal(disposeCounts.texture, 1);
});

test('取消结果清理：接受 { parsed } 包装与缺失可选方法', () => {
  let resources = 0;
  const parsed = {
    scenes: [{ traverse: (callback) => callback({ geometry: null, material: null }) }],
    disposeResources: () => (resources += 1),
  };
  disposeCancelledStoryboard3DModelImportResult({ parsed });
  assert.equal(resources, 1);
  assert.doesNotThrow(() => disposeCancelledStoryboard3DModelImportResult(null));
  assert.doesNotThrow(() => disposeCancelledStoryboard3DModelImportResult({}));
});
