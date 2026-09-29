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
function nowFrom(_0x185e7e = {}) {
  return typeof _0x185e7e.now === 'function' ? _0x185e7e.now() : Date.now();
}
function getStore(_0x3439ac = {}) {
  return _0x3439ac.store || appStore;
}
function getStateSnapshot(_0x16eccd) {
  return typeof _0x16eccd.getStateRaw === 'function' ? _0x16eccd.getStateRaw() : _0x16eccd.getState();
}
function normalizeAdapterType(_0x18633f) {
  return String(_0x18633f || '')
    .trim()
    .toLowerCase();
}
function isWorkflowSpec(_0x11cd3c = {}, _0x5c71c1 = {}) {
  const _0x4605d0 = normalizeAdapterType(_0x11cd3c.adapterType || _0x5c71c1.adapterType);
  return _0x4605d0 === WORKFLOW_ADAPTER;
}
function isAsyncModelApiSpec(_0x4c84bf = {}, _0x4e31e2 = {}) {
  const _0x6efe59 = normalizeAdapterType(_0x4c84bf.adapterType || _0x4e31e2.adapterType);
  return _0x6efe59 === MODEL_API_ADAPTER && _0x4c84bf.async === true;
}
function assertSpec(
  _0x4386eb,
  { requireSubmit: requireSubmit = false, requireTarget: requireTarget = false } = {},
) {
  if (!_0x4386eb || typeof _0x4386eb !== 'object' || Array.isArray(_0x4386eb))
    throw new Error('[generationTaskRuntime] task spec must be an object');
  const _0x39fb80 = REQUIRED_SPEC_FIELDS.filter((_0x4144cc) => {
    if (_0x4144cc === 'targetNodeId' || _0x4144cc === 'payload') return false;
    if (_0x4144cc === 'resultBuilder') return typeof _0x4386eb.resultBuilder !== 'function';
    return _0x4386eb[_0x4144cc] === undefined || _0x4386eb[_0x4144cc] === null || _0x4386eb[_0x4144cc] === '';
  });
  if (_0x4386eb.payload === undefined) _0x39fb80.push('payload');
  requireTarget && !String(_0x4386eb.targetNodeId || '').trim() && _0x39fb80.push('targetNodeId');
  requireSubmit && typeof getSubmitFn(_0x4386eb) !== 'function' && _0x39fb80.push('submit');
  if (_0x39fb80.length)
    throw new Error('[generationTaskRuntime] missing required task fields: ' + _0x39fb80.join(', '));
}
function getSubmitFn(_0x307469) {
  return _0x307469.submit || _0x307469.adapter?.submit || null;
}
function getPollFn(_0x2fc394) {
  return _0x2fc394.poll || _0x2fc394.spec?.poll || _0x2fc394.spec?.adapter?.poll || null;
}
function getCancelFn(_0x1ce3b5, _0x45c00c = {}) {
  return (
    _0x45c00c.cancel || _0x1ce3b5.cancel || _0x1ce3b5.spec?.cancel || _0x1ce3b5.spec?.adapter?.cancel || null
  );
}
function extractTaskId(_0x194563) {
  const _0x41b4d7 = [
    _0x194563?.taskId,
    _0x194563?.task_id,
    _0x194563?.id,
    _0x194563?.data?.taskId,
    _0x194563?.data?.task_id,
    _0x194563?.data?.id,
  ];
  return String(_0x41b4d7.find((_0x17cc11) => String(_0x17cc11 || '').trim()) || '').trim();
}
function extractSubmittedResult(_0x5967a2) {
  if (!_0x5967a2 || typeof _0x5967a2 !== 'object') return _0x5967a2;
  if (Object.prototype.hasOwnProperty.call(_0x5967a2, 'result')) return _0x5967a2.result;
  if (Object.prototype.hasOwnProperty.call(_0x5967a2, 'output')) return _0x5967a2.output;
  return _0x5967a2;
}
function isPendingResult(_0x4a4779) {
  return !!_0x4a4779 && typeof _0x4a4779 === 'object' && _0x4a4779.pending === true;
}
function getPendingMessage(_0x59a16f) {
  return String(_0x59a16f?.message || _0x59a16f?.statusMessage || _0x59a16f?.msg || '').trim();
}
function buildProtocolStartPatch(_0x258a23, _0x3f32b1) {
  const _0xd64a8d = {
    taskTrigger: String(_0x258a23.trigger || ''),
    taskType: String(_0x258a23.taskType || ''),
    taskProvider: String(_0x258a23.provider || ''),
    taskAdapterType: String(_0x258a23.adapterType || ''),
    taskModelId: String(_0x258a23.modelId || ''),
    taskExecutionId: String(_0x258a23.executionId || ''),
    taskCancellable: _0x258a23.cancellable === true,
    taskResumable: _0x258a23.resumable === true,
  };
  if (isWorkflowSpec(_0x258a23))
    return {
      ..._0xd64a8d,
      rhTaskId: '',
      rhTaskStatus: 'pending',
      rhTaskStartedAt: _0x3f32b1,
      rhTaskRecovering: false,
      rhSourceNodeId: String(_0x258a23.sourceNodeId || ''),
      rhToolbarTaskType: String(_0x258a23.taskType || ''),
    };
  if (isAsyncModelApiSpec(_0x258a23))
    return {
      ..._0xd64a8d,
      asyncTaskId: '',
      asyncTaskStatus: 'pending',
      asyncTaskStartedAt: _0x3f32b1,
      asyncTaskRecovering: false,
    };
  return _0xd64a8d;
}
function buildProtocolTaskIdPatch(_0x3c6bfb, _0x54744a, _0x57df30) {
  if (!_0x54744a) return {};
  if (isWorkflowSpec(_0x3c6bfb))
    return {
      rhTaskId: _0x54744a,
      rhTaskStatus: 'running',
      rhTaskStartedAt: _0x57df30,
      rhTaskRecovering: false,
    };
  if (isAsyncModelApiSpec(_0x3c6bfb))
    return {
      asyncTaskId: _0x54744a,
      asyncTaskStatus: 'running',
      asyncTaskStartedAt: _0x57df30,
      asyncTaskRecovering: false,
    };
  return {};
}
function buildProtocolTerminalPatch(_0xd7e9e, _0x2ff8b2) {
  if (isWorkflowSpec(_0xd7e9e)) return { rhTaskStatus: _0x2ff8b2, rhTaskRecovering: false };
  if (isAsyncModelApiSpec(_0xd7e9e)) return { asyncTaskStatus: _0x2ff8b2, asyncTaskRecovering: false };
  return {};
}
function buildProtocolPendingPatch(_0xd0f655, _0x119178, _0x3590ef = '') {
  const _0x51ee3f = String(_0x119178?.taskId || '').trim(),
    _0x355dd2 = {
      isGenerating: true,
      jobStatus: 'running',
      jobError: null,
      generationDuration: null,
      ...(_0x3590ef ? { statusMessage: _0x3590ef } : {}),
    };
  if (isWorkflowSpec(_0xd0f655))
    return {
      ..._0x355dd2,
      ...(_0x51ee3f
        ? buildProtocolTaskIdPatch(_0xd0f655, _0x51ee3f, _0x119178.startedAt)
        : { rhTaskStatus: 'pending' }),
      rhTaskRecovering: false,
      ...(_0x3590ef ? { rhStatusMessage: _0x3590ef } : {}),
    };
  if (isAsyncModelApiSpec(_0xd0f655))
    return {
      ..._0x355dd2,
      ...(_0x51ee3f
        ? buildProtocolTaskIdPatch(_0xd0f655, _0x51ee3f, _0x119178.startedAt)
        : { asyncTaskStatus: 'pending' }),
      asyncTaskRecovering: false,
    };
  return _0x355dd2;
}
function isMissingTargetNodeError(_0x384a11, _0x5a7ef9) {
  const _0x39e0bc = String(_0x384a11?.message || '');
  return _0x39e0bc.includes('updateNodeData()') && _0x39e0bc.includes(String(_0x5a7ef9 || ''));
}
function updateTaskNode(_0x1955ba, _0x2c7ebd, _0x5d034c, { allowMissing: allowMissing = false } = {}) {
  if (!_0x2c7ebd || !_0x5d034c || typeof _0x5d034c !== 'object') return false;
  try {
    return (_0x1955ba.updateNodeData(_0x2c7ebd, _0x5d034c), true);
  } catch (_0x1e4dff) {
    if (allowMissing && isMissingTargetNodeError(_0x1e4dff, _0x2c7ebd)) return false;
    throw _0x1e4dff;
  }
}
function notifyTaskChange(_0xd48b32, _0x531e3e = {}) {
  typeof _0xd48b32?.spec?.onTaskChange === 'function' &&
    _0xd48b32.spec.onTaskChange({
      sourceNodeId: _0xd48b32.sourceNodeId,
      targetNodeId: _0xd48b32.targetNodeId,
      taskId: _0xd48b32.taskId,
      ..._0x531e3e,
    });
}
function isAbortLike(_0x420dd4) {
  const _0x54a289 = String(_0x420dd4?.message || _0x420dd4 || '');
  return (
    _0x420dd4?.name === 'AbortError' ||
    _0x54a289 === 'CANCELLED' ||
    _0x54a289 === getCancelledMessage() ||
    CANCELLED_MESSAGE_ALIASES.includes(_0x54a289) ||
    _0x54a289.toLowerCase().includes('aborted')
  );
}
function parseErrorMessage(_0xc121e5, _0x2ef22d = {}, _0x2881bd = t('coreUi.generationTask.generateFailed')) {
  if (typeof _0x2ef22d.parseError === 'function') {
    const _0x55b55e = _0x2ef22d.parseError(_0xc121e5),
      _0x386e34 = String(_0x55b55e || '').trim();
    if (_0x386e34) return _0x386e34;
  }
  if (typeof _0xc121e5?.getUserMessage === 'function') {
    const _0x527284 = String(_0xc121e5.getUserMessage() || '').trim();
    if (_0x527284) return _0x527284;
  }
  return String(_0xc121e5?.message || _0x2881bd).trim() || _0x2881bd;
}
function createCancelledError() {
  const _0x27f153 = new Error(getCancelledMessage());
  return ((_0x27f153.name = 'AbortError'), _0x27f153);
}
function isCancelledStatus(_0x41cee1) {
  const _0x1a5895 = String(_0x41cee1 || '')
    .trim()
    .toLowerCase();
  return _0x1a5895 === 'cancelled' || _0x1a5895 === 'canceled';
}
function isContextCancelled(_0x210605) {
  if (_0x210605?.cancelRequested === true) return true;
  const _0x42f360 = getStateSnapshot(_0x210605.store).nodes?.[_0x210605.targetNodeId];
  return (
    isCancelledStatus(_0x42f360?.jobStatus) ||
    isCancelledStatus(_0x42f360?.rhTaskStatus) ||
    isCancelledStatus(_0x42f360?.asyncTaskStatus)
  );
}
function shouldPauseOnAbort(_0x2f9644 = {}, _0x1aeccf = {}) {
  if (_0x2f9644.pauseOnAbort === true) return true;
  if (_0x2f9644.pauseOnAbort !== 'afterTaskId') return false;
  return !!String(_0x1aeccf?.taskId || _0x2f9644.taskId || '').trim();
}
function isContextInFlight(_0x52d73d) {
  return !!_0x52d73d && _0x52d73d.inFlight === true && !isContextCancelled(_0x52d73d);
}
function markContextIdle(_0x4c20d5) {
  if (_0x4c20d5) _0x4c20d5.inFlight = false;
}
function deleteActiveTask(_0x184458, _0x32eae3) {
  (!_0x32eae3 || activeTasks.get(_0x184458) === _0x32eae3) && activeTasks.delete(_0x184458);
}
function buildAlreadyActiveResult(_0x2c7680, _0x1757f2, _0xa4aaad) {
  return {
    ok: true,
    status: 'running',
    alreadyActive: true,
    targetNodeId: _0x1757f2,
    taskId: String(_0x2c7680?.taskId || _0xa4aaad || '').trim(),
  };
}
async function cancelRemoteTask(
  _0x14e7eb,
  { taskId: _0x33099a, node: node = null, options: options = {} } = {},
) {
  const _0x2232f9 = String(_0x33099a || _0x14e7eb?.taskId || '').trim(),
    _0xfeacf0 = getCancelFn(_0x14e7eb || { spec: options.spec }, options);
  if (typeof _0xfeacf0 !== 'function' || !_0x2232f9) return;
  return await _0xfeacf0({
    taskId: _0x2232f9,
    targetNodeId: _0x14e7eb?.targetNodeId || options.targetNodeId || '',
    sourceNodeId: _0x14e7eb?.sourceNodeId || node?.rhSourceNodeId || '',
    spec: _0x14e7eb?.spec || options.spec || {},
    node: node,
  });
}
async function ensureTargetNode(_0x454cdd, _0x24d2b3, _0x9242d1) {
  const _0x195568 = String(_0x454cdd.targetNodeId || '').trim();
  if (_0x195568) return _0x195568;
  if (typeof _0x454cdd.createTargetNode !== 'function')
    throw new Error('[generationTaskRuntime] targetNodeId or createTargetNode() is required');
  const _0x4d9e6b = await _0x454cdd.createTargetNode({
    spec: _0x454cdd,
    startedAt: _0x9242d1,
    startPatch: buildGenerationStartPatch({ startedAt: _0x9242d1 }),
    protocolPatch: buildProtocolStartPatch(_0x454cdd, _0x9242d1),
  });
  if (!_0x4d9e6b || typeof _0x4d9e6b !== 'object')
    throw new Error('[generationTaskRuntime] createTargetNode() must return a node');
  const _0x258c1a = String(_0x4d9e6b.id || '').trim();
  if (!_0x258c1a) throw new Error('[generationTaskRuntime] created target node must include id');
  return (_0x24d2b3.addNode(_0x4d9e6b), _0x258c1a);
}
function buildContext(_0x12b570, _0x4c4c78, _0x295d00, _0x482341, _0x307011) {
  const _0x2abe98 =
    _0x307011.abortController || (typeof AbortController === 'function' ? new AbortController() : null);
  return {
    spec: _0x12b570,
    store: _0x295d00,
    targetNodeId: _0x4c4c78,
    sourceNodeId: String(_0x12b570.sourceNodeId || ''),
    taskType: String(_0x12b570.taskType || ''),
    startedAt: _0x482341,
    taskId: String(_0x12b570.taskId || ''),
    abortController: _0x2abe98,
    signal: _0x307011.signal || _0x2abe98?.signal || null,
    cancelRequested: false,
    inFlight: true,
  };
}
export async function normalizeResult(_0x29159f, { spec: _0x14ab83, context: _0x49ab9d } = {}) {
  if (typeof _0x14ab83?.resultBuilder !== 'function') return {};
  const _0x240627 = await _0x14ab83.resultBuilder(_0x29159f, {
    spec: _0x14ab83,
    targetNodeId: _0x49ab9d?.targetNodeId || _0x14ab83.targetNodeId,
    sourceNodeId: _0x49ab9d?.sourceNodeId || _0x14ab83.sourceNodeId,
    taskId: _0x49ab9d?.taskId || _0x14ab83.taskId || '',
    startedAt: _0x49ab9d?.startedAt || _0x14ab83.startedAt || 0,
  });
  return _0x240627 && typeof _0x240627 === 'object' ? _0x240627 : {};
}
async function buildOptionalTaskPatch(_0x21ef03, _0x27f007) {
  if (typeof _0x21ef03 !== 'function') return {};
  const _0x5c8f5b = await _0x21ef03(..._0x27f007);
  return _0x5c8f5b && typeof _0x5c8f5b === 'object' ? _0x5c8f5b : {};
}
async function buildStartExtraPatch(_0x20a478, _0x5f1c1c) {
  if (typeof _0x20a478?.startBuilder === 'function') {
    const _0x2baace = await _0x20a478.startBuilder(_0x5f1c1c);
    return _0x2baace && typeof _0x2baace === 'object' ? _0x2baace : {};
  }
  if (
    _0x20a478?.startPatch &&
    typeof _0x20a478.startPatch === 'object' &&
    !Array.isArray(_0x20a478.startPatch)
  )
    return { ..._0x20a478.startPatch };
  return {};
}
export async function pollTask(_0x8dfb7e, _0x50c271 = {}) {
  const _0x1f1fc4 = getPollFn(_0x8dfb7e);
  if (typeof _0x1f1fc4 !== 'function') throw new Error('[generationTaskRuntime] poll function is required');
  return _0x1f1fc4({
    taskId: String(_0x8dfb7e.taskId || _0x8dfb7e.spec?.taskId || ''),
    targetNodeId: _0x8dfb7e.targetNodeId || _0x8dfb7e.spec?.targetNodeId,
    sourceNodeId: _0x8dfb7e.sourceNodeId || _0x8dfb7e.spec?.sourceNodeId,
    taskType: _0x8dfb7e.taskType || _0x8dfb7e.spec?.taskType,
    payload: _0x8dfb7e.payload || _0x8dfb7e.spec?.payload,
    spec: _0x8dfb7e.spec || _0x8dfb7e,
    signal: _0x50c271.signal || _0x8dfb7e.signal || _0x8dfb7e.abortController?.signal || null,
  });
}
export async function submitTask(_0x94f50d, _0x2c6212 = {}) {
  assertSpec(_0x94f50d, { requireSubmit: true });
  const _0xe1ed52 = getStore(_0x2c6212),
    _0x5db32c = Number(_0x94f50d.startedAt || _0x2c6212.startedAt || nowFrom(_0x2c6212)),
    _0x4a9fa5 = String(_0x94f50d.targetNodeId || '').trim(),
    _0x252bb2 = _0x4a9fa5 || (await ensureTargetNode(_0x94f50d, _0xe1ed52, _0x5db32c)),
    _0x15d579 = { ..._0x94f50d, targetNodeId: _0x252bb2 },
    _0x4e8269 = buildContext(_0x15d579, _0x252bb2, _0xe1ed52, _0x5db32c, _0x2c6212);
  activeTasks.set(_0x252bb2, _0x4e8269);
  const _0xd8d2b3 = await buildStartExtraPatch(_0x15d579, _0x4e8269);
  updateTaskNode(_0xe1ed52, _0x252bb2, {
    ...buildGenerationStartPatch({ startedAt: _0x5db32c }),
    ...buildProtocolStartPatch(_0x15d579, _0x5db32c),
    ..._0xd8d2b3,
  });
  typeof _0x15d579.onTaskStart === 'function' && _0x15d579.onTaskStart(_0x4e8269);
  notifyTaskChange(_0x4e8269, { status: 'running' });
  try {
    const _0x19b7ca = getSubmitFn(_0x15d579),
      _0x29c6be = await _0x19b7ca(_0x15d579.payload, {
        spec: _0x15d579,
        targetNodeId: _0x252bb2,
        sourceNodeId: _0x4e8269.sourceNodeId,
        taskType: _0x4e8269.taskType,
        signal: _0x4e8269.signal,
        onTaskId: (_0x53a210) => {
          const _0x5d120c = String(_0x53a210 || '').trim();
          if (!_0x5d120c) return;
          _0x4e8269.taskId = _0x5d120c;
          if (isContextCancelled(_0x4e8269)) return;
          (updateTaskNode(_0xe1ed52, _0x252bb2, buildProtocolTaskIdPatch(_0x15d579, _0x5d120c, _0x5db32c)),
            notifyTaskChange(_0x4e8269, { status: 'running' }));
        },
      }),
      _0x509108 = extractTaskId(_0x29c6be);
    _0x509108 && (_0x4e8269.taskId = _0x509108);
    if (isContextCancelled(_0x4e8269)) {
      try {
        await cancelRemoteTask(_0x4e8269, {
          taskId: _0x4e8269.taskId,
          node: getStateSnapshot(_0xe1ed52).nodes?.[_0x252bb2],
        });
      } catch {}
      throw createCancelledError();
    }
    _0x509108 &&
      (updateTaskNode(_0xe1ed52, _0x252bb2, buildProtocolTaskIdPatch(_0x15d579, _0x509108, _0x5db32c)),
      notifyTaskChange(_0x4e8269, { status: 'running' }));
    if (_0x15d579.waitForResult === false)
      return (
        markContextIdle(_0x4e8269),
        { ok: true, status: 'submitted', targetNodeId: _0x252bb2, taskId: _0x4e8269.taskId }
      );
    const _0x5856f9 =
      _0x4e8269.taskId && getPollFn({ spec: _0x15d579 })
        ? await pollTask({ ..._0x4e8269, spec: _0x15d579 }, { signal: _0x4e8269.signal })
        : extractSubmittedResult(_0x29c6be);
    if (isContextCancelled(_0x4e8269)) throw createCancelledError();
    if (isPendingResult(_0x5856f9)) {
      const _0x5c9f2d = getPendingMessage(_0x5856f9);
      return (
        markContextIdle(_0x4e8269),
        updateTaskNode(_0xe1ed52, _0x252bb2, buildProtocolPendingPatch(_0x15d579, _0x4e8269, _0x5c9f2d)),
        notifyTaskChange(_0x4e8269, { status: 'pending' }),
        {
          ok: true,
          status: 'pending',
          pending: true,
          targetNodeId: _0x252bb2,
          taskId: _0x4e8269.taskId,
          result: _0x5856f9,
        }
      );
    }
    const _0x4176a4 = await normalizeResult(_0x5856f9, { spec: _0x15d579, context: _0x4e8269 });
    if (isContextCancelled(_0x4e8269)) throw createCancelledError();
    const _0x20b20e = nowFrom(_0x2c6212) - _0x5db32c;
    return (
      updateTaskNode(_0xe1ed52, _0x252bb2, {
        ...buildGenerationSuccessPatch({ startedAt: _0x5db32c, duration: _0x20b20e }),
        ..._0x4176a4,
        ...buildProtocolTerminalPatch(_0x15d579, 'success'),
      }),
      deleteActiveTask(_0x252bb2, _0x4e8269),
      notifyTaskChange(_0x4e8269, { status: 'success' }),
      playCompletionSound('generation-success'),
      showGenerationCompleteNotification(),
      { ok: true, status: 'success', targetNodeId: _0x252bb2, taskId: _0x4e8269.taskId, result: _0x5856f9 }
    );
  } catch (_0x2b12b9) {
    const _0x3f98a5 = nowFrom(_0x2c6212) - _0x5db32c,
      _0x1410a3 = isAbortLike(_0x2b12b9),
      _0x3b719f = getStateSnapshot(_0xe1ed52).nodes?.[_0x252bb2] || {};
    if (
      _0x1410a3 &&
      (isCancelledStatus(_0x3b719f?.jobStatus) ||
        isCancelledStatus(_0x3b719f?.rhTaskStatus) ||
        isCancelledStatus(_0x3b719f?.asyncTaskStatus))
    )
      return (
        deleteActiveTask(_0x252bb2, _0x4e8269),
        notifyTaskChange(_0x4e8269, { status: 'cancelled' }),
        {
          ok: false,
          status: 'cancelled',
          targetNodeId: _0x252bb2,
          taskId: _0x4e8269.taskId,
          error: _0x2b12b9,
        }
      );
    if (_0x1410a3 && shouldPauseOnAbort(_0x15d579, _0x4e8269)) {
      const _0x418df1 = await buildOptionalTaskPatch(_0x15d579.pauseBuilder, [_0x4e8269]);
      return (
        updateTaskNode(
          _0xe1ed52,
          _0x252bb2,
          { ...buildProtocolPendingPatch(_0x15d579, _0x4e8269), ..._0x418df1 },
          { allowMissing: true },
        ),
        deleteActiveTask(_0x252bb2, _0x4e8269),
        notifyTaskChange(_0x4e8269, { status: 'paused' }),
        { ok: false, status: 'paused', targetNodeId: _0x252bb2, taskId: _0x4e8269.taskId, error: _0x2b12b9 }
      );
    }
    const _0x99ba20 = _0x1410a3
        ? buildGenerationCancelledPatch({ startedAt: _0x5db32c, duration: _0x3f98a5 })
        : buildGenerationFailurePatch({
            error: parseErrorMessage(_0x2b12b9, _0x15d579, t('coreUi.generationTask.generateFailed')),
            startedAt: _0x5db32c,
            duration: _0x3f98a5,
          }),
      _0xde0b50 = await buildOptionalTaskPatch(
        _0x1410a3 ? _0x15d579.cancelledBuilder : _0x15d579.failureBuilder,
        _0x1410a3 ? [_0x4e8269] : [_0x2b12b9, _0x4e8269],
      );
    return (
      updateTaskNode(_0xe1ed52, _0x252bb2, {
        ..._0x99ba20,
        ..._0xde0b50,
        ...buildProtocolTerminalPatch(_0x15d579, _0x1410a3 ? 'cancelled' : 'failed'),
      }),
      deleteActiveTask(_0x252bb2, _0x4e8269),
      notifyTaskChange(_0x4e8269, { status: _0x1410a3 ? 'cancelled' : 'failed' }),
      {
        ok: false,
        status: _0x1410a3 ? 'cancelled' : 'failed',
        targetNodeId: _0x252bb2,
        taskId: _0x4e8269.taskId,
        error: _0x2b12b9,
      }
    );
  }
}
export async function cancelTask(_0x511d86, _0x548e84 = {}) {
  const _0xd4c3b5 = getStore(_0x548e84),
    _0x2bb711 = String(
      typeof _0x511d86 === 'object'
        ? _0x511d86?.targetNodeId || _0x511d86?.outId || _0x511d86?.id
        : _0x511d86 || '',
    ).trim();
  if (!_0x2bb711) return { ok: false, reason: 'missing-target' };
  const _0x252602 = activeTasks.get(_0x2bb711) || null,
    _0x3f831b = getStateSnapshot(_0xd4c3b5).nodes?.[_0x2bb711] || {},
    _0x1657a0 = _0x252602?.spec ||
      _0x548e84.spec || {
        adapterType: _0x3f831b.adapterType,
        provider: _0x3f831b.provider,
        async: !!_0x3f831b.asyncTaskId,
      },
    _0x5382ae = _0x548e84.cancellable === true || _0x252602?.spec?.cancellable === true;
  if (!_0x5382ae) {
    if (_0x548e84.abortLocal === true) {
      if (_0x252602) _0x252602.cancelRequested = true;
      _0x252602?.abortController?.abort?.();
    }
    return { ok: false, reason: 'not-cancellable', targetNodeId: _0x2bb711 };
  }
  const _0x2e417e = String(
      _0x548e84.taskId ||
        _0x252602?.taskId ||
        _0x511d86?.taskId ||
        _0x3f831b.rhTaskId ||
        _0x3f831b.asyncTaskId ||
        '',
    ),
    _0x37f265 = getCancelFn(_0x252602 || { spec: _0x1657a0 }, _0x548e84);
  let _0xb2f0fa = null,
    _0x12f3d9 = null;
  try {
    if (_0x252602) _0x252602.cancelRequested = true;
    _0x252602?.abortController?.abort?.();
  } catch {}
  if (typeof _0x37f265 === 'function' && _0x2e417e)
    try {
      _0xb2f0fa = await cancelRemoteTask(_0x252602 || { spec: _0x1657a0, targetNodeId: _0x2bb711 }, {
        taskId: _0x2e417e,
        node: _0x3f831b,
        options: { ..._0x548e84, cancel: _0x37f265, spec: _0x1657a0, targetNodeId: _0x2bb711 },
      });
    } catch (_0x31079b) {
      _0x12f3d9 = _0x31079b;
    }
  const _0x55b052 = Number(_0x3f831b.generationStartTime || _0x3f831b.rhTaskStartedAt || 0) || 0,
    _0xb86928 = await buildOptionalTaskPatch(_0x548e84.cancelledBuilder || _0x1657a0.cancelledBuilder, [
      {
        spec: _0x1657a0,
        store: _0xd4c3b5,
        targetNodeId: _0x2bb711,
        startedAt: _0x55b052,
        taskId: _0x2e417e,
        remoteResult: _0xb2f0fa,
        remoteError: _0x12f3d9,
      },
    ]);
  return (
    updateTaskNode(_0xd4c3b5, _0x2bb711, {
      ...buildGenerationCancelledPatch({ startedAt: _0x55b052 }),
      ..._0xb86928,
      ...buildProtocolTerminalPatch(_0x1657a0, 'cancelled'),
    }),
    activeTasks.delete(_0x2bb711),
    notifyTaskChange(_0x252602, { status: 'cancelled' }),
    { ok: true, status: 'cancelled', targetNodeId: _0x2bb711, taskId: _0x2e417e }
  );
}
export async function resumeTask(_0x32ddef, _0x38a596 = {}) {
  assertSpec(_0x32ddef, { requireTarget: true });
  const _0x27c19a = getStore(_0x38a596),
    _0x455dbf = String(_0x32ddef.targetNodeId || '').trim(),
    _0x41689a = getStateSnapshot(_0x27c19a).nodes?.[_0x455dbf] || {},
    _0x511f63 =
      Number(
        _0x32ddef.startedAt ||
          _0x41689a.generationStartTime ||
          _0x41689a.rhTaskStartedAt ||
          nowFrom(_0x38a596),
      ) || nowFrom(_0x38a596),
    _0x69682 = String(_0x32ddef.taskId || _0x41689a.rhTaskId || _0x41689a.asyncTaskId || '').trim();
  if (!_0x69682) throw new Error('[generationTaskRuntime] resumeTask requires taskId');
  const _0x3fe833 = activeTasks.get(_0x455dbf) || null;
  if (isContextInFlight(_0x3fe833)) return buildAlreadyActiveResult(_0x3fe833, _0x455dbf, _0x69682);
  const _0x32a8bd = { ..._0x32ddef, targetNodeId: _0x455dbf, taskId: _0x69682 },
    _0x474238 = buildContext(_0x32a8bd, _0x455dbf, _0x27c19a, _0x511f63, _0x38a596);
  ((_0x474238.taskId = _0x69682), activeTasks.set(_0x455dbf, _0x474238));
  const _0x5208db = await buildStartExtraPatch(_0x32a8bd, _0x474238);
  updateTaskNode(_0x27c19a, _0x455dbf, {
    ...buildGenerationStartPatch({ startedAt: _0x511f63 }),
    ...buildProtocolTaskIdPatch(_0x32a8bd, _0x69682, _0x511f63),
    ..._0x5208db,
    ...(isWorkflowSpec(_0x32a8bd) ? { rhTaskRecovering: true } : {}),
    ...(isAsyncModelApiSpec(_0x32a8bd) ? { asyncTaskRecovering: true } : {}),
  });
  typeof _0x32a8bd.onTaskStart === 'function' && _0x32a8bd.onTaskStart(_0x474238);
  notifyTaskChange(_0x474238, { status: 'running', recovering: true });
  try {
    const _0x33d67f = await pollTask({ ..._0x474238, spec: _0x32a8bd }, { signal: _0x474238.signal });
    if (isContextCancelled(_0x474238)) throw createCancelledError();
    if (isPendingResult(_0x33d67f)) {
      const _0x34bb08 = getPendingMessage(_0x33d67f);
      return (
        markContextIdle(_0x474238),
        updateTaskNode(_0x27c19a, _0x455dbf, buildProtocolPendingPatch(_0x32a8bd, _0x474238, _0x34bb08)),
        notifyTaskChange(_0x474238, { status: 'pending', recovering: true }),
        {
          ok: true,
          status: 'pending',
          pending: true,
          targetNodeId: _0x455dbf,
          taskId: _0x69682,
          result: _0x33d67f,
        }
      );
    }
    const _0x2dd082 = await normalizeResult(_0x33d67f, { spec: _0x32a8bd, context: _0x474238 });
    if (isContextCancelled(_0x474238)) throw createCancelledError();
    const _0x2f9346 = nowFrom(_0x38a596) - _0x511f63;
    return (
      updateTaskNode(_0x27c19a, _0x455dbf, {
        ...buildGenerationSuccessPatch({ startedAt: _0x511f63, duration: _0x2f9346 }),
        ..._0x2dd082,
        ...buildProtocolTerminalPatch(_0x32a8bd, 'success'),
      }),
      deleteActiveTask(_0x455dbf, _0x474238),
      notifyTaskChange(_0x474238, { status: 'success', recovering: false }),
      playCompletionSound('generation-success'),
      showGenerationCompleteNotification(),
      { ok: true, status: 'success', targetNodeId: _0x455dbf, taskId: _0x69682, result: _0x33d67f }
    );
  } catch (_0x260641) {
    const _0x698f7c = nowFrom(_0x38a596) - _0x511f63,
      _0x47752c = isAbortLike(_0x260641),
      _0x4726e1 = getStateSnapshot(_0x27c19a).nodes?.[_0x455dbf] || {};
    if (
      _0x47752c &&
      (isCancelledStatus(_0x4726e1?.jobStatus) ||
        isCancelledStatus(_0x4726e1?.rhTaskStatus) ||
        isCancelledStatus(_0x4726e1?.asyncTaskStatus))
    )
      return (
        deleteActiveTask(_0x455dbf, _0x474238),
        notifyTaskChange(_0x474238, { status: 'cancelled', recovering: false }),
        { ok: false, status: 'cancelled', targetNodeId: _0x455dbf, taskId: _0x69682, error: _0x260641 }
      );
    if (_0x47752c && shouldPauseOnAbort(_0x32a8bd, _0x474238)) {
      const _0x55bb95 = await buildOptionalTaskPatch(_0x32a8bd.pauseBuilder, [_0x474238]);
      return (
        updateTaskNode(
          _0x27c19a,
          _0x455dbf,
          { ...buildProtocolPendingPatch(_0x32a8bd, _0x474238), ..._0x55bb95 },
          { allowMissing: true },
        ),
        deleteActiveTask(_0x455dbf, _0x474238),
        notifyTaskChange(_0x474238, { status: 'paused', recovering: false }),
        { ok: false, status: 'paused', targetNodeId: _0x455dbf, taskId: _0x69682, error: _0x260641 }
      );
    }
    const _0x2c3967 = _0x47752c
        ? buildGenerationCancelledPatch({ startedAt: _0x511f63, duration: _0x698f7c })
        : buildGenerationFailurePatch({
            error: parseErrorMessage(_0x260641, _0x32a8bd, t('coreUi.generationTask.resumeFailed')),
            startedAt: _0x511f63,
            duration: _0x698f7c,
          }),
      _0x4324ba = await buildOptionalTaskPatch(
        _0x47752c ? _0x32a8bd.cancelledBuilder : _0x32a8bd.failureBuilder,
        _0x47752c ? [_0x474238] : [_0x260641, _0x474238],
      );
    return (
      updateTaskNode(_0x27c19a, _0x455dbf, {
        ..._0x2c3967,
        ..._0x4324ba,
        ...buildProtocolTerminalPatch(_0x32a8bd, _0x47752c ? 'cancelled' : 'failed'),
      }),
      deleteActiveTask(_0x455dbf, _0x474238),
      notifyTaskChange(_0x474238, { status: _0x47752c ? 'cancelled' : 'failed', recovering: false }),
      {
        ok: false,
        status: _0x47752c ? 'cancelled' : 'failed',
        targetNodeId: _0x455dbf,
        taskId: _0x69682,
        error: _0x260641,
      }
    );
  }
}
export function getActiveGenerationTask(_0x2abdec) {
  return activeTasks.get(String(_0x2abdec || '').trim()) || null;
}
export function __resetGenerationTaskRuntimeForTest() {
  activeTasks.clear();
}

