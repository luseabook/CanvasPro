import { logDiagnosticEvent } from '../services/diagnosticsService.js';
import { isRunningHubWorkflowQueueTarget } from '../../api/runningHubWorkflowQueue.js';
import { resolveModelExecution } from '../manifests/index.js';
import { buildGenerationProtocolTransitionPatch } from './generationTaskProtocolState.js';
import appStore from './stores/appStore.js';
import {
  buildGenerationCancelledPatch,
  buildGenerationFailurePatch,
  buildGenerationStartPatch,
  buildGenerationSuccessPatch,
} from './generationTaskLifecycle.js';
import { playCompletionSound } from '../services/completionSoundService.js';
import { showGenerationCompleteNotification } from '../services/completionNotificationService.js';
import { t } from '../i18n/index.js';
const WORKFLOW_ADAPTER = 'workflow',
  MODEL_API_ADAPTER = 'modelapi',
  LOCAL_RUNTIME_ADAPTER = 'localruntime',
  REQUIRED_SPEC_FIELDS = Object.freeze([
    'sourceNodeId',
    'trigger',
    'taskType',
    'provider',
    'adapterType',
    'modelId',
    'executionId',
    'payload',
    'cancellable',
    'resumable',
    'resultBuilder',
  ]),
  activeTasks = new Map(),
  CANCELLED_MESSAGE_ALIASES = Object.freeze(['任务已取消', 'Task cancelled']);
