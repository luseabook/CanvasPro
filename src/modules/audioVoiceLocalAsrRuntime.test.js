import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AUDIO_VOICE_ASR_RUNTIME_INSTALL_TIMEOUT_MS,
  createAudioVoiceTaskProgressTracker,
  ensureAudioVoiceLocalAsrRuntime,
  isAudioVoiceLocalAsrRuntimeFailure,
  prepareAudioVoiceLocalAsr,
  repairAudioVoiceLocalAsrRuntime,
} from './audioVoiceLocalAsrRuntime.js';

test('audioVoiceLocalAsrRuntime: 安装超时常量与实现一致（90 分钟）', () => {
  assert.equal(AUDIO_VOICE_ASR_RUNTIME_INSTALL_TIMEOUT_MS, 5_400_000);
});

test('audioVoiceLocalAsrRuntime: 默认按 cpu 入队，taskId 去空白后回调与等待', async () => {
  const enqueued = [];
  const started = [];
  const waited = [];
  const result = await ensureAudioVoiceLocalAsrRuntime({
    nodeId: 'n1',
    enqueueTask: async (payload) => {
      enqueued.push(payload);
      return { taskId: '  t-1  ' };
    },
    onTaskStarted: (id) => started.push(id),
    waitForTask: async (id, options) => {
      waited.push([id, options]);
      return { ok: true };
    },
  });
  assert.deepEqual(enqueued, [{ kind: 'asrRuntimeInstall', nodeId: 'n1', args: { engine: 'cpu' } }]);
  assert.deepEqual(started, ['t-1']);
  assert.equal(waited.length, 1);
  assert.equal(waited[0][0], 't-1');
  assert.equal(waited[0][1].timeout, AUDIO_VOICE_ASR_RUNTIME_INSTALL_TIMEOUT_MS);
  assert.deepEqual(waited[0][1].diagnosticPayload, { kind: 'asrRuntimeInstall', nodeId: 'n1' });
  assert.deepEqual(result, { ok: true });
});

test('audioVoiceLocalAsrRuntime: engine 归一为 gpu/cpu，forceRepair 只在为 true 时带出', async () => {
  const cases = [
    ['GPU', false, { engine: 'gpu' }],
    ['  gpu  ', true, { engine: 'gpu', forceRepair: true }],
    ['anything-else', false, { engine: 'cpu' }],
    [undefined, false, { engine: 'cpu' }],
  ];
  for (const [engine, forceRepair, expectedArgs] of cases) {
    let seen = null;
    await ensureAudioVoiceLocalAsrRuntime({
      engine,
      forceRepair,
      enqueueTask: async (payload) => {
        seen = payload.args;
        return { taskId: 't' };
      },
      waitForTask: async () => ({}),
    });
    assert.deepEqual(seen, expectedArgs);
  }
});

test('audioVoiceLocalAsrRuntime: 入队没回 taskId 时抛错且不进入等待', async () => {
  let waited = 0;
  await assert.rejects(
    () =>
      ensureAudioVoiceLocalAsrRuntime({
        enqueueTask: async () => ({}),
        waitForTask: async () => {
          waited += 1;
        },
      }),
    { message: 'Subtitle recognition runtime task did not return a task ID' },
  );
  assert.equal(waited, 0);
});

test('audioVoiceLocalAsrRuntime: 失败识别覆盖 python/依赖缺失类文案', () => {
  const positives = [
    { message: 'asr python runtime is unavailable' },
    { message: 'funasr runtime is not bundled' },
    { message: 'nvidia nemo is not installed' },
    { message: 'sortformer runtime is unavailable' },
    { message: 'No module named torchaudio' },
    { message: 'ModuleNotFoundError: funasr' },
    { message: 'ImportError: cannot import name x' },
    { message: 'DLL load failed while importing' },
    'modulenotfounderror',
  ];
  for (const value of positives) assert.equal(isAudioVoiceLocalAsrRuntimeFailure(value), true);
  const negatives = [
    { message: '网络超时，请重试' },
    { code: 'TIMEOUT' },
    '',
    null,
    undefined,
  ];
  for (const value of negatives) assert.equal(isAudioVoiceLocalAsrRuntimeFailure(value), false);
});

test('audioVoiceLocalAsrRuntime: prepare 与 repair 从设置读引擎，读取失败回落 cpu', async () => {
  const prepared = [];
  const prepResult = await prepareAudioVoiceLocalAsr({
    nodeId: 'n2',
    fetchSettings: async () => ({ subtitleRecognition: { engine: 'GPU' } }),
    ensureRuntime: async (options) => {
      prepared.push(options);
      return { ok: true };
    },
    onTaskStarted: () => {},
  });
  assert.deepEqual(prepared, [{ engine: 'gpu', nodeId: 'n2', onTaskStarted: prepared[0].onTaskStarted }]);
  assert.equal(typeof prepared[0].onTaskStarted, 'function');
  assert.deepEqual(prepResult, {
    diarizationProvider: 'sortformer',
    downloadModelIfMissing: true,
    engine: 'gpu',
  });

  const fallback = await prepareAudioVoiceLocalAsr({
    fetchSettings: async () => {
      throw new Error('offline');
    },
    ensureRuntime: async (options) => options,
  });
  assert.deepEqual(fallback, {
    diarizationProvider: 'sortformer',
    downloadModelIfMissing: true,
    engine: 'cpu',
  });

  const repaired = [];
  await repairAudioVoiceLocalAsrRuntime({
    fetchSettings: async () => ({ subtitleRecognition: { engine: 'gpu' } }),
    ensureRuntime: async (options) => {
      repaired.push(options);
      return options;
    },
  });
  assert.equal(repaired[0].forceRepair, true);
  assert.equal(repaired[0].engine, 'gpu');
});

test('audioVoiceLocalAsrRuntime: 进度跟踪只认自己的 taskId，并按偏移与比例线性映射', () => {
  const listeners = [];
  const seen = [];
  const tracker = createAudioVoiceTaskProgressTracker({
    getMediaTask: () => ({
      onUpdate: (callback) => {
        listeners.push(callback);
        return () => listeners.pop();
      },
    }),
    onProgress: (entry) => seen.push(entry),
  });
  tracker.install('  task-a  ', { progressOffset: 0.2, progressScale: 0.5 });
  assert.equal(listeners.length, 1);
  const emit = listeners[0];
  emit({ taskId: 'task-b', progress: 1, stage: 'x', message: 'm' });
  assert.equal(seen.length, 0, '非本任务的事件必须忽略');
  emit({ taskId: 'task-a', progress: 0.5, stage: 'asr', message: '跑着呢' });
  assert.deepEqual(seen, [{ stage: 'asr', progress: 0.2 + 0.5 * 0.5, message: '跑着呢' }]);
  emit({ taskId: 'task-a', progress: 5, stage: 'asr', message: 'x' });
  assert.equal(seen[1].progress, 0.2 + 1 * 0.5, '进度按 [0,1] 夹取');
  tracker.clear();
  assert.equal(listeners.length, 0);

  const noop = createAudioVoiceTaskProgressTracker({ getMediaTask: () => ({}) });
  assert.equal(noop.install('task-a'), undefined);
  assert.equal(noop.install('', {}), undefined);
});