let activeTaskSequence=0x0;

function findActiveTaskContext(_0x144f02,{storeLike:storeLike=null,taskCenterTaskId:taskCenterTaskId=''}={}){const _0x5f4e45=String(_0x144f02||'')["trim"]();if(!_0x5f4e45)return null;const _0x158fb5=String(taskCenterTaskId||'')['trim'](),_0x350626=Array['from'](activeTasks['values']())["filter"](_0x3c28d8=>_0x3c28d8?.["targetNodeId"]===_0x5f4e45&&(!storeLike||_0x3c28d8["store"]===storeLike)&&(!_0x158fb5||_0x3c28d8["taskCenterTaskId"]===_0x158fb5));return _0x350626["find"](_0x24a567=>isContextInFlight(_0x24a567))||_0x350626[0x0]||null;}

function normalizeCompletionFeedbackOutcome(_0x201665,_0x588f82){if(_0x201665["status"]==="rejected")return{'ok':![],'error':String(_0x201665["reason"]?.["message"]||_0x201665["reason"]||"Unknown error")};const _0x17ead5=_0x201665["value"]&&typeof _0x201665["value"]==="object"?_0x201665["value"]:{};if(_0x588f82==='notification')return{'ok':_0x17ead5["success"]!==![],'shown':_0x17ead5["shown"]===!![],'reason':String(_0x17ead5["reason"]||''),'error':String(_0x17ead5['error']||'')};return{'ok':_0x17ead5['ok']===!![],'native':_0x17ead5["native"]===!![],'skipped':String(_0x17ead5["skipped"]||''),'error':String(_0x17ead5["error"]?.['message']||_0x17ead5["error"]||'')};}