function getCancelledMessage() {
  return t('coreUi.generationTask.cancelled');
}
function nowFrom(options2 = {}) {
  return typeof options2.now === 'function' ? options2.now() : Date.now();
}
function getStore(options3 = {}) {
  return options3.store || appStore;
}
function getStateSnapshot(store) {
  return typeof store.getStateRaw === 'function' ? store.getStateRaw() : store.getState();
}
function normalizeAdapterType(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}
function isWorkflowSpec(options4 = {}, item = {}) {
  const adapterType2 = normalizeAdapterType(options4.adapterType || item.adapterType);
  return adapterType2 === WORKFLOW_ADAPTER;
}
function isAsyncModelApiSpec(options5 = {}, key = {}) {
  const adapterType3 = normalizeAdapterType(options5.adapterType || key.adapterType);
  return adapterType3 === MODEL_API_ADAPTER && options5.async === true;
}
function assertSpec(
  enabled,
  { requireSubmit: requireSubmit = false, requireTarget: requireTarget = false } = {},
) {
  if (!enabled || typeof enabled !== 'object' || Array.isArray(enabled))
    throw new Error('[generationTaskRuntime] task spec must be an object');
  const list = REQUIRED_SPEC_FIELDS.filter((item2) => {
    if (item2 === 'targetNodeId' || item2 === 'payload') return false;
    if (item2 === 'resultBuilder') return typeof enabled.resultBuilder !== 'function';
    return enabled[item2] === undefined || enabled[item2] === null || enabled[item2] === '';
  });
  if (enabled.payload === undefined) list.push('payload');
  requireTarget && !String(enabled.targetNodeId || '').trim() && list.push('targetNodeId');
  requireSubmit && typeof getSubmitFn(enabled) !== 'function' && list.push('submit');
  if (list.length)
    throw new Error('[generationTaskRuntime] missing required task fields: ' + list.join(', '));
}
function getSubmitFn(index) {
  return index.submit || index.adapter?.submit || null;
}
function getPollFn(result) {
  return result.poll || result.spec?.poll || result.spec?.adapter?.poll || null;
}
function getCancelFn(data, target = {}) {
  return target.cancel || data.cancel || data.spec?.cancel || data.spec?.adapter?.cancel || null;
}
function extractTaskId(source) {
  const list2 = [
    source?.taskId,
    source?.task_id,
    source?.id,
    source?.data?.taskId,
    source?.data?.task_id,
    source?.data?.id,
  ];
  return String(list2.find((item3) => String(item3 || '').trim()) || '').trim();
}
function extractSubmittedResult(enabled2) {
  if (!enabled2 || typeof enabled2 !== 'object') return enabled2;
  if (Object.prototype.hasOwnProperty.call(enabled2, 'result')) return enabled2.result;
  if (Object.prototype.hasOwnProperty.call(enabled2, 'output')) return enabled2.output;
  return enabled2;
}
function isPendingResult(enabled3) {
  return !!enabled3 && typeof enabled3 === 'object' && enabled3.pending === true;
}
function getPendingMessage(error) {
  return String(error?.message || error?.statusMessage || error?.msg || '').trim();
}
function buildProtocolStartPatch(taskCancellable, rhTaskStartedAt) {
  const args = {
    taskTrigger: String(taskCancellable.trigger || ''),
    taskType: String(taskCancellable.taskType || ''),
    taskProvider: String(taskCancellable.provider || ''),
    taskAdapterType: String(taskCancellable.adapterType || ''),
    taskModelId: String(taskCancellable.modelId || ''),
    taskExecutionId: String(taskCancellable.executionId || ''),
    taskCancellable: taskCancellable.cancellable === true,
    taskResumable: taskCancellable.resumable === true,
  };
  if (isWorkflowSpec(taskCancellable))
    return {
      ...args,
      rhTaskId: '',
      rhTaskStatus: 'pending',
      rhTaskStartedAt: rhTaskStartedAt,
      rhTaskRecovering: false,
      rhSourceNodeId: String(taskCancellable.sourceNodeId || ''),
      rhToolbarTaskType: String(taskCancellable.taskType || ''),
    };
  if (isAsyncModelApiSpec(taskCancellable))
    return {
      ...args,
      asyncTaskId: '',
      asyncTaskStatus: 'pending',
      asyncTaskStartedAt: rhTaskStartedAt,
      asyncTaskRecovering: false,
    };
  return args;
}
function buildProtocolTaskIdPatch(next, rhTaskId, rhTaskStartedAt2) {
  if (!rhTaskId) return {};
  if (isWorkflowSpec(next))
    return {
      rhTaskId: rhTaskId,
      rhTaskStatus: 'running',
      rhTaskStartedAt: rhTaskStartedAt2,
      rhTaskRecovering: false,
    };
  if (isAsyncModelApiSpec(next))
    return {
      asyncTaskId: rhTaskId,
      asyncTaskStatus: 'running',
      asyncTaskStartedAt: rhTaskStartedAt2,
      asyncTaskRecovering: false,
    };
  return {};
}
function buildProtocolTerminalPatch(current, rhTaskStatus) {
  if (isWorkflowSpec(current)) return { rhTaskStatus: rhTaskStatus, rhTaskRecovering: false };
  if (isAsyncModelApiSpec(current)) return { asyncTaskStatus: rhTaskStatus, asyncTaskRecovering: false };
  return {};
}
function buildProtocolPendingPatch(entry, record, statusMessage = '') {
  const payload = String(record?.taskId || '').trim(),
    args2 = {
      isGenerating: true,
      jobStatus: 'running',
      jobError: null,
      generationDuration: null,
      ...(statusMessage ? { statusMessage: statusMessage } : {}),
    };
  if (isWorkflowSpec(entry))
    return {
      ...args2,
      ...(payload ? buildProtocolTaskIdPatch(entry, payload, record.startedAt) : { rhTaskStatus: 'pending' }),
      rhTaskRecovering: false,
      ...(statusMessage ? { rhStatusMessage: statusMessage } : {}),
    };
  if (isAsyncModelApiSpec(entry))
    return {
      ...args2,
      ...(payload
        ? buildProtocolTaskIdPatch(entry, payload, record.startedAt)
        : { asyncTaskStatus: 'pending' }),
      asyncTaskRecovering: false,
    };
  return args2;
}
function isMissingTargetNodeError(error2, handle) {
  const list3 = String(error2?.message || '');
  return list3.includes('updateNodeData()') && list3.includes(String(handle || ''));
}
function updateTaskNode(store2, enabled4, enabled5, { allowMissing: allowMissing = false } = {}) {
  if (!enabled4 || !enabled5 || typeof enabled5 !== 'object') return false;
  try {
    return (store2.updateNodeData(enabled4, enabled5), true);
  } catch (state) {
    if (allowMissing && isMissingTargetNodeError(state, enabled4)) return false;
    throw state;
  }
}
function notifyTaskChange(sourceNodeId, args3 = {}) {
  typeof sourceNodeId?.spec?.onTaskChange === 'function' &&
    sourceNodeId.spec.onTaskChange({
      sourceNodeId: sourceNodeId.sourceNodeId,
      targetNodeId: sourceNodeId.targetNodeId,
      taskId: sourceNodeId.taskId,
      ...args3,
    });
}
function isAbortLike(error3) {
  const config = String(error3?.message || error3 || '');
  return (
    error3?.name === 'AbortError' ||
    config === 'CANCELLED' ||
    config === getCancelledMessage() ||
    CANCELLED_MESSAGE_ALIASES.includes(config) ||
    config.toLowerCase().includes('aborted')
  );
}
function parseErrorMessage(error4, scope = {}, t2 = t('coreUi.generationTask.generateFailed')) {
  if (typeof scope.parseError === 'function') {
    const input = scope.parseError(error4),
      output = String(input || '').trim();
    if (output) return output;
  }
  if (typeof error4?.getUserMessage === 'function') {
    const value2 = String(error4.getUserMessage() || '').trim();
    if (value2) return value2;
  }
  return String(error4?.message || t2).trim() || t2;
}
function createCancelledError() {
  const error5 = new Error(getCancelledMessage());
  return ((error5.name = 'AbortError'), error5);
}
function isCancelledStatus(value3) {
  const value4 = String(value3 || '')
    .trim()
    .toLowerCase();
  return value4 === 'cancelled' || value4 === 'canceled';
}
function isContextCancelled(value5) {
  if (value5?.cancelRequested === true) return true;
  const stateSnapshot = getStateSnapshot(value5.store).nodes?.[value5.targetNodeId];
  return (
    isCancelledStatus(stateSnapshot?.jobStatus) ||
    isCancelledStatus(stateSnapshot?.rhTaskStatus) ||
    isCancelledStatus(stateSnapshot?.asyncTaskStatus)
  );
}
function shouldPauseOnAbort(options6 = {}, value6 = {}) {
  if (options6.pauseOnAbort === true) return true;
  if (options6.pauseOnAbort !== 'afterTaskId') return false;
  return !!String(value6?.taskId || options6.taskId || '').trim();
}
function isContextInFlight(enabled6) {
  return !!enabled6 && enabled6.inFlight === true && !isContextCancelled(enabled6);
}
function markContextIdle(value7) {
  if (value7) value7.inFlight = false;
}
function deleteActiveTask(value8, enabled7) {
  (!enabled7 || activeTasks.get(value8) === enabled7) && activeTasks.delete(value8);
}
function buildAlreadyActiveResult(value9, targetNodeId2, value10) {
  return {
    ok: true,
    status: 'running',
    alreadyActive: true,
    targetNodeId: targetNodeId2,
    taskId: String(value9?.taskId || value10 || '').trim(),
  };
}
async function cancelRemoteTask(
  targetNodeId3,
  { taskId: taskId, node: node = null, options: options = {} } = {},
) {
  const taskId2 = String(taskId || targetNodeId3?.taskId || '').trim(),
    handler = getCancelFn(targetNodeId3 || { spec: options.spec }, options);
  if (typeof handler !== 'function' || !taskId2) return;
  return await handler({
    taskId: taskId2,
    targetNodeId: targetNodeId3?.targetNodeId || options.targetNodeId || '',
    sourceNodeId: targetNodeId3?.sourceNodeId || node?.rhSourceNodeId || '',
    spec: targetNodeId3?.spec || options.spec || {},
    node: node,
  });
}
async function ensureTargetNode(spec2, value11, startedAt) {
  const value12 = String(spec2.targetNodeId || '').trim();
  if (value12) return value12;
  if (typeof spec2.createTargetNode !== 'function')
    throw new Error('[generationTaskRuntime] targetNodeId or createTargetNode() is required');
  const enabled8 = await spec2.createTargetNode({
    spec: spec2,
    startedAt: startedAt,
    startPatch: buildGenerationStartPatch({ startedAt: startedAt }),
    protocolPatch: buildProtocolStartPatch(spec2, startedAt),
  });
  if (!enabled8 || typeof enabled8 !== 'object')
    throw new Error('[generationTaskRuntime] createTargetNode() must return a node');
  const enabled9 = String(enabled8.id || '').trim();
  if (!enabled9) throw new Error('[generationTaskRuntime] created target node must include id');
  return (value11.addNode(enabled8), enabled9);
}
function buildContext(spec3, targetNodeId4, store3, startedAt2, signal) {
  const abortController =
    signal.abortController || (typeof AbortController === 'function' ? new AbortController() : null);
  return {
    spec: spec3,
    store: store3,
    targetNodeId: targetNodeId4,
    sourceNodeId: String(spec3.sourceNodeId || ''),
    taskType: String(spec3.taskType || ''),
    startedAt: startedAt2,
    taskId: String(spec3.taskId || ''),
    abortController: abortController,
    signal: signal.signal || abortController?.signal || null,
    cancelRequested: false,
    inFlight: true,
  };
}
export async function normalizeResult(value13, { spec: spec4, context: context } = {}) {
  if (typeof spec4?.resultBuilder !== 'function') return {};
  const value14 = await spec4.resultBuilder(value13, {
    spec: spec4,
    targetNodeId: context?.targetNodeId || spec4.targetNodeId,
    sourceNodeId: context?.sourceNodeId || spec4.sourceNodeId,
    taskId: context?.taskId || spec4.taskId || '',
    startedAt: context?.startedAt || spec4.startedAt || 0,
  });
  return value14 && typeof value14 === 'object' ? value14 : {};
}
async function buildOptionalTaskPatch(handler2, args4) {
  if (typeof handler2 !== 'function') return {};
  const value15 = await handler2(...args4);
  return value15 && typeof value15 === 'object' ? value15 : {};
}
async function buildStartExtraPatch(args5, value16) {
  if (typeof args5?.startBuilder === 'function') {
    const value17 = await args5.startBuilder(value16);
    return value17 && typeof value17 === 'object' ? value17 : {};
  }
  if (args5?.startPatch && typeof args5.startPatch === 'object' && !Array.isArray(args5.startPatch))
    return { ...args5.startPatch };
  return {};
}
export async function pollTask(targetNodeId5, signal2 = {}) {
  const run = getPollFn(targetNodeId5);
  if (typeof run !== 'function') throw new Error('[generationTaskRuntime] poll function is required');
  return run({
    taskId: String(targetNodeId5.taskId || targetNodeId5.spec?.taskId || ''),
    targetNodeId: targetNodeId5.targetNodeId || targetNodeId5.spec?.targetNodeId,
    sourceNodeId: targetNodeId5.sourceNodeId || targetNodeId5.spec?.sourceNodeId,
    taskType: targetNodeId5.taskType || targetNodeId5.spec?.taskType,
    payload: targetNodeId5.payload || targetNodeId5.spec?.payload,
    spec: targetNodeId5.spec || targetNodeId5,
    signal: signal2.signal || targetNodeId5.signal || targetNodeId5.abortController?.signal || null,
  });
}
export async function submitTask(args6, value18 = {}) {
  assertSpec(args6, { requireSubmit: true });
  const store4 = getStore(value18),
    startedAt3 = Number(args6.startedAt || value18.startedAt || nowFrom(value18)),
    value19 = String(args6.targetNodeId || '').trim(),
    targetNodeId6 = value19 || (await ensureTargetNode(args6, store4, startedAt3)),
    spec5 = { ...args6, targetNodeId: targetNodeId6 },
    sourceNodeId2 = buildContext(spec5, targetNodeId6, store4, startedAt3, value18);
  activeTasks.set(targetNodeId6, sourceNodeId2);
  const args7 = await buildStartExtraPatch(spec5, sourceNodeId2);
  updateTaskNode(store4, targetNodeId6, {
    ...buildGenerationStartPatch({ startedAt: startedAt3 }),
    ...buildProtocolStartPatch(spec5, startedAt3),
    ...args7,
  });
  typeof spec5.onTaskStart === 'function' && spec5.onTaskStart(sourceNodeId2);
  notifyTaskChange(sourceNodeId2, { status: 'running' });
  try {
    const run2 = getSubmitFn(spec5),
      value20 = await run2(spec5.payload, {
        spec: spec5,
        targetNodeId: targetNodeId6,
        sourceNodeId: sourceNodeId2.sourceNodeId,
        taskType: sourceNodeId2.taskType,
        signal: sourceNodeId2.signal,
        onTaskId: (value21) => {
          const enabled10 = String(value21 || '').trim();
          if (!enabled10) return;
          sourceNodeId2.taskId = enabled10;
          if (isContextCancelled(sourceNodeId2)) return;
          (updateTaskNode(store4, targetNodeId6, buildProtocolTaskIdPatch(spec5, enabled10, startedAt3)),
            notifyTaskChange(sourceNodeId2, { status: 'running' }));
        },
      }),
      extractTaskId2 = extractTaskId(value20);
    extractTaskId2 && (sourceNodeId2.taskId = extractTaskId2);
    if (isContextCancelled(sourceNodeId2)) {
      try {
        await cancelRemoteTask(sourceNodeId2, {
          taskId: sourceNodeId2.taskId,
          node: getStateSnapshot(store4).nodes?.[targetNodeId6],
        });
      } catch {}
      throw createCancelledError();
    }
    extractTaskId2 &&
      (updateTaskNode(store4, targetNodeId6, buildProtocolTaskIdPatch(spec5, extractTaskId2, startedAt3)),
      notifyTaskChange(sourceNodeId2, { status: 'running' }));
    if (spec5.waitForResult === false)
      return (
        markContextIdle(sourceNodeId2),
        { ok: true, status: 'submitted', targetNodeId: targetNodeId6, taskId: sourceNodeId2.taskId }
      );
    const result2 =
      sourceNodeId2.taskId && getPollFn({ spec: spec5 })
        ? await pollTask({ ...sourceNodeId2, spec: spec5 }, { signal: sourceNodeId2.signal })
        : extractSubmittedResult(value20);
    if (isContextCancelled(sourceNodeId2)) throw createCancelledError();
    if (isPendingResult(result2)) {
      const pendingMessage = getPendingMessage(result2);
      return (
        markContextIdle(sourceNodeId2),
        updateTaskNode(
          store4,
          targetNodeId6,
          buildProtocolPendingPatch(spec5, sourceNodeId2, pendingMessage),
        ),
        notifyTaskChange(sourceNodeId2, { status: 'pending' }),
        {
          ok: true,
          status: 'pending',
          pending: true,
          targetNodeId: targetNodeId6,
          taskId: sourceNodeId2.taskId,
          result: result2,
        }
      );
    }
    const args8 = await normalizeResult(result2, { spec: spec5, context: sourceNodeId2 });
    if (isContextCancelled(sourceNodeId2)) throw createCancelledError();
    const duration = nowFrom(value18) - startedAt3;
    return (
      updateTaskNode(store4, targetNodeId6, {
        ...buildGenerationSuccessPatch({ startedAt: startedAt3, duration: duration }),
        ...args8,
        ...buildProtocolTerminalPatch(spec5, 'success'),
      }),
      deleteActiveTask(targetNodeId6, sourceNodeId2),
      notifyTaskChange(sourceNodeId2, { status: 'success' }),
      playCompletionSound('generation-success'),
      showGenerationCompleteNotification(),
      {
        ok: true,
        status: 'success',
        targetNodeId: targetNodeId6,
        taskId: sourceNodeId2.taskId,
        result: result2,
      }
    );
  } catch (error6) {
    const duration2 = nowFrom(value18) - startedAt3,
      status = isAbortLike(error6),
      stateSnapshot2 = getStateSnapshot(store4).nodes?.[targetNodeId6] || {};
    if (
      status &&
      (isCancelledStatus(stateSnapshot2?.jobStatus) ||
        isCancelledStatus(stateSnapshot2?.rhTaskStatus) ||
        isCancelledStatus(stateSnapshot2?.asyncTaskStatus))
    )
      return (
        deleteActiveTask(targetNodeId6, sourceNodeId2),
        notifyTaskChange(sourceNodeId2, { status: 'cancelled' }),
        {
          ok: false,
          status: 'cancelled',
          targetNodeId: targetNodeId6,
          taskId: sourceNodeId2.taskId,
          error: error6,
        }
      );
    if (status && shouldPauseOnAbort(spec5, sourceNodeId2)) {
      const args9 = await buildOptionalTaskPatch(spec5.pauseBuilder, [sourceNodeId2]);
      return (
        updateTaskNode(
          store4,
          targetNodeId6,
          { ...buildProtocolPendingPatch(spec5, sourceNodeId2), ...args9 },
          { allowMissing: true },
        ),
        deleteActiveTask(targetNodeId6, sourceNodeId2),
        notifyTaskChange(sourceNodeId2, { status: 'paused' }),
        {
          ok: false,
          status: 'paused',
          targetNodeId: targetNodeId6,
          taskId: sourceNodeId2.taskId,
          error: error6,
        }
      );
    }
    const args10 = status
        ? buildGenerationCancelledPatch({ startedAt: startedAt3, duration: duration2 })
        : buildGenerationFailurePatch({
            error: parseErrorMessage(error6, spec5, t('coreUi.generationTask.generateFailed')),
            startedAt: startedAt3,
            duration: duration2,
          }),
      args11 = await buildOptionalTaskPatch(
        status ? spec5.cancelledBuilder : spec5.failureBuilder,
        status ? [sourceNodeId2] : [error6, sourceNodeId2],
      );
    return (
      updateTaskNode(store4, targetNodeId6, {
        ...args10,
        ...args11,
        ...buildProtocolTerminalPatch(spec5, status ? 'cancelled' : 'failed'),
      }),
      deleteActiveTask(targetNodeId6, sourceNodeId2),
      notifyTaskChange(sourceNodeId2, { status: status ? 'cancelled' : 'failed' }),
      {
        ok: false,
        status: status ? 'cancelled' : 'failed',
        targetNodeId: targetNodeId6,
        taskId: sourceNodeId2.taskId,
        error: error6,
      }
    );
  }
}
export async function cancelTask(value22, args12 = {}) {
  const store5 = getStore(args12),
    targetNodeId7 = String(
      typeof value22 === 'object' ? value22?.targetNodeId || value22?.outId || value22?.id : value22 || '',
    ).trim();
  if (!targetNodeId7) return { ok: false, reason: 'missing-target' };
  const value23 = activeTasks.get(targetNodeId7) || null,
    adapterType4 = getStateSnapshot(store5).nodes?.[targetNodeId7] || {},
    spec6 = value23?.spec ||
      args12.spec || {
        adapterType: adapterType4.adapterType,
        provider: adapterType4.provider,
        async: !!adapterType4.asyncTaskId,
      },
    enabled11 = args12.cancellable === true || value23?.spec?.cancellable === true;
  if (!enabled11) {
    if (args12.abortLocal === true) {
      if (value23) value23.cancelRequested = true;
      value23?.abortController?.abort?.();
    }
    return { ok: false, reason: 'not-cancellable', targetNodeId: targetNodeId7 };
  }
  const taskId3 = String(
      args12.taskId ||
        value23?.taskId ||
        value22?.taskId ||
        adapterType4.rhTaskId ||
        adapterType4.asyncTaskId ||
        '',
    ),
    cancel = getCancelFn(value23 || { spec: spec6 }, args12);
  let remoteResult = null,
    remoteError = null;
  try {
    if (value23) value23.cancelRequested = true;
    value23?.abortController?.abort?.();
  } catch {}
  if (typeof cancel === 'function' && taskId3)
    try {
      remoteResult = await cancelRemoteTask(value23 || { spec: spec6, targetNodeId: targetNodeId7 }, {
        taskId: taskId3,
        node: adapterType4,
        options: { ...args12, cancel: cancel, spec: spec6, targetNodeId: targetNodeId7 },
      });
    } catch (value24) {
      remoteError = value24;
    }
  const startedAt4 = Number(adapterType4.generationStartTime || adapterType4.rhTaskStartedAt || 0) || 0,
    args13 = await buildOptionalTaskPatch(args12.cancelledBuilder || spec6.cancelledBuilder, [
      {
        spec: spec6,
        store: store5,
        targetNodeId: targetNodeId7,
        startedAt: startedAt4,
        taskId: taskId3,
        remoteResult: remoteResult,
        remoteError: remoteError,
      },
    ]);
  return (
    updateTaskNode(store5, targetNodeId7, {
      ...buildGenerationCancelledPatch({ startedAt: startedAt4 }),
      ...args13,
      ...buildProtocolTerminalPatch(spec6, 'cancelled'),
    }),
    activeTasks.delete(targetNodeId7),
    notifyTaskChange(value23, { status: 'cancelled' }),
    { ok: true, status: 'cancelled', targetNodeId: targetNodeId7, taskId: taskId3 }
  );
}
export async function resumeTask(args14, value25 = {}) {
  assertSpec(args14, { requireTarget: true });
  const store6 = getStore(value25),
    targetNodeId8 = String(args14.targetNodeId || '').trim(),
    stateSnapshot3 = getStateSnapshot(store6).nodes?.[targetNodeId8] || {},
    startedAt5 =
      Number(
        args14.startedAt ||
          stateSnapshot3.generationStartTime ||
          stateSnapshot3.rhTaskStartedAt ||
          nowFrom(value25),
      ) || nowFrom(value25),
    taskId4 = String(args14.taskId || stateSnapshot3.rhTaskId || stateSnapshot3.asyncTaskId || '').trim();
  if (!taskId4) throw new Error('[generationTaskRuntime] resumeTask requires taskId');
  const value26 = activeTasks.get(targetNodeId8) || null;
  if (isContextInFlight(value26)) return buildAlreadyActiveResult(value26, targetNodeId8, taskId4);
  const spec7 = { ...args14, targetNodeId: targetNodeId8, taskId: taskId4 },
    signal3 = buildContext(spec7, targetNodeId8, store6, startedAt5, value25);
  ((signal3.taskId = taskId4), activeTasks.set(targetNodeId8, signal3));
  const args15 = await buildStartExtraPatch(spec7, signal3);
  updateTaskNode(store6, targetNodeId8, {
    ...buildGenerationStartPatch({ startedAt: startedAt5 }),
    ...buildProtocolTaskIdPatch(spec7, taskId4, startedAt5),
    ...args15,
    ...(isWorkflowSpec(spec7) ? { rhTaskRecovering: true } : {}),
    ...(isAsyncModelApiSpec(spec7) ? { asyncTaskRecovering: true } : {}),
  });
  typeof spec7.onTaskStart === 'function' && spec7.onTaskStart(signal3);
  notifyTaskChange(signal3, { status: 'running', recovering: true });
  try {
    const result3 = await pollTask({ ...signal3, spec: spec7 }, { signal: signal3.signal });
    if (isContextCancelled(signal3)) throw createCancelledError();
    if (isPendingResult(result3)) {
      const pendingMessage2 = getPendingMessage(result3);
      return (
        markContextIdle(signal3),
        updateTaskNode(store6, targetNodeId8, buildProtocolPendingPatch(spec7, signal3, pendingMessage2)),
        notifyTaskChange(signal3, { status: 'pending', recovering: true }),
        {
          ok: true,
          status: 'pending',
          pending: true,
          targetNodeId: targetNodeId8,
          taskId: taskId4,
          result: result3,
        }
      );
    }
    const args16 = await normalizeResult(result3, { spec: spec7, context: signal3 });
    if (isContextCancelled(signal3)) throw createCancelledError();
    const duration3 = nowFrom(value25) - startedAt5;
    return (
      updateTaskNode(store6, targetNodeId8, {
        ...buildGenerationSuccessPatch({ startedAt: startedAt5, duration: duration3 }),
        ...args16,
        ...buildProtocolTerminalPatch(spec7, 'success'),
      }),
      deleteActiveTask(targetNodeId8, signal3),
      notifyTaskChange(signal3, { status: 'success', recovering: false }),
      playCompletionSound('generation-success'),
      showGenerationCompleteNotification(),
      { ok: true, status: 'success', targetNodeId: targetNodeId8, taskId: taskId4, result: result3 }
    );
  } catch (error7) {
    const duration4 = nowFrom(value25) - startedAt5,
      status2 = isAbortLike(error7),
      stateSnapshot4 = getStateSnapshot(store6).nodes?.[targetNodeId8] || {};
    if (
      status2 &&
      (isCancelledStatus(stateSnapshot4?.jobStatus) ||
        isCancelledStatus(stateSnapshot4?.rhTaskStatus) ||
        isCancelledStatus(stateSnapshot4?.asyncTaskStatus))
    )
      return (
        deleteActiveTask(targetNodeId8, signal3),
        notifyTaskChange(signal3, { status: 'cancelled', recovering: false }),
        { ok: false, status: 'cancelled', targetNodeId: targetNodeId8, taskId: taskId4, error: error7 }
      );
    if (status2 && shouldPauseOnAbort(spec7, signal3)) {
      const args17 = await buildOptionalTaskPatch(spec7.pauseBuilder, [signal3]);
      return (
        updateTaskNode(
          store6,
          targetNodeId8,
          { ...buildProtocolPendingPatch(spec7, signal3), ...args17 },
          { allowMissing: true },
        ),
        deleteActiveTask(targetNodeId8, signal3),
        notifyTaskChange(signal3, { status: 'paused', recovering: false }),
        { ok: false, status: 'paused', targetNodeId: targetNodeId8, taskId: taskId4, error: error7 }
      );
    }
    const args18 = status2
        ? buildGenerationCancelledPatch({ startedAt: startedAt5, duration: duration4 })
        : buildGenerationFailurePatch({
            error: parseErrorMessage(error7, spec7, t('coreUi.generationTask.resumeFailed')),
            startedAt: startedAt5,
            duration: duration4,
          }),
      args19 = await buildOptionalTaskPatch(
        status2 ? spec7.cancelledBuilder : spec7.failureBuilder,
        status2 ? [signal3] : [error7, signal3],
      );
    return (
      updateTaskNode(store6, targetNodeId8, {
        ...args18,
        ...args19,
        ...buildProtocolTerminalPatch(spec7, status2 ? 'cancelled' : 'failed'),
      }),
      deleteActiveTask(targetNodeId8, signal3),
      notifyTaskChange(signal3, { status: status2 ? 'cancelled' : 'failed', recovering: false }),
      {
        ok: false,
        status: status2 ? 'cancelled' : 'failed',
        targetNodeId: targetNodeId8,
        taskId: taskId4,
        error: error7,
      }
    );
  }
}
export function getActiveGenerationTask(value27) {
  return activeTasks.get(String(value27 || '').trim()) || null;
}
export function __resetGenerationTaskRuntimeForTest() {
  activeTasks.clear();
}

