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
function normalizeMode(value) {
  return value === 'remove' ? 'remove' : 'keying';
}
function normalizeRequestedMode(item) {
  return item === 'keying' || item === 'remove' ? item : '';
}
function getStateSnapshot() {
  return typeof appStore['getStateRaw'] === 'function' ? appStore['getStateRaw']() : appStore['getState']();
}
function getNode(key) {
  return getStateSnapshot()['nodes']?.[key] || null;
}
function computeGenerationDuration(index) {
  const count = Number(getNode(index)?.['generationStartTime']);
  if (!Number['isFinite'](count) || count <= 0x0) return 0x0;
  return Math['max'](0x0, Date['now']() - count);
}
function notifyTaskChange(options = {}) {
  try {
    globalThis['window']?.['dispatchEvent']?.(
      new CustomEvent(VIDEO_KEYING_TASK_CHANGE_EVENT, {
        detail: {
          sourceNodeId: String(options['sourceNodeId'] || ''),
          outId: String(options['outId'] || ''),
          mode: String(options['mode'] || ''),
        },
      }),
    );
  } catch {}
}
function resolveStoredTaskMode(error) {
  if (!error || typeof error !== 'object') return '';
  if (!isVideoKeyingModel(error['model']) || !shouldShowGenerationBusyUi(error)) return '';
  const result = String(error['rhToolbarTaskType'] || '');
  if (result === 'video-keying') return 'keying';
  if (result === 'video-remove') return 'remove';
  const list = String(error['outputText'] || ''),
    data = String(error['name'] || '');
  if (list['includes']('RH视频擦除') || list['includes']('视频擦除') || /^视频擦除/['test'](data))
    return 'remove';
  if (list['includes']('RH视频抠像') || list['includes']('视频抠像') || /^抠像结果\b/['test'](data))
    return 'keying';
  return '';
}
function toPublicTask(enabled, { fromStore: fromStore = ![] } = {}) {
  if (!enabled) return null;
  return {
    sourceNodeId: String(enabled['sourceNodeId'] || ''),
    outId: String(enabled['outId'] || enabled['id'] || ''),
    taskId: String(enabled['taskId'] || enabled['rhTaskId'] || ''),
    mode: normalizeMode(enabled['mode']),
    fromStore: fromStore,
  };
}
function findMemoryTask(target, source = '') {
  const enabled2 = String(target || '')['trim']();
  if (!enabled2) return null;
  for (const enabled3 of taskContexts['values']()) {
    if (!enabled3?.['running']) continue;
    if (source && enabled3['mode'] !== source) continue;
    if (String(enabled3['sourceNodeId'] || '') === enabled2 || String(enabled3['outId'] || '') === enabled2)
      return toPublicTask(enabled3);
  }
  return null;
}
function findStoredTask(next, current = '') {
  const enabled4 = String(next || '')['trim']();
  if (!enabled4) return null;
  const stateSnapshot = getStateSnapshot()['nodes'] || {},
    entry = Object['values'](stateSnapshot)
      ['map']((node) => ({ node: node, mode: resolveStoredTaskMode(node) }))
      ['filter'](({ node: node2, mode: mode }) => {
        if (!mode || (current && mode !== current)) return ![];
        return String(node2['id'] || '') === enabled4 || String(node2['rhSourceNodeId'] || '') === enabled4;
      })
      ['sort']((record, payload) => {
        const handle =
            Number(record['node']['rhTaskStartedAt'] || record['node']['generationStartTime'] || 0x0) || 0x0,
          state =
            Number(payload['node']['rhTaskStartedAt'] || payload['node']['generationStartTime'] || 0x0) ||
            0x0;
        return state - handle;
      }),
    sourceNodeId = entry[0x0];
  if (!sourceNodeId) return null;
  return toPublicTask(
    {
      sourceNodeId: sourceNodeId['node']['rhSourceNodeId'],
      outId: sourceNodeId['node']['id'],
      taskId: sourceNodeId['node']['rhTaskId'],
      mode: sourceNodeId['mode'],
    },
    { fromStore: !![] },
  );
}
export function getRunningVideoKeyingTaskForNode(config, { mode: mode2 } = {}) {
  const requestedMode = normalizeRequestedMode(mode2);
  return findMemoryTask(config, requestedMode) || findStoredTask(config, requestedMode);
}
export function hasRunningVideoKeyingTaskForNode(scope, input = {}) {
  return !!getRunningVideoKeyingTaskForNode(scope, input);
}
function buildCancelledTaskPatch(output) {
  return {
    ...(output === 'remove' ? { name: videoKeyingText('output.removeResultName') } : {}),
    isGenerating: ![],
    rhTaskStatus: 'cancelled',
    rhTaskRecovering: ![],
    outputText: buildVideoKeyingOutputText(output, 'cancelled'),
  };
}
function getTaskFailureMessage(value2, error2) {
  return typeof error2?.['getUserMessage'] === 'function'
    ? error2['getUserMessage']()
    : error2 instanceof Error
      ? error2['message']
      : String(error2 || videoKeyingText('errors.' + (value2 === 'remove' ? 'remove' : 'keying') + 'Failed'));
}
function buildFailedTaskPatch({ mode: mode3, outId: outId, startedAt: startedAt2, error: error3 }) {
  const error4 = getTaskFailureMessage(mode3, error3);
  return {
    ...buildVideoGenerationFailurePatch({
      error: error4,
      startedAt: startedAt2,
      duration: computeGenerationDuration(outId),
    }),
    ...(mode3 === 'remove' ? { name: videoKeyingText('output.removeFailedName') } : {}),
    isGenerating: ![],
    rhTaskStatus: 'failed',
    rhTaskRecovering: ![],
    outputText: buildVideoKeyingOutputText(mode3, 'failed', { reason: error4 }),
  };
}
function buildSuccessfulTaskPatch({ mode: mode4, outId: outId2, startedAt: startedAt3, result: result2 }) {
  const localPath = pickResultLocalPath(result2),
    src = localPathToUrl(localPath) || String(result2?.['videoUrl'] || '');
  if (!src) throw new Error(videoKeyingText('errors.noVideoUrl'));
  return {
    ...buildVideoGenerationResultPatch(
      { ...result2, videoUrl: String(result2?.['videoUrl'] || src), localPath: localPath },
      { startedAt: startedAt3, duration: computeGenerationDuration(outId2) },
    ),
    src: src,
    ...(mode4 === 'remove' ? { name: videoKeyingText('output.removeResultName') } : {}),
    outputText: buildVideoKeyingOutputText(mode4, 'completed'),
  };
}
export async function runVideoKeyingTask({
  sourceNodeId: sourceNodeId2,
  outId: outId3,
  mode: mode5,
  payload: payload2,
  startedAt: startedAt = Date['now'](),
} = {}) {
  const sourceNodeId3 = String(sourceNodeId2 || '')['trim'](),
    outId4 = String(outId3 || '')['trim'](),
    mode6 = normalizeMode(mode5);
  if (!sourceNodeId3 || !outId4)
    throw new Error('[videoKeyingTaskRuntime] sourceNodeId and outId are required');
  const apiKey = {
    id: Date['now']() + '_' + Math['random']()['toString'](0x24)['slice'](0x2),
    running: !![],
    taskId: '',
    sourceNodeId: sourceNodeId3,
    outId: outId4,
    apiKey: String(payload2?.['apiKey'] || ''),
    providerProfileId: String(payload2?.['providerProfileId'] || payload2?.['rhProviderProfileId'] || ''),
    mode: mode6,
  };
  (taskContexts['set'](sourceNodeId3, apiKey), notifyTaskChange(apiKey));
  mode6 === 'keying' &&
    globalThis['window']?.['showToast']?.(videoKeyingText('toasts.keyingSubmitting'), 'info');
  try {
    const error5 = await submitTask(
      {
        sourceNodeId: sourceNodeId3,
        targetNodeId: outId4,
        trigger: 'toolbar',
        taskType: mode6 === 'remove' ? 'video-remove' : 'video-keying',
        provider: 'runninghubwf',
        adapterType: 'workflow',
        modelId: getVideoKeyingModelId(),
        executionId: getVideoKeyingExecutionId(mode6),
        payload: payload2,
        cancellable: !![],
        resumable: !![],
        parseError: (error6) =>
          typeof error6?.['getUserMessage'] === 'function' ? error6['getUserMessage']() : error6?.['message'],
        cancel: async ({ taskId: taskId }) => {
          if (!apiKey['apiKey'] || !taskId) return;
          await cancelRunningHubTask({
            apiKey: apiKey['apiKey'],
            taskId: taskId,
            providerProfileId: apiKey['providerProfileId'],
          });
        },
        submit: async (value3, signal) =>
          generateVideo(value3, {
            signal: signal['signal'],
            runningHubWorkflowQueueLease: signal['runningHubWorkflowQueueLease'],
            onTaskId: (value4) => {
              signal['onTaskId']?.(value4);
              const value5 = taskContexts['get'](sourceNodeId3);
              value5?.['id'] === apiKey['id'] &&
                ((value5['taskId'] = String(value4 || '')), notifyTaskChange(value5));
              const enabled5 = signal['getTaskNode']?.() || getNode(outId4);
              if (!enabled5) return;
              const value6 = {
                rhTaskUseOpenapiQuery: ![],
                outputText: buildVideoKeyingOutputText(mode6, 'processing', {
                  taskId: String(value4 || ''),
                }),
              };
              typeof signal['updateTaskNode'] === 'function'
                ? signal['updateTaskNode'](value6, { allowMissing: !![] })
                : appStore['updateNodeData'](outId4, value6);
            },
          }),
        resultBuilder: (result3) =>
          buildSuccessfulTaskPatch({
            mode: mode6,
            outId: outId4,
            startedAt: startedAt,
            result: result3,
          }),
        cancelledBuilder: () => buildCancelledTaskPatch(mode6),
        failureBuilder: (error7) =>
          buildFailedTaskPatch({ mode: mode6, outId: outId4, startedAt: startedAt, error: error7 }),
      },
      { store: appStore, startedAt: startedAt },
    );
    if (error5['ok'])
      (globalThis['window']?.['_triggerLocalCacheSave']?.(),
        globalThis['window']?.['showToast']?.(
          videoKeyingText('toasts.' + (mode6 === 'remove' ? 'remove' : 'keying') + 'Success'),
          'success',
        ));
    else {
      if (error5['status'] !== 'cancelled') {
        error5['blocked'] === !![] &&
          getNode(outId4) &&
          appStore['updateNodeData'](
            outId4,
            buildFailedTaskPatch({
              mode: mode6,
              outId: outId4,
              startedAt: startedAt,
              error: error5['error'],
            }),
          );
        const error8 =
          typeof error5['error']?.['getUserMessage'] === 'function'
            ? error5['error']['getUserMessage']()
            : error5['error'] instanceof Error
              ? error5['error']['message']
              : String(error5['error'] || '');
        globalThis['window']?.['showToast']?.(
          videoKeyingText('toasts.' + (mode6 === 'remove' ? 'remove' : 'keying') + 'Failed', {
            error: error8,
          }),
          'error',
        );
      }
    }
    return error5;
  } catch (error9) {
    const failedTaskPatch = buildFailedTaskPatch({
      mode: mode6,
      outId: outId4,
      startedAt: startedAt,
      error: error9,
    });
    return (
      getNode(outId4) && appStore['updateNodeData'](outId4, failedTaskPatch),
      globalThis['window']?.['showToast']?.(
        videoKeyingText('toasts.' + (mode6 === 'remove' ? 'remove' : 'keying') + 'Failed', {
          error: getTaskFailureMessage(mode6, error9),
        }),
        'error',
      ),
      { ok: ![], status: 'failed', targetNodeId: outId4, error: error9 }
    );
  } finally {
    const value7 = taskContexts['get'](sourceNodeId3);
    value7?.['id'] === apiKey['id'] && (taskContexts['delete'](sourceNodeId3), notifyTaskChange(value7));
  }
}
export async function cancelVideoKeyingTaskForNode(value8, { mode: mode7, notify: notify = ![] } = {}) {
  const taskId2 = getRunningVideoKeyingTaskForNode(value8, { mode: mode7 });
  if (!taskId2?.['outId']) return ![];
  const value9 = taskContexts['get'](taskId2['sourceNodeId']);
  value9?.['outId'] === taskId2['outId'] &&
    (taskContexts['delete'](taskId2['sourceNodeId']), notifyTaskChange(value9));
  let apiKey2 = String(value9?.['apiKey'] || '');
  const node3 = getNode(taskId2['outId']);
  let providerProfileId = String(
    value9?.['providerProfileId'] ||
      node3?.['taskProviderProfileId'] ||
      node3?.['providerProfileId'] ||
      node3?.['rhProviderProfileId'] ||
      '',
  )['trim']();
  if (!apiKey2 && taskId2['taskId'])
    try {
      const runningHubWorkflowAccess = await getRunningHubWorkflowAccess(providerProfileId);
      ((apiKey2 = runningHubWorkflowAccess['apiKey']),
        (providerProfileId =
          providerProfileId || String(runningHubWorkflowAccess['providerProfileId'] || '')['trim']()));
    } catch {}
  return (
    await cancelTask(taskId2['outId'], {
      store: appStore,
      cancellable: !![],
      taskId: taskId2['taskId'],
      spec: {
        sourceNodeId: taskId2['sourceNodeId'],
        provider: 'runninghubwf',
        adapterType: 'workflow',
        cancelledBuilder: () => buildCancelledTaskPatch(taskId2['mode']),
      },
      cancel: async ({ taskId: taskId3 }) => {
        if (!apiKey2 || !taskId3) return;
        try {
          await cancelRunningHubTask({
            apiKey: apiKey2,
            taskId: taskId3,
            providerProfileId: providerProfileId,
          });
        } catch {}
      },
    }),
    getNode(taskId2['outId']) &&
      appStore['updateNodeData'](taskId2['outId'], buildCancelledTaskPatch(taskId2['mode'])),
    notifyTaskChange(taskId2),
    notify &&
      globalThis['window']?.['showToast']?.(
        videoKeyingText('toasts.' + (taskId2['mode'] === 'remove' ? 'remove' : 'keying') + 'Cancelled'),
        'info',
      ),
    !![]
  );
}
export function __resetVideoKeyingTaskRuntimeForTest() {
  taskContexts['clear']();
}