function dispatchGenerationCompletionFeedback(_0x4be651,{recovering:recovering=![]}={}){const _0x2ceb79=getStateSnapshot(_0x4be651['store'])["nodes"]?.[_0x4be651["targetNodeId"]]||{},_0x1116ae=Promise["allSettled"]([playCompletionSound("generation-success"),showGenerationCompleteNotification({'nodeId':_0x4be651["targetNodeId"],'navigation':{'source':"canvas",'nodeId':_0x4be651['targetNodeId'],'projectId':_0x4be651["projectId"],'canvasId':_0x4be651['taskScopeId']},'node':_0x2ceb79,'mediaKind':_0x4be651['spec']?.["modelManifest"]?.['outputType']||_0x4be651["spec"]?.["executionManifest"]?.["kind"]||_0x4be651["taskType"]||_0x2ceb79?.["outputType"]||_0x2ceb79?.["type"]||''})])["then"](([_0x39be61,_0x296d19])=>{const _0x28ccc6=normalizeCompletionFeedbackOutcome(_0x39be61,"sound"),_0x12ba53=normalizeCompletionFeedbackOutcome(_0x296d19,"notification"),_0x31e1ca=!_0x28ccc6['ok']&&_0x28ccc6["skipped"]!=='disabled',_0x346bd3=!_0x12ba53['ok'];return logDiagnosticEvent({'type':"generation.completion_feedback",'level':_0x31e1ca||_0x346bd3?"warn":"info",'source':'renderer','message':"Generation completion feedback dispatched",'context':{'targetNodeId':_0x4be651["targetNodeId"],'taskId':_0x4be651["taskId"],'taskType':_0x4be651["taskType"],'provider':String(_0x4be651["spec"]?.['provider']||''),'modelId':String(_0x4be651["spec"]?.["modelId"]||''),'recovering':recovering,'sound':_0x28ccc6,'notification':_0x12ba53}});});return void _0x1116ae['catch'](()=>{}),_0x1116ae;}