let activeTaskSequence = 0;

function findActiveTaskContext(
  value28,
  { storeLike: storeLike = null, taskCenterTaskId: taskCenterTaskId = '' } = {},
) {
  const enabled12 = String(value28 || '')['trim']();
  if (!enabled12) return null;
  const enabled13 = String(taskCenterTaskId || '')['trim'](),
    value29 = Array['from'](activeTasks['values']())['filter'](
      (value30) =>
        value30?.['targetNodeId'] === enabled12 &&
        (!storeLike || value30['store'] === storeLike) &&
        (!enabled13 || value30['taskCenterTaskId'] === enabled13),
    );
  return value29['find']((value31) => isContextInFlight(value31)) || value29[0] || null;
}

function normalizeCompletionFeedbackOutcome(value32, value33) {
  if (value32['status'] === 'rejected')
    return { ok: ![], error: String(value32['reason']?.['message'] || value32['reason'] || 'Unknown error') };
  const response = value32['value'] && typeof value32['value'] === 'object' ? value32['value'] : {};
  if (value33 === 'notification')
    return {
      ok: response['success'] !== ![],
      shown: response['shown'] === !![],
      reason: String(response['reason'] || ''),
      error: String(response['error'] || ''),
    };
  return {
    ok: response['ok'] === !![],
    native: response['native'] === !![],
    skipped: String(response['skipped'] || ''),
    error: String(response['error']?.['message'] || response['error'] || ''),
  };
}

