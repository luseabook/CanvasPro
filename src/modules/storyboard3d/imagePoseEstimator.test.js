import assert from 'node:assert/strict';
import test from 'node:test';

import {
  STORYBOARD_3D_IMAGE_POSE_WORKER_URL,
  createStoryboard3DImagePoseEstimator,
} from './imagePoseEstimator.js';

function poseFile(overrides = {}) {
  return {
    type: 'image/png',
    name: 'pose.png',
    size: 1024,
    arrayBuffer: async () => new ArrayBuffer(4),
    ...overrides,
  };
}

class FakeWorker {
  static instances = [];

  constructor(url, options) {
    this.url = url;
    this.options = options;
    this.listeners = new Map();
    this.posted = [];
    this.terminated = false;
    this.throwOnPost = false;
    FakeWorker.instances.push(this);
  }

  addEventListener(type, handler) {
    const list = this.listeners.get(type) || [];
    list.push(handler);
    this.listeners.set(type, list);
  }

  removeEventListener(type, handler) {
    const list = this.listeners.get(type) || [];
    const index = list.indexOf(handler);
    if (index >= 0) list.splice(index, 1);
  }

  postMessage(message) {
    if (this.throwOnPost) throw new Error('post failed');
    this.posted.push(message);
  }

  terminate() {
    this.terminated = true;
  }

  emit(type, event) {
    for (const handler of [...(this.listeners.get(type) || [])]) handler(event);
  }
}

function makeEstimator(options = {}) {
  return createStoryboard3DImagePoseEstimator({ WorkerConstructor: FakeWorker, ...options });
}

function latestWorker() {
  return FakeWorker.instances[FakeWorker.instances.length - 1];
}

test('姿势估计：Worker 地址指向本地 landmarker 脚本', () => {
  assert.ok(STORYBOARD_3D_IMAGE_POSE_WORKER_URL instanceof URL);
  assert.match(STORYBOARD_3D_IMAGE_POSE_WORKER_URL.pathname, /imagePoseLandmarker\.worker\.js$/);
});

test('姿势估计：同步校验图片类型、空文件与体积上限', () => {
  const estimator = makeEstimator();
  assert.throws(
    () => estimator.analyze({ type: 'image/gif', name: 'a.gif', size: 10 }),
    /请选择 JPG、PNG 或 WebP 图片/,
  );
  assert.throws(() => estimator.analyze({ name: 'a.png', size: 0 }), /图片为空或无法读取/);
  assert.throws(() => estimator.analyze({ name: 'a.png', size: 25 * 1024 * 1024 }), /图片不能超过 24 MB/);
  assert.equal(estimator.pendingCount, 0);
});

test('姿势估计：已中止信号直接拒绝', async () => {
  const estimator = makeEstimator();
  const reason = new Error('stop');
  await assert.rejects(
    () => estimator.analyze(poseFile(), { signal: { aborted: true, reason } }),
    (error) => {
      assert.equal(error.name, 'AbortError');
      assert.equal(error.code, 'ABORT_ERR');
      assert.equal(error.message, 'stop');
      return true;
    },
  );
});

test('姿势估计：无 Worker 支持时报告不可用', async () => {
  const estimator = createStoryboard3DImagePoseEstimator({ WorkerConstructor: null, workerFactory: null });
  await assert.rejects(
    () => estimator.analyze(poseFile()),
    (error) => {
      assert.equal(error.code, 'POSE_WORKER_UNAVAILABLE');
      assert.match(error.message, /当前运行环境不支持本地姿势识别 Worker/);
      return true;
    },
  );
});

test('姿势估计：Worker 启动失败与实例缺 postMessage 分别报错', async () => {
  const throwing = createStoryboard3DImagePoseEstimator({
    workerFactory: () => {
      const error = new Error('boom');
      error.code = 'E_BOOT';
      throw error;
    },
  });
  await assert.rejects(
    () => throwing.analyze(poseFile()),
    (error) => {
      assert.equal(error.code, 'E_BOOT');
      assert.equal(error.message, 'boom');
      return true;
    },
  );

  const empty = createStoryboard3DImagePoseEstimator({ workerFactory: () => ({ terminate() {} }) });
  await assert.rejects(
    () => empty.analyze(poseFile()),
    (error) => {
      assert.equal(error.code, 'POSE_WORKER_UNAVAILABLE');
      assert.match(error.message, /本地姿势识别 Worker 不可用/);
      return true;
    },
  );
});

test('姿势估计：正常结果回填并清空待处理', async () => {
  const estimator = makeEstimator();
  const pending = estimator.analyze(poseFile());
  const worker = latestWorker();
  assert.equal(worker.options.type, 'module');
  assert.equal(worker.options.name, 'storyboard3d-image-pose');
  assert.equal(estimator.pendingCount, 1);
  const message = worker.posted.at(-1);
  assert.equal(message.type, 'estimate');
  assert.equal(message.image.name, 'pose.png');
  assert.equal(typeof message.requestId, 'string');

  worker.emit('message', {
    data: { type: 'result', requestId: message.requestId, payload: { poses: ['a'] } },
  });
  assert.deepEqual(await pending, { poses: ['a'] });
  assert.equal(estimator.pendingCount, 0);
  assert.equal(worker.terminated, false);
});