function normalizeProjectId(_0x12d15d){return String(_0x12d15d||'')['trim']();}

function resolveTaskProjectId(_0x3d54fc={},_0x11d7db={}){return normalizeProjectId(_0x11d7db["projectId"]||_0x3d54fc["projectId"]||globalThis["window"]?.["currentProjectId"]||'');}

function isRunningHubWorkflowQueueSpec(_0x2394da={}){return isRunningHubWorkflowQueueTarget({'provider':_0x2394da["provider"],'adapterType':_0x2394da['adapterType'],'payload':{..._0x2394da["payload"]&&typeof _0x2394da['payload']==="object"?_0x2394da["payload"]:{},'model':_0x2394da["modelId"],'provider':_0x2394da["provider"],'adapterType':_0x2394da['adapterType']}});}

function resolveSpecManifestContext(_0x102b2c={}){const _0x324981=_0x102b2c["modelManifest"]&&typeof _0x102b2c['modelManifest']==="object"?_0x102b2c['modelManifest']:null,_0x584c36=_0x102b2c["executionManifest"]&&typeof _0x102b2c["executionManifest"]==="object"?_0x102b2c["executionManifest"]:null;if(_0x324981&&_0x584c36)return{'modelManifest':_0x324981,'executionManifest':_0x584c36};const _0x315f0c=String(_0x102b2c["modelId"]||'')["trim"]();if(!_0x315f0c)return null;const _0x2f80e2=String(_0x102b2c["provider"]||'')["trim"]();let _0x384ef1=null;try{_0x384ef1=resolveModelExecution(_0x315f0c,_0x2f80e2?{'providerHint':_0x2f80e2}:{})||resolveModelExecution(_0x315f0c);}catch{_0x384ef1=null;}if(!_0x384ef1?.["modelManifest"]||!_0x384ef1?.['executionManifest'])return null;const _0x200d79=String(_0x102b2c['executionId']||'')["trim"](),_0x1dc70d=String(_0x384ef1["executionManifest"]['id']||'')["trim"]();if(_0x200d79&&_0x1dc70d!==_0x200d79)return null;return{'modelManifest':_0x324981||_0x384ef1["modelManifest"],'executionManifest':_0x584c36||_0x384ef1["executionManifest"]};}