function dispatchGenerationCompletionFeedback(value34, { recovering: recovering = ![] } = {}) {
  const stateSnapshot5 = getStateSnapshot(value34['store'])['nodes']?.[value34['targetNodeId']] || {},
    promise = Promise['allSettled']([
      playCompletionSound('generation-success'),
      showGenerationCompleteNotification({
        nodeId: value34['targetNodeId'],
        navigation: {
          source: 'canvas',
          nodeId: value34['targetNodeId'],
          projectId: value34['projectId'],
          canvasId: value34['taskScopeId'],
        },
        node: stateSnapshot5,
        mediaKind:
          value34['spec']?.['modelManifest']?.['outputType'] ||
          value34['spec']?.['executionManifest']?.['kind'] ||
          value34['taskType'] ||
          stateSnapshot5?.['outputType'] ||
          stateSnapshot5?.['type'] ||
          '',
      }),
    ])['then'](([value35, value36]) => {
      const response2 = normalizeCompletionFeedbackOutcome(value35, 'sound'),
        response3 = normalizeCompletionFeedbackOutcome(value36, 'notification'),
        value37 = !response2['ok'] && response2['skipped'] !== 'disabled',
        value38 = !response3['ok'];
      return logDiagnosticEvent({
        type: 'generation.completion_feedback',
        level: value37 || value38 ? 'warn' : 'info',
        source: 'renderer',
        message: 'Generation completion feedback dispatched',
        context: {
          targetNodeId: value34['targetNodeId'],
          taskId: value34['taskId'],
          taskType: value34['taskType'],
          provider: String(value34['spec']?.['provider'] || ''),
          modelId: String(value34['spec']?.['modelId'] || ''),
          recovering: recovering,
          sound: response2,
          notification: response3,
        },
      });
    });
  return (void promise['catch'](() => {}), promise);
}

