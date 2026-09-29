import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createAudioVoiceInitialAnalysisProgress,
  getAudioVoiceAnalyzeErrorMessage,
  recoverAudioVoiceLocalAsrRuntime,
} from './audioVoiceRuntimeRepairFlow.js';

const ASR_FAILURE = new Error('python runtime is unavailable');
const text = (key) => `i18n:${key}`;

function createHarness(overrides = {}) {
  const calls = { toasts: [], confirm: [], states: [], tracked: [], installed: [] };
  const harness = {
    calls,
    message: '分析失败',
    nodeId: 'n1',
    canCommit: () => true,
    confirmAction: async (options) => {
      calls.confirm.push(options);
      return harness.confirmResult;
    },
    analysisSession: {
      trackTask: (operation, task) => calls.tracked.push([operation, task]),
    },
    operation: 'op-1',
    progressTracker: {
      install: (task) => calls.installed.push(task),
      clear: () => calls.installed.push('cleared'),
    },
    windowObject: {
      showToast: (message, kind) => calls.toasts.push([message, kind]),
    },
    setAnalysisState: (state, detail) => calls.states.push([state, detail]),
    text,
    confirmResult: true,
    ...overrides,
  };
  return harness;
}

test('audioVoiceRuntimeRepairFlow: 识别 API Key 与权限类错误并映射成专门文案', () => {
  const getErrorMessage = (error) => error.message;
  assert.equal(
    getAudioVoiceAnalyzeErrorMessage(new Error('Invalid x-api-key'), { getErrorMessage, text }),
    'i18n:toasts.asrApiKeyInvalid',
  );
  assert.equal(
    getAudioVoiceAnalyzeErrorMessage(new Error('403 permission denied'), { getErrorMessage, text }),
    'i18n:toasts.asrPermissionDenied',
  );
  assert.equal(
    getAudioVoiceAnalyzeErrorMessage(new Error('随便什么错'), { getErrorMessage, text }),
    '随便什么错',
  );
  const custom = getAudioVoiceAnalyzeErrorMessage(new Error('not authorized'), {
    getErrorMessage,
    text,
    authErrorKeys: { permissionDenied: 'custom.permission' },
  });
  assert.equal(custom, 'i18n:custom.permission');
});

test('audioVoiceRuntimeRepairFlow: 初始进度按本地/云端分流', () => {
  assert.deepEqual(createAudioVoiceInitialAnalysisProgress({ isLocal: true, text }), {
    stage: 'model-download',
    progress: 0,
    message: 'i18n:progress.model-download',
  });
  assert.deepEqual(createAudioVoiceInitialAnalysisProgress({ isLocal: false, text }), {
    stage: 'model-prepare',
    progress: 0,
    message: 'i18n:progress.model-prepare',
  });
});

test('audioVoiceRuntimeRepairFlow: 已尝试过修复或非运行时故障时只提示不修复', async () => {
  const retried = createHarness();
  assert.equal(
    await recoverAudioVoiceLocalAsrRuntime({ ...retried, error: ASR_FAILURE, repairAttempted: true, repair: async () => true }),
    false,
  );
  assert.deepEqual(retried.calls.toasts, [[retried.message, 'error']]);

  const plain = createHarness();
  assert.equal(
    await recoverAudioVoiceLocalAsrRuntime({ ...plain, error: new Error('普通失败'), repair: async () => true }),
    false,
  );
  assert.deepEqual(plain.calls.toasts, [[plain.message, 'error']]);
  assert.equal(plain.calls.confirm.length, 0, '不弹修复确认');
});

test('audioVoiceRuntimeRepairFlow: 用户拒绝修复时提示并返回 false', async () => {
  const harness = createHarness({ confirmResult: false });
  assert.equal(
    await recoverAudioVoiceLocalAsrRuntime({ ...harness, error: ASR_FAILURE, repair: async () => true }),
    false,
  );
  assert.equal(harness.calls.confirm.length, 1, '弹过一次修复确认');
  assert.deepEqual(harness.calls.toasts, [[harness.message, 'error']]);
  assert.equal(harness.calls.states.length, 0);
});

test('audioVoiceRuntimeRepairFlow: 修复流程会先置分析态再汇报进度', async () => {
  const harness = createHarness();
  const startedTask = { taskId: 't-9' };
  const result = await recoverAudioVoiceLocalAsrRuntime({
    ...harness,
    error: ASR_FAILURE,
    repair: async ({ nodeId, onTaskStarted }) => {
      onTaskStarted(startedTask);
      return true;
    },
  });
  assert.equal(result, true);
  assert.deepEqual(harness.calls.states, [['analyzing', { stage: 'asr-runtime-check', progress: 0 }]]);
  assert.deepEqual(harness.calls.tracked, [['op-1', startedTask]]);
  assert.deepEqual(harness.calls.installed, [startedTask]);
  assert.equal(harness.calls.toasts.length, 0);
});

test('audioVoiceRuntimeRepairFlow: 修复失败会清进度、置错误态并提示原因', async () => {
  const harness = createHarness();
  const result = await recoverAudioVoiceLocalAsrRuntime({
    ...harness,
    error: ASR_FAILURE,
    repair: async () => {
      throw new Error('下载模型失败');
    },
  });
  assert.equal(result, false);
  assert.deepEqual(harness.calls.installed, ['cleared']);
  assert.deepEqual(harness.calls.states, [
    ['analyzing', { stage: 'asr-runtime-check', progress: 0 }],
    ['error', null],
  ]);
  assert.deepEqual(harness.calls.toasts, [['i18n:runtimeRepair.failed', 'error']]);
});

test('audioVoiceRuntimeRepairFlow: 修复过程中失去提交资格时静默返回 false', async () => {
  let canCommit = true;
  const harness = createHarness({ canCommit: () => canCommit });
  const result = await recoverAudioVoiceLocalAsrRuntime({
    ...harness,
    error: ASR_FAILURE,
    repair: async () => {
      canCommit = false;
      return true;
    },
  });
  assert.equal(result, false);
  assert.equal(harness.calls.toasts.length, 0, '不打扰用户');
});