function hasResultNormalizer(_0x118bb8={}){return typeof _0x118bb8['resultBuilder']==="function"||!!resolveSpecManifestContext(_0x118bb8);}

function mergeManifestResultPatch(_0x4afe0d,_0xb00714){if(!_0xb00714||typeof _0xb00714!=='object')return _0x4afe0d;if(!_0x4afe0d||typeof _0x4afe0d!=='object'||Array["isArray"](_0x4afe0d))return _0xb00714;return{..._0xb00714,..._0x4afe0d};}

function persistResumableTaskState(_0x2043eb,_0x51bdb3={}){if(_0x2043eb?.["spec"]?.['resumable']!==!![])return;if(typeof _0x2043eb['persistTaskState']!=="function")return;try{const _0x2f4726=_0x2043eb["persistTaskState"]({'sourceNodeId':_0x2043eb["sourceNodeId"],'targetNodeId':_0x2043eb['targetNodeId'],'taskId':_0x2043eb['taskId'],'spec':_0x2043eb["spec"],'patch':_0x51bdb3});_0x2f4726?.['catch']?.(()=>{});}catch{}}

function updateContextNode(_0x112718,_0x2bd81a,_0x27ee56,_0x2ab0f2={}){if(_0x112718?.["background"]!==!![]&&_0x112718?.["isTargetCurrent"]?.()===![])return![];const _0x1a7e90=updateTaskNode(_0x112718["store"],_0x2bd81a,_0x27ee56,_0x2ab0f2);if(_0x1a7e90){_0x2bd81a===_0x112718["targetNodeId"]&&persistResumableTaskState(_0x112718,_0x27ee56);if(typeof _0x112718['mirrorTaskState']==="function")try{const _0x390657=_0x112718["mirrorTaskState"]({'sourceNodeId':_0x112718['sourceNodeId'],'targetNodeId':_0x112718['targetNodeId'],'taskId':_0x112718["taskId"],'taskScopeId':_0x112718["taskScopeId"],'spec':_0x112718["spec"],'patch':_0x27ee56,'updatedNodeId':_0x2bd81a,'store':_0x112718["store"]});_0x390657?.["catch"]?.(_0x3ed63b=>{console['error']("[generationTaskRuntime] Failed to mirror background task state:",_0x3ed63b);});}catch(_0x203619){console['error']("[generationTaskRuntime] Failed to mirror background task state:",_0x203619);}}return _0x1a7e90;}