test('姿势估计：Worker 错误消息保留码与文案', async () => {
  const estimator = makeEstimator();
  const pending = estimator.analyze(poseFile());
  const worker = latestWorker();
  const { requestId } = worker.posted.at(-1);
  worker.emit('message', {
    data: { type: 'error', requestId, error: { code: 'POSE_FAIL', message: '识别失败' } },
  });
  await assert.rejects(
    () => pending,
    (error) => {
      assert.equal(error.code, 'POSE_FAIL');
      assert.equal(error.message, '识别失败');
      return true;
    },
  );
  assert.equal(estimator.pendingCount, 0);
});

test('姿势估计：Worker 异常退出拒绝全部待处理并终止', async () => {
  const estimator = makeEstimator();
  const first = estimator.analyze(poseFile());
  const second = estimator.analyze(poseFile());
  const worker = latestWorker();
  assert.equal(estimator.pendingCount, 2);
  worker.emit('error', { message: 'crash' });
  const check = (error) => {
    assert.equal(error.code, 'POSE_ESTIMATION_FAILED');
    assert.equal(error.message, 'crash');
    return true;
  };
  await assert.rejects(() => first, check);
  await assert.rejects(() => second, check);
  assert.equal(estimator.pendingCount, 0);
  assert.equal(worker.terminated, true);
});

test('姿势估计：超时拒绝并终止 Worker', async () => {
  const estimator = makeEstimator({ requestTimeoutMs: 10 });
  const pending = estimator.analyze(poseFile());
  const worker = latestWorker();
  await assert.rejects(
    () => pending,
    (error) => {
      assert.equal(error.code, 'POSE_ESTIMATION_TIMEOUT');
      assert.match(error.message, /本地姿势识别超时/);
      return true;
    },
  );
  assert.equal(worker.terminated, true);
  assert.equal(estimator.pendingCount, 0);
});

test('姿势估计：发送失败被捕获并拒绝', async () => {
  const estimator = createStoryboard3DImagePoseEstimator({
    workerFactory: () => {
      const worker = new FakeWorker();
      worker.throwOnPost = true;
      return worker;
    },
  });
  await assert.rejects(
    () => estimator.analyze(poseFile()),
    (error) => {
      assert.equal(error.code, 'POSE_ESTIMATION_FAILED');
      assert.match(error.message, /post failed/);
      return true;
    },
  );
});

test('姿势估计：取消仅在有待处理任务时生效', async () => {
  const estimator = makeEstimator({ requestTimeoutMs: 0 });
  assert.equal(estimator.cancel(), false);
  const pending = estimator.analyze(poseFile());
  assert.equal(estimator.pendingCount, 1);
  assert.equal(estimator.cancel(), true);
  await assert.rejects(
    () => pending,
    (error) => {
      assert.equal(error.name, 'AbortError');
      assert.equal(error.code, 'ABORT_ERR');
      assert.equal(error.message, '姿势识别已取消。');
      return true;
    },
  );
  assert.equal(estimator.cancel(), false);
});

test('姿势估计：关闭后拒绝待处理与后续请求', async () => {
  const estimator = makeEstimator({ requestTimeoutMs: 0 });
  const pending = estimator.analyze(poseFile());
  assert.equal(estimator.disposed, false);
  estimator.dispose();
  assert.equal(estimator.disposed, true);
  await assert.rejects(
    () => pending,
    (error) => {
      assert.equal(error.name, 'AbortError');
      assert.equal(error.message, '编辑器已关闭。');
      return true;
    },
  );
  await assert.rejects(
    () => estimator.analyze(poseFile()),
    (error) => {
      assert.equal(error.name, 'AbortError');
      assert.equal(error.message, '姿势识别器已关闭。');
      return true;
    },
  );
  assert.equal(estimator.pendingCount, 0);
});

test('姿势估计：兼容 on<event> 事件回调式 Worker', async () => {
  const legacy = {
    onmessage: null,
    onerror: null,
    posted: [],
    terminated: false,
    postMessage(message) {
      this.posted.push(message);
    },
    terminate() {
      this.terminated = true;
    },
  };
  const estimator = createStoryboard3DImagePoseEstimator({ workerFactory: () => legacy });
  const pending = estimator.analyze(poseFile());
  assert.equal(typeof legacy.onmessage, 'function');
  assert.equal(typeof legacy.onerror, 'function');
  legacy.onmessage({ data: { type: 'result', requestId: legacy.posted[0].requestId, payload: 'ok' } });
  assert.equal(await pending, 'ok');
  assert.equal(estimator.pendingCount, 0);
});