function normalizeProjectId(value39) {
  return String(value39 || '')['trim']();
}

function resolveTaskProjectId(options7 = {}, value40 = {}) {
  return normalizeProjectId(
    value40['projectId'] || options7['projectId'] || globalThis['window']?.['currentProjectId'] || '',
  );
}

function isRunningHubWorkflowQueueSpec(args20 = {}) {
  return isRunningHubWorkflowQueueTarget({
    provider: args20['provider'],
    adapterType: args20['adapterType'],
    payload: {
      ...(args20['payload'] && typeof args20['payload'] === 'object' ? args20['payload'] : {}),
      model: args20['modelId'],
      provider: args20['provider'],
      adapterType: args20['adapterType'],
    },
  });
}

function resolveSpecManifestContext(options8 = {}) {
  const value41 =
      options8['modelManifest'] && typeof options8['modelManifest'] === 'object'
        ? options8['modelManifest']
        : null,
    value42 =
      options8['executionManifest'] && typeof options8['executionManifest'] === 'object'
        ? options8['executionManifest']
        : null;
  if (value41 && value42) return { modelManifest: value41, executionManifest: value42 };
  const enabled14 = String(options8['modelId'] || '')['trim']();
  if (!enabled14) return null;
  const value43 = String(options8['provider'] || '')['trim']();
  let modelExecution = null;
  try {
    modelExecution =
      resolveModelExecution(enabled14, value43 ? { providerHint: value43 } : {}) ||
      resolveModelExecution(enabled14);
  } catch {
    modelExecution = null;
  }
  if (!modelExecution?.['modelManifest'] || !modelExecution?.['executionManifest']) return null;
  const value44 = String(options8['executionId'] || '')['trim'](),
    value45 = String(modelExecution['executionManifest']['id'] || '')['trim']();
  if (value44 && value45 !== value44) return null;
  return {
    modelManifest: value41 || modelExecution['modelManifest'],
    executionManifest: value42 || modelExecution['executionManifest'],
  };
}

