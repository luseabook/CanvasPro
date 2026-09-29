import { generateVideo } from '../../api/aiVideoApi.js';
import { cancelRunningHubTask } from '../../api/runninghubTaskApi.js';
import { cancelTask, submitTask } from '../core/generationTaskRuntime.js';
import { shouldShowGenerationBusyUi } from '../core/generationTaskUiState.js';
import appStore from '../core/stores/appStore.js';
import {
  buildVideoGenerationFailurePatch,
  buildVideoGenerationResultPatch,
} from '../components/video-node/videoGenerationResultRenderer.js';
import { localPathToUrl, pickResultLocalPath } from '../utils/localMediaPath.js';
import {
  getVideoKeyingExecutionId,
  getVideoKeyingModelId,
  isVideoKeyingModel,
} from './videoKeyingManifestResolver.js';
import { getRunningHubWorkflowAccess } from './videoKeyingSettings.js';
import { buildVideoKeyingOutputText, videoKeyingText } from './videoKeyingTextHelpers.js';
export const VIDEO_KEYING_TASK_CHANGE_EVENT = 'aicanvas:video-keying-task-change';
const taskContexts = new Map();
function normalizeMode(_0x217296) {
  return _0x217296 === 'remove' ? 'remove' : 'keying';
}
function normalizeRequestedMode(_0x1c2fd9) {
  return _0x1c2fd9 === 'keying' || _0x1c2fd9 === 'remove' ? _0x1c2fd9 : '';
}
function getStateSnapshot() {
  return typeof appStore['getStateRaw'] === 'function' ? appStore['getStateRaw']() : appStore['getState']();
}
function getNode(_0x14fe39) {
  return getStateSnapshot()['nodes']?.[_0x14fe39] || null;
}
function computeGenerationDuration(_0x70637a) {
  const _0x4475b9 = Number(getNode(_0x70637a)?.['generationStartTime']);
  if (!Number['isFinite'](_0x4475b9) || _0x4475b9 <= 0x0) return 0x0;
  return Math['max'](0x0, Date['now']() - _0x4475b9);
}
function notifyTaskChange(_0x528c4d = {}) {
  try {
    globalThis['window']?.['dispatchEvent']?.(
      new CustomEvent(VIDEO_KEYING_TASK_CHANGE_EVENT, {
        detail: {
          sourceNodeId: String(_0x528c4d['sourceNodeId'] || ''),
          outId: String(_0x528c4d['outId'] || ''),
          mode: String(_0x528c4d['mode'] || ''),
        },
      }),
    );
  } catch {}
}
function resolveStoredTaskMode(_0x52177b) {
  if (!_0x52177b || typeof _0x52177b !== 'object') return '';
  if (!isVideoKeyingModel(_0x52177b['model']) || !shouldShowGenerationBusyUi(_0x52177b)) return '';
  const _0x3dac11 = String(_0x52177b['rhToolbarTaskType'] || '');
  if (_0x3dac11 === 'video-keying') return 'keying';
  if (_0x3dac11 === 'video-remove') return 'remove';
  const _0xc68d3f = String(_0x52177b['outputText'] || ''),
    _0x488e23 = String(_0x52177b['name'] || '');
  if (
    _0xc68d3f['includes']('RH视频擦除') ||
    _0xc68d3f['includes']('视频擦除') ||
    /^视频擦除/['test'](_0x488e23)
  )
    return 'remove';
  if (
    _0xc68d3f['includes']('RH视频抠像') ||
    _0xc68d3f['includes']('视频抠像') ||
    /^抠像结果\b/['test'](_0x488e23)
  )
    return 'keying';
  return '';
}
function toPublicTask(_0x5cd61a, { fromStore: fromStore = ![] } = {}) {
  if (!_0x5cd61a) return null;
  return {
    sourceNodeId: String(_0x5cd61a['sourceNodeId'] || ''),
    outId: String(_0x5cd61a['outId'] || _0x5cd61a['id'] || ''),
    taskId: String(_0x5cd61a['taskId'] || _0x5cd61a['rhTaskId'] || ''),
    mode: normalizeMode(_0x5cd61a['mode']),
    fromStore: fromStore,
  };
}
function findMemoryTask(_0xb9fe70, _0x2b7a88 = '') {
  const _0x53ffec = String(_0xb9fe70 || '')['trim']();
  if (!_0x53ffec) return null;
  for (const _0x3308b1 of taskContexts['values']()) {
    if (!_0x3308b1?.['running']) continue;
    if (_0x2b7a88 && _0x3308b1['mode'] !== _0x2b7a88) continue;
    if (
      String(_0x3308b1['sourceNodeId'] || '') === _0x53ffec ||
      String(_0x3308b1['outId'] || '') === _0x53ffec
    )
      return toPublicTask(_0x3308b1);
  }
  return null;
}
function findStoredTask(_0x381730, _0x4caaa5 = '') {
  const _0x4d328c = String(_0x381730 || '')['trim']();
  if (!_0x4d328c) return null;
  const _0x52367 = getStateSnapshot()['nodes'] || {},
    _0x1b59e5 = Object['values'](_0x52367)
      ['map']((_0x315547) => ({ node: _0x315547, mode: resolveStoredTaskMode(_0x315547) }))
      ['filter'](({ node: _0x8b385a, mode: _0x1c84be }) => {
        if (!_0x1c84be || (_0x4caaa5 && _0x1c84be !== _0x4caaa5)) return ![];
        return (
          String(_0x8b385a['id'] || '') === _0x4d328c ||
          String(_0x8b385a['rhSourceNodeId'] || '') === _0x4d328c
        );
      })
      ['sort']((_0x45eb40, _0x140062) => {
        const _0x161da9 =
            Number(_0x45eb40['node']['rhTaskStartedAt'] || _0x45eb40['node']['generationStartTime'] || 0x0) ||
            0x0,
          _0x4c7930 =
            Number(_0x140062['node']['rhTaskStartedAt'] || _0x140062['node']['generationStartTime'] || 0x0) ||
            0x0;
        return _0x4c7930 - _0x161da9;
      }),
    _0x45db87 = _0x1b59e5[0x0];
  if (!_0x45db87) return null;
  return toPublicTask(
    {
      sourceNodeId: _0x45db87['node']['rhSourceNodeId'],
      outId: _0x45db87['node']['id'],
      taskId: _0x45db87['node']['rhTaskId'],
      mode: _0x45db87['mode'],
    },
    { fromStore: !![] },
  );
}
export function getRunningVideoKeyingTaskForNode(_0x40fe9e, { mode: _0x16c190 } = {}) {
  const _0x1877bc = normalizeRequestedMode(_0x16c190);
  return findMemoryTask(_0x40fe9e, _0x1877bc) || findStoredTask(_0x40fe9e, _0x1877bc);
}
export function hasRunningVideoKeyingTaskForNode(_0x565b81, _0x5e064f = {}) {
  return !!getRunningVideoKeyingTaskForNode(_0x565b81, _0x5e064f);
}
function buildCancelledTaskPatch(_0x1bc5d4) {
  return {
    ...(_0x1bc5d4 === 'remove' ? { name: videoKeyingText('output.removeResultName') } : {}),
    isGenerating: ![],
    rhTaskStatus: 'cancelled',
    rhTaskRecovering: ![],
    outputText: buildVideoKeyingOutputText(_0x1bc5d4, 'cancelled'),
  };
}
function getTaskFailureMessage(_0x1b74de, _0x382e6d) {
  return typeof _0x382e6d?.['getUserMessage'] === 'function'
    ? _0x382e6d['getUserMessage']()
    : _0x382e6d instanceof Error
      ? _0x382e6d['message']
      : String(
          _0x382e6d || videoKeyingText('errors.' + (_0x1b74de === 'remove' ? 'remove' : 'keying') + 'Failed'),
        );
}
function buildFailedTaskPatch({ mode: _0x3ba9b2, outId: _0x4b00d4, startedAt: _0x1bae98, error: _0x55c069 }) {
  const _0x22f6ab = getTaskFailureMessage(_0x3ba9b2, _0x55c069);
  return {
    ...buildVideoGenerationFailurePatch({
      error: _0x22f6ab,
      startedAt: _0x1bae98,
      duration: computeGenerationDuration(_0x4b00d4),
    }),
    ...(_0x3ba9b2 === 'remove' ? { name: videoKeyingText('output.removeFailedName') } : {}),
    isGenerating: ![],
    rhTaskStatus: 'failed',
    rhTaskRecovering: ![],
    outputText: buildVideoKeyingOutputText(_0x3ba9b2, 'failed', { reason: _0x22f6ab }),
  };
}
function buildSuccessfulTaskPatch({
  mode: _0x441274,
  outId: _0x566a42,
  startedAt: _0x4b33f6,
  result: _0x260e18,
}) {
  const _0x2043bd = pickResultLocalPath(_0x260e18),
    _0x52e116 = localPathToUrl(_0x2043bd) || String(_0x260e18?.['videoUrl'] || '');
  if (!_0x52e116) throw new Error(videoKeyingText('errors.noVideoUrl'));
  return {
    ...buildVideoGenerationResultPatch(
      { ..._0x260e18, videoUrl: String(_0x260e18?.['videoUrl'] || _0x52e116), localPath: _0x2043bd },
      { startedAt: _0x4b33f6, duration: computeGenerationDuration(_0x566a42) },
    ),
    src: _0x52e116,
    ...(_0x441274 === 'remove' ? { name: videoKeyingText('output.removeResultName') } : {}),
    outputText: buildVideoKeyingOutputText(_0x441274, 'completed'),
  };
}
export async function runVideoKeyingTask({
  sourceNodeId: _0x37d213,
  outId: _0x5bc4da,
  mode: _0x20c149,
  payload: _0xb1b55d,
  startedAt: startedAt = Date['now'](),
} = {}) {
  const _0x3023a4 = String(_0x37d213 || '')['trim'](),
    _0x4d8dc9 = String(_0x5bc4da || '')['trim'](),
    _0x25e024 = normalizeMode(_0x20c149);
  if (!_0x3023a4 || !_0x4d8dc9)
    throw new Error('[videoKeyingTaskRuntime] sourceNodeId and outId are required');
  const _0x40e784 = {
    id: Date['now']() + '_' + Math['random']()['toString'](0x24)['slice'](0x2),
    running: !![],
    taskId: '',
    sourceNodeId: _0x3023a4,
    outId: _0x4d8dc9,
    apiKey: String(_0xb1b55d?.['apiKey'] || ''),
    providerProfileId: String(_0xb1b55d?.['providerProfileId'] || _0xb1b55d?.['rhProviderProfileId'] || ''),
    mode: _0x25e024,
  };
  (taskContexts['set'](_0x3023a4, _0x40e784), notifyTaskChange(_0x40e784));
  _0x25e024 === 'keying' &&
    globalThis['window']?.['showToast']?.(videoKeyingText('toasts.keyingSubmitting'), 'info');
  try {
    const _0x1b0079 = await submitTask(
      {
        sourceNodeId: _0x3023a4,
        targetNodeId: _0x4d8dc9,
        trigger: 'toolbar',
        taskType: _0x25e024 === 'remove' ? 'video-remove' : 'video-keying',
        provider: 'runninghubwf',
        adapterType: 'workflow',
        modelId: getVideoKeyingModelId(),
        executionId: getVideoKeyingExecutionId(_0x25e024),
        payload: _0xb1b55d,
        cancellable: !![],
        resumable: !![],
        parseError: (_0x5e7233) =>
          typeof _0x5e7233?.['getUserMessage'] === 'function'
            ? _0x5e7233['getUserMessage']()
            : _0x5e7233?.['message'],
        cancel: async ({ taskId: _0x129881 }) => {
          if (!_0x40e784['apiKey'] || !_0x129881) return;
          await cancelRunningHubTask({
            apiKey: _0x40e784['apiKey'],
            taskId: _0x129881,
            providerProfileId: _0x40e784['providerProfileId'],
          });
        },
        submit: async (_0x1f2139, _0x8c754d) =>
          generateVideo(_0x1f2139, {
            signal: _0x8c754d['signal'],
            runningHubWorkflowQueueLease: _0x8c754d['runningHubWorkflowQueueLease'],
            onTaskId: (_0xa4241d) => {
              _0x8c754d['onTaskId']?.(_0xa4241d);
              const _0x211ff8 = taskContexts['get'](_0x3023a4);
              _0x211ff8?.['id'] === _0x40e784['id'] &&
                ((_0x211ff8['taskId'] = String(_0xa4241d || '')), notifyTaskChange(_0x211ff8));
              const _0xde2380 = _0x8c754d['getTaskNode']?.() || getNode(_0x4d8dc9);
              if (!_0xde2380) return;
              const _0x29aa41 = {
                rhTaskUseOpenapiQuery: ![],
                outputText: buildVideoKeyingOutputText(_0x25e024, 'processing', {
                  taskId: String(_0xa4241d || ''),
                }),
              };
              typeof _0x8c754d['updateTaskNode'] === 'function'
                ? _0x8c754d['updateTaskNode'](_0x29aa41, { allowMissing: !![] })
                : appStore['updateNodeData'](_0x4d8dc9, _0x29aa41);
            },
          }),
        resultBuilder: (_0x2d922f) =>
          buildSuccessfulTaskPatch({
            mode: _0x25e024,
            outId: _0x4d8dc9,
            startedAt: startedAt,
            result: _0x2d922f,
          }),
        cancelledBuilder: () => buildCancelledTaskPatch(_0x25e024),
        failureBuilder: (_0x46d4c4) =>
          buildFailedTaskPatch({ mode: _0x25e024, outId: _0x4d8dc9, startedAt: startedAt, error: _0x46d4c4 }),
      },
      { store: appStore, startedAt: startedAt },
    );
    if (_0x1b0079['ok'])
      (globalThis['window']?.['_triggerLocalCacheSave']?.(),
        globalThis['window']?.['showToast']?.(
          videoKeyingText('toasts.' + (_0x25e024 === 'remove' ? 'remove' : 'keying') + 'Success'),
          'success',
        ));
    else {
      if (_0x1b0079['status'] !== 'cancelled') {
        _0x1b0079['blocked'] === !![] &&
          getNode(_0x4d8dc9) &&
          appStore['updateNodeData'](
            _0x4d8dc9,
            buildFailedTaskPatch({
              mode: _0x25e024,
              outId: _0x4d8dc9,
              startedAt: startedAt,
              error: _0x1b0079['error'],
            }),
          );
        const _0x37d873 =
          typeof _0x1b0079['error']?.['getUserMessage'] === 'function'
            ? _0x1b0079['error']['getUserMessage']()
            : _0x1b0079['error'] instanceof Error
              ? _0x1b0079['error']['message']
              : String(_0x1b0079['error'] || '');
        globalThis['window']?.['showToast']?.(
          videoKeyingText('toasts.' + (_0x25e024 === 'remove' ? 'remove' : 'keying') + 'Failed', {
            error: _0x37d873,
          }),
          'error',
        );
      }
    }
    return _0x1b0079;
  } catch (_0x1cde34) {
    const _0x4a0734 = buildFailedTaskPatch({
      mode: _0x25e024,
      outId: _0x4d8dc9,
      startedAt: startedAt,
      error: _0x1cde34,
    });
    return (
      getNode(_0x4d8dc9) && appStore['updateNodeData'](_0x4d8dc9, _0x4a0734),
      globalThis['window']?.['showToast']?.(
        videoKeyingText('toasts.' + (_0x25e024 === 'remove' ? 'remove' : 'keying') + 'Failed', {
          error: getTaskFailureMessage(_0x25e024, _0x1cde34),
        }),
        'error',
      ),
      { ok: ![], status: 'failed', targetNodeId: _0x4d8dc9, error: _0x1cde34 }
    );
  } finally {
    const _0x144e0e = taskContexts['get'](_0x3023a4);
    _0x144e0e?.['id'] === _0x40e784['id'] && (taskContexts['delete'](_0x3023a4), notifyTaskChange(_0x144e0e));
  }
}
export async function cancelVideoKeyingTaskForNode(
  _0x77ec2f,
  { mode: _0x13e338, notify: notify = ![] } = {},
) {
  const _0x2416c8 = getRunningVideoKeyingTaskForNode(_0x77ec2f, { mode: _0x13e338 });
  if (!_0x2416c8?.['outId']) return ![];
  const _0x215489 = taskContexts['get'](_0x2416c8['sourceNodeId']);
  _0x215489?.['outId'] === _0x2416c8['outId'] &&
    (taskContexts['delete'](_0x2416c8['sourceNodeId']), notifyTaskChange(_0x215489));
  let _0x1d87cf = String(_0x215489?.['apiKey'] || '');
  const _0x7e50bb = getNode(_0x2416c8['outId']);
  let _0x11e9da = String(
    _0x215489?.['providerProfileId'] ||
      _0x7e50bb?.['taskProviderProfileId'] ||
      _0x7e50bb?.['providerProfileId'] ||
      _0x7e50bb?.['rhProviderProfileId'] ||
      '',
  )['trim']();
  if (!_0x1d87cf && _0x2416c8['taskId'])
    try {
      const _0x2567c2 = await getRunningHubWorkflowAccess(_0x11e9da);
      ((_0x1d87cf = _0x2567c2['apiKey']),
        (_0x11e9da = _0x11e9da || String(_0x2567c2['providerProfileId'] || '')['trim']()));
    } catch {}
  return (
    await cancelTask(_0x2416c8['outId'], {
      store: appStore,
      cancellable: !![],
      taskId: _0x2416c8['taskId'],
      spec: {
        sourceNodeId: _0x2416c8['sourceNodeId'],
        provider: 'runninghubwf',
        adapterType: 'workflow',
        cancelledBuilder: () => buildCancelledTaskPatch(_0x2416c8['mode']),
      },
      cancel: async ({ taskId: _0x12be82 }) => {
        if (!_0x1d87cf || !_0x12be82) return;
        try {
          await cancelRunningHubTask({ apiKey: _0x1d87cf, taskId: _0x12be82, providerProfileId: _0x11e9da });
        } catch {}
      },
    }),
    getNode(_0x2416c8['outId']) &&
      appStore['updateNodeData'](_0x2416c8['outId'], buildCancelledTaskPatch(_0x2416c8['mode'])),
    notifyTaskChange(_0x2416c8),
    notify &&
      globalThis['window']?.['showToast']?.(
        videoKeyingText('toasts.' + (_0x2416c8['mode'] === 'remove' ? 'remove' : 'keying') + 'Cancelled'),
        'info',
      ),
    !![]
  );
}
export function __resetVideoKeyingTaskRuntimeForTest() {
  taskContexts['clear']();
}