function updateContextTaskNode(_0x395921,_0x280ec7,_0x15ae90={}){return updateContextNode(_0x395921,_0x395921["targetNodeId"],_0x280ec7,_0x15ae90);}

function getQueuedMessage(){const _0x94571=String(t("coreUi.generationTask.queued")||'')["trim"]();return _0x94571&&_0x94571!=="coreUi.generationTask.queued"?_0x94571:"Queued";}

function canAbortContextSignal(_0x5b36c4){if(typeof _0x5b36c4?.["abortController"]?.["abort"]!=="function")return![];return!_0x5b36c4["signal"]||_0x5b36c4["signal"]===_0x5b36c4['abortController']["signal"];}

function cancelContextRemoteTaskOnce(_0x5b8dde,{taskId:_0xc006d1,node:node=null,options:options={}}={}){const _0x4bb9de=String(_0xc006d1||_0x5b8dde?.["taskId"]||'')['trim']();if(!_0x5b8dde||!_0x4bb9de)return Promise["resolve"](cancelRemoteTask(_0x5b8dde,{'taskId':_0x4bb9de,'node':node,'options':options}));if(_0x5b8dde["remoteCancellationTaskId"]===_0x4bb9de&&_0x5b8dde["remoteCancellationPromise"])return _0x5b8dde['remoteCancellationPromise'];return _0x5b8dde["remoteCancellationTaskId"]=_0x4bb9de,_0x5b8dde["remoteCancellationPromise"]=Promise['resolve'](cancelRemoteTask(_0x5b8dde,{'taskId':_0x4bb9de,'node':node,'options':options})),_0x5b8dde["remoteCancellationPromise"];}