function hasResultNormalizer(options9 = {}) {
  return typeof options9['resultBuilder'] === 'function' || !!resolveSpecManifestContext(options9);
}

function mergeManifestResultPatch(args21, args22) {
  if (!args22 || typeof args22 !== 'object') return args21;
  if (!args21 || typeof args21 !== 'object' || Array['isArray'](args21)) return args22;
  return { ...args22, ...args21 };
}

function persistResumableTaskState(value46, value47 = {}) {
  if (value46?.['spec']?.['resumable'] !== !![]) return;
  if (typeof value46['persistTaskState'] !== 'function') return;
  try {
    const promise2 = value46['persistTaskState']({
      sourceNodeId: value46['sourceNodeId'],
      targetNodeId: value46['targetNodeId'],
      taskId: value46['taskId'],
      spec: value46['spec'],
      patch: value47,
    });
    promise2?.['catch']?.(() => {});
  } catch {}
}

function updateContextNode(value48, value49, value50, value51 = {}) {
  if (value48?.['background'] !== !![] && value48?.['isTargetCurrent']?.() === ![]) return ![];
  const updateTaskNode2 = updateTaskNode(value48['store'], value49, value50, value51);
  if (updateTaskNode2) {
    value49 === value48['targetNodeId'] && persistResumableTaskState(value48, value50);
    if (typeof value48['mirrorTaskState'] === 'function')
      try {
        const value52 = value48['mirrorTaskState']({
          sourceNodeId: value48['sourceNodeId'],
          targetNodeId: value48['targetNodeId'],
          taskId: value48['taskId'],
          taskScopeId: value48['taskScopeId'],
          spec: value48['spec'],
          patch: value50,
          updatedNodeId: value49,
          store: value48['store'],
        });
        value52?.['catch']?.((value53) => {
          console['error']('[generationTaskRuntime] Failed to mirror background task state:', value53);
        });
      } catch (value54) {
        console['error']('[generationTaskRuntime] Failed to mirror background task state:', value54);
      }
  }
  return updateTaskNode2;
}

function updateContextTaskNode(value55, value56, value57 = {}) {
  return updateContextNode(value55, value55['targetNodeId'], value56, value57);
}

function getQueuedMessage() {
  const value58 = String(t('coreUi.generationTask.queued') || '')['trim']();
  return value58 && value58 !== 'coreUi.generationTask.queued' ? value58 : 'Queued';
}

function canAbortContextSignal(enabled15) {
  if (typeof enabled15?.['abortController']?.['abort'] !== 'function') return ![];
  return !enabled15['signal'] || enabled15['signal'] === enabled15['abortController']['signal'];
}

function cancelContextRemoteTaskOnce(
  enabled16,
  { taskId: taskId5, node: node = null, options: options = {} } = {},
) {
  const enabled17 = String(taskId5 || enabled16?.['taskId'] || '')['trim']();
  if (!enabled16 || !enabled17)
    return Promise['resolve'](
      cancelRemoteTask(enabled16, { taskId: enabled17, node: node, options: options }),
    );
  if (enabled16['remoteCancellationTaskId'] === enabled17 && enabled16['remoteCancellationPromise'])
    return enabled16['remoteCancellationPromise'];
  return (
    (enabled16['remoteCancellationTaskId'] = enabled17),
    (enabled16['remoteCancellationPromise'] = Promise['resolve'](
      cancelRemoteTask(enabled16, { taskId: enabled17, node: node, options: options }),
    )),
    enabled16['remoteCancellationPromise']
  );
}

async function pauseTaskContexts(list4, value59, value60 = {}) {
  const value61 = list4['filter']((value62) => {
    if (value62?.['spec']?.['resumable'] !== !![]) return !![];
    if (!String(value62?.['taskId'] || '')['trim']()) return !![];
    if (!shouldPauseOnAbort(value62['spec'], value62)) return !![];
    return !canAbortContextSignal(value62);
  })['map']((value63) => ({
    targetNodeId: value63['targetNodeId'],
    taskId: String(value63['taskId'] || '')['trim'](),
    taskType: value63['taskType'],
    reason:
      value63?.['spec']?.['resumable'] !== !![]
        ? 'not-resumable'
        : !String(value63?.['taskId'] || '')['trim']()
          ? 'missing-task-id'
          : !shouldPauseOnAbort(value63['spec'], value63)
            ? 'pause-not-supported'
            : 'abort-unavailable',
  }));
  if (value61['length'] > 0)
    return { ok: ![], projectId: value59, activeCount: list4['length'], pausedCount: 0, blockers: value61 };
  if (value60['dryRun'] === !![])
    return {
      ok: !![],
      projectId: value59,
      activeCount: list4['length'],
      pausedCount: 0,
      blockers: [],
      pausedTasks: [],
    };
  const list5 = [];
  list4['forEach']((value64) => {
    (value64['abortController']['signal']?.['aborted'] !== !![] && value64['abortController']['abort'](),
      list5['push']({
        targetNodeId: value64['targetNodeId'],
        taskId: String(value64['taskId'] || '')['trim'](),
        taskType: value64['taskType'],
      }));
  });
  const value65 = Math['max'](100, Number(value60['timeoutMs']) || 3000);
  if (list4['length'] > 0) {
    let setTimeout2 = null;
    const value66 = new Promise((handler3) => {
        ((setTimeout2 = setTimeout(() => handler3(![]), value65)), setTimeout2?.['unref']?.());
      }),
      enabled18 = await Promise['race']([
        Promise['all'](list4['map']((value67) => value67['settledPromise']))['then'](() => !![]),
        value66,
      ]);
    if (setTimeout2 !== null) clearTimeout(setTimeout2);
    if (!enabled18)
      return {
        ok: ![],
        projectId: value59,
        activeCount: list4['length'],
        pausedCount: list5['length'],
        blockers: list5['map']((args23) => ({ ...args23, reason: 'pause-timeout' })),
        pausedTasks: list5,
      };
    await new Promise((value68) => setTimeout(value68, 0));
  }
  return {
    ok: !![],
    projectId: value59,
    activeCount: list4['length'],
    pausedCount: list5['length'],
    blockers: [],
    pausedTasks: list5,
  };
}