async function pauseTaskContexts(_0x248316,_0x343864,_0x1bbaad={}){const _0x41afbd=_0x248316["filter"](_0x462e28=>{if(_0x462e28?.['spec']?.["resumable"]!==!![])return!![];if(!String(_0x462e28?.["taskId"]||'')["trim"]())return!![];if(!shouldPauseOnAbort(_0x462e28["spec"],_0x462e28))return!![];return!canAbortContextSignal(_0x462e28);})["map"](_0x38f314=>({'targetNodeId':_0x38f314["targetNodeId"],'taskId':String(_0x38f314["taskId"]||'')['trim'](),'taskType':_0x38f314["taskType"],'reason':_0x38f314?.['spec']?.["resumable"]!==!![]?"not-resumable":!String(_0x38f314?.["taskId"]||'')['trim']()?"missing-task-id":!shouldPauseOnAbort(_0x38f314['spec'],_0x38f314)?'pause-not-supported':"abort-unavailable"}));if(_0x41afbd["length"]>0x0)return{'ok':![],'projectId':_0x343864,'activeCount':_0x248316["length"],'pausedCount':0x0,'blockers':_0x41afbd};if(_0x1bbaad["dryRun"]===!![])return{'ok':!![],'projectId':_0x343864,'activeCount':_0x248316['length'],'pausedCount':0x0,'blockers':[],'pausedTasks':[]};const _0x3cf697=[];_0x248316["forEach"](_0x26ac3e=>{_0x26ac3e["abortController"]["signal"]?.["aborted"]!==!![]&&_0x26ac3e['abortController']["abort"](),_0x3cf697["push"]({'targetNodeId':_0x26ac3e['targetNodeId'],'taskId':String(_0x26ac3e["taskId"]||'')["trim"](),'taskType':_0x26ac3e["taskType"]});});const _0x35694c=Math["max"](0x64,Number(_0x1bbaad['timeoutMs'])||0xbb8);if(_0x248316["length"]>0x0){let _0x244753=null;const _0xe9278e=new Promise(_0x469676=>{_0x244753=setTimeout(()=>_0x469676(![]),_0x35694c),_0x244753?.["unref"]?.();}),_0x42b045=await Promise["race"]([Promise['all'](_0x248316["map"](_0x2776d2=>_0x2776d2["settledPromise"]))["then"](()=>!![]),_0xe9278e]);if(_0x244753!==null)clearTimeout(_0x244753);if(!_0x42b045)return{'ok':![],'projectId':_0x343864,'activeCount':_0x248316["length"],'pausedCount':_0x3cf697['length'],'blockers':_0x3cf697['map'](_0x3e4386=>({..._0x3e4386,'reason':"pause-timeout"})),'pausedTasks':_0x3cf697};await new Promise(_0x4bbaad=>setTimeout(_0x4bbaad,0x0));}return{'ok':!![],'projectId':_0x343864,'activeCount':_0x248316["length"],'pausedCount':_0x3cf697['length'],'blockers':[],'pausedTasks':_0x3cf697};}