export async function pauseProjectTasks(value69, value70 = {}) {
  const projectId = normalizeProjectId(value69),
    value71 = Array['from'](activeTasks['values']())['filter'](
      (value72) => isContextInFlight(value72) && normalizeProjectId(value72?.['projectId']) === projectId,
    );
  return pauseTaskContexts(value71, projectId, value70);
}

export async function pauseActiveWorkspaceTasks(options10 = {}) {
  const value73 = Array['from'](activeTasks['values']())['filter'](isContextInFlight);
  return pauseTaskContexts(value73, 'active-workspace', options10);
}

export function handoffActiveGenerationTasks({
  sourceStore: sourceStore = appStore,
  targetStore: targetStore2,
  taskScopeId: taskScopeId,
  mirrorTaskState: mirrorTaskState = null,
} = {}) {
  const enabled19 = String(taskScopeId || '')['trim']();
  if (!targetStore2 || !enabled19) return { ok: ![], movedCount: 0, taskScopeId: enabled19 };
  const value74 = Array['from'](activeTasks['values']())['filter'](
    (value75) => isContextInFlight(value75) && value75['store'] === sourceStore,
  );
  return (
    value74['forEach']((value76) => {
      ((value76['store'] = targetStore2),
        (value76['taskScopeId'] = enabled19),
        (value76['background'] = !![]),
        (value76['mirrorTaskState'] = typeof mirrorTaskState === 'function' ? mirrorTaskState : null));
    }),
    {
      ok: !![],
      movedCount: value74['length'],
      taskScopeId: enabled19,
      targetNodeIds: value74['map']((value77) => value77['targetNodeId']),
    }
  );
}

export function restoreActiveGenerationTasks({
  taskScopeId: taskScopeId2,
  targetStore: targetStore = appStore,
} = {}) {
  const value78 = String(taskScopeId2 || '')['trim'](),
    value79 = Array['from'](activeTasks['values']())['filter'](
      (value80) => isContextInFlight(value80) && String(value80['taskScopeId'] || '')['trim']() === value78,
    );
  return (
    value79['forEach']((value81) => {
      ((value81['store'] = targetStore), (value81['background'] = ![]), (value81['mirrorTaskState'] = null));
    }),
    {
      ok: !![],
      restoredCount: value79['length'],
      taskScopeId: value78,
      targetNodeIds: value79['map']((value82) => value82['targetNodeId']),
    }
  );
}

export function hasActiveGenerationTasksForStore(value83) {
  return Array['from'](activeTasks['values']())['some'](
    (value84) => isContextInFlight(value84) && value84['store'] === value83,
  );
}

export function hasActiveGenerationTasksForScope(value85) {
  const enabled20 = String(value85 || '')['trim']();
  if (!enabled20) return ![];
  return Array['from'](activeTasks['values']())['some'](
    (value86) => isContextInFlight(value86) && String(value86['taskScopeId'] || '')['trim']() === enabled20,
  );
}

export function shouldPreserveGenerationTaskOnUnmount(value87) {
  const value88 = String(value87 || '')['trim']();
  return Array['from'](activeTasks['values']())['some'](
    (value89) =>
      value89?.['targetNodeId'] === value88 && isContextInFlight(value89) && value89['background'] === !![],
  );
}

function startTaskContext(value90, args24, { recovering: recovering = ![] } = {}) {
  const { spec: spec8, startedAt: startedAt6, taskId: taskId6 } = value90;
  if (value90['cancelRequested'] || value90['signal']?.['aborted']) throw createCancelledError();
  updateContextTaskNode(value90, {
    ...buildGenerationStartPatch({ startedAt: startedAt6 }),
    ...buildGenerationProtocolTransitionPatch({ type: 'start', spec: spec8, startedAt: startedAt6 }),
    ...(recovering
      ? buildGenerationProtocolTransitionPatch({
          type: 'taskId',
          spec: spec8,
          taskId: taskId6,
          startedAt: startedAt6,
        })
      : {}),
    ...args24,
    ...(recovering && isWorkflowSpec(spec8) ? { rhTaskRecovering: !![] } : {}),
    ...(recovering && isAsyncModelApiSpec(spec8) ? { asyncTaskRecovering: !![] } : {}),
  });
  const run3 = () => {
      if (isContextCancelled(value90)) throw createCancelledError();
      notifyTaskChange(value90, { status: 'running', ...(recovering ? { recovering: !![] } : {}) });
    },
    promise3 = typeof spec8['onTaskStart'] === 'function' ? spec8['onTaskStart'](value90) : null;
  return promise3 && typeof promise3['then'] === 'function'
    ? Promise['resolve'](promise3)['then'](run3)
    : run3();
}