export async function pauseProjectTasks(_0x5af87d,_0x15adf1={}){const _0x5b8809=normalizeProjectId(_0x5af87d),_0x428875=Array["from"](activeTasks["values"]())["filter"](_0x370400=>isContextInFlight(_0x370400)&&normalizeProjectId(_0x370400?.["projectId"])===_0x5b8809);return pauseTaskContexts(_0x428875,_0x5b8809,_0x15adf1);}

export async function pauseActiveWorkspaceTasks(_0x164c41={}){const _0x16d288=Array["from"](activeTasks["values"]())["filter"](isContextInFlight);return pauseTaskContexts(_0x16d288,"active-workspace",_0x164c41);}

export function handoffActiveGenerationTasks({sourceStore:sourceStore=appStore,targetStore:_0x4604c3,taskScopeId:_0x255eeb,mirrorTaskState:mirrorTaskState=null}={}){const _0x47dc45=String(_0x255eeb||'')["trim"]();if(!_0x4604c3||!_0x47dc45)return{'ok':![],'movedCount':0x0,'taskScopeId':_0x47dc45};const _0x16363c=Array['from'](activeTasks["values"]())["filter"](_0x37372d=>isContextInFlight(_0x37372d)&&_0x37372d["store"]===sourceStore);return _0x16363c["forEach"](_0x52c546=>{_0x52c546["store"]=_0x4604c3,_0x52c546["taskScopeId"]=_0x47dc45,_0x52c546["background"]=!![],_0x52c546['mirrorTaskState']=typeof mirrorTaskState==='function'?mirrorTaskState:null;}),{'ok':!![],'movedCount':_0x16363c["length"],'taskScopeId':_0x47dc45,'targetNodeIds':_0x16363c["map"](_0x5f8a01=>_0x5f8a01["targetNodeId"])};}

export function restoreActiveGenerationTasks({taskScopeId:_0x45a049,targetStore:targetStore=appStore}={}){const _0x778173=String(_0x45a049||'')["trim"](),_0x162c46=Array["from"](activeTasks["values"]())["filter"](_0x4107b4=>isContextInFlight(_0x4107b4)&&String(_0x4107b4["taskScopeId"]||'')['trim']()===_0x778173);return _0x162c46["forEach"](_0x3be224=>{_0x3be224["store"]=targetStore,_0x3be224["background"]=![],_0x3be224['mirrorTaskState']=null;}),{'ok':!![],'restoredCount':_0x162c46["length"],'taskScopeId':_0x778173,'targetNodeIds':_0x162c46["map"](_0x1f0fd7=>_0x1f0fd7["targetNodeId"])};}

export function hasActiveGenerationTasksForStore(_0x5c8542){return Array["from"](activeTasks["values"]())["some"](_0x2e6dd8=>isContextInFlight(_0x2e6dd8)&&_0x2e6dd8["store"]===_0x5c8542);}

export function hasActiveGenerationTasksForScope(_0x30854b){const _0x1797fb=String(_0x30854b||'')["trim"]();if(!_0x1797fb)return![];return Array["from"](activeTasks["values"]())["some"](_0x2dc447=>isContextInFlight(_0x2dc447)&&String(_0x2dc447["taskScopeId"]||'')["trim"]()===_0x1797fb);}

export function shouldPreserveGenerationTaskOnUnmount(_0x6b6876){const _0x246072=String(_0x6b6876||'')["trim"]();return Array['from'](activeTasks["values"]())["some"](_0xd828b1=>_0xd828b1?.["targetNodeId"]===_0x246072&&isContextInFlight(_0xd828b1)&&_0xd828b1["background"]===!![]);}

function startTaskContext(_0x3bcda3,_0x3d35ce,{recovering:recovering=![]}={}){const {spec:_0x442c76,startedAt:_0x32606d,taskId:_0x2d5906}=_0x3bcda3;if(_0x3bcda3["cancelRequested"]||_0x3bcda3["signal"]?.["aborted"])throw createCancelledError();updateContextTaskNode(_0x3bcda3,{...buildGenerationStartPatch({'startedAt':_0x32606d}),...buildGenerationProtocolTransitionPatch({'type':"start",'spec':_0x442c76,'startedAt':_0x32606d}),...recovering?buildGenerationProtocolTransitionPatch({'type':"taskId",'spec':_0x442c76,'taskId':_0x2d5906,'startedAt':_0x32606d}):{},..._0x3d35ce,...recovering&&isWorkflowSpec(_0x442c76)?{'rhTaskRecovering':!![]}:{},...recovering&&isAsyncModelApiSpec(_0x442c76)?{'asyncTaskRecovering':!![]}:{}});const _0x56538a=()=>{if(isContextCancelled(_0x3bcda3))throw createCancelledError();notifyTaskChange(_0x3bcda3,{'status':"running",...recovering?{'recovering':!![]}:{}});},_0x1c3c44=typeof _0x442c76["onTaskStart"]==="function"?_0x442c76["onTaskStart"](_0x3bcda3):null;return _0x1c3c44&&typeof _0x1c3c44['then']==='function'?Promise['resolve'](_0x1c3c44)['then'](_0x56538a):_0x56538a();}
