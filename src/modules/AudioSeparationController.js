import { resumeAudioSeparationTask, runAudioSeparation } from '../../api/aiAudioApi.js';
import { ensureConfig, getProviderConfig } from '../../api/configApi.js';
import { cancelRunningHubTask } from '../../api/runninghubTaskApi.js';
import { t } from '../i18n/index.js';
import { buildGenerationStartPatch } from '../core/generationTaskLifecycle.js';
import { findAvailablePosition, generateId } from '../core/math.js';
import appStore from '../core/stores/appStore.js';
import { buildCanvasLocalAudioFields, resolveCanvasAudioUrl } from '../services/canvasMediaLocalService.js';
import { buildSourceAudioNodePayload, getNodeDefaultSize } from '../services/fileService.js';
import { saveRemoteAudioLocallyDetailed } from '../services/projectService.js';
import { normalizeLocalPath, pickResultLocalPath } from '../utils/localMediaPath.js';
import { RH_AUDIO_SEPARATION_MODEL_ID, resolveModelExecution } from '../manifests/index.js';
import { buildLocalAudioGenerationResultPatch } from '../components/audio-node/audioGenerationResultRenderer.js';
import { getNodeSpawnPrefs } from './nodeSpawn.js';
const AUDIO_SPLIT_MODEL_ID = RH_AUDIO_SEPARATION_MODEL_ID,
  AUDIO_SPLIT_ROLE_VOCALS = 'vocals',
  AUDIO_SPLIT_ROLE_BACKGROUND = 'background';
function _resolveAudioSplitModelId() {
  const modelExecution = resolveModelExecution(AUDIO_SPLIT_MODEL_ID),
    enabled = String(modelExecution?.modelManifest?.modelId || '').trim();
  if (!enabled) throw new Error('RunningHub audio workflow manifest missing: ' + AUDIO_SPLIT_MODEL_ID);
  return enabled;
}
const AUDIO_SPLIT_MODEL = _resolveAudioSplitModelId();
let _runAudioSeparationImpl = runAudioSeparation,
  _resumeAudioSeparationTaskImpl = resumeAudioSeparationTask,
  _saveRemoteAudioLocallyDetailedImpl = saveRemoteAudioLocallyDetailed;
const _runtimeByLeaderId = new Map();
function audioSeparationText(value, item = {}) {
  return t('mediaProcessing.audioSeparation.' + value, item);
}
function _getState() {
  return typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
}
function _getNode(key) {
  return _getState().nodes?.[key] || null;
}
function _isAudioNodeType(index) {
  const result = String(index || '')
    .trim()
    .toLowerCase();
  return result === 'source-audio' || result === 'ai-audio' || result === 'audio';
}
function _fileNameFromPath(data) {
  const localPath = normalizeLocalPath(data);
  if (!localPath) return '';
  const list = localPath.split('/');
  return String(list[list.length - 1] || '').trim();
}
function _buildRunningHubTaskPatch({
  taskId: taskId = '',
  status: status = 'pending',
  startedAt: startedAt = 0,
  recovering: recovering = false,
  useOpenapiQuery: useOpenapiQuery = true,
} = {}) {
  return {
    rhTaskId: String(taskId || '').trim(),
    rhTaskStatus: String(status || 'pending').trim() || 'pending',
    rhTaskStartedAt: Number(startedAt || 0),
    rhTaskRecovering: recovering === true,
    rhTaskUseOpenapiQuery: useOpenapiQuery === true,
  };
}
function _isAudioSplitLeader(enabled2) {
  if (!enabled2 || typeof enabled2 !== 'object') return false;
  return (
    String(enabled2.type || '')
      .trim()
      .toLowerCase() === 'source-audio' &&
    String(enabled2.audioSplitRole || '')
      .trim()
      .toLowerCase() === AUDIO_SPLIT_ROLE_VOCALS &&
    String(enabled2.provider || '')
      .trim()
      .toLowerCase() === 'runninghubwf' &&
    String(enabled2.model || '').trim() === AUDIO_SPLIT_MODEL &&
    !!String(enabled2.audioSplitPeerId || '').trim()
  );
}
function _isRunningTaskStatus(options) {
  const target = String(options || '')
    .trim()
    .toLowerCase();
  return !['success', 'failed', 'idle', 'cancelled'].includes(target);
}
function _resolveAudioSplitLeaderId(source) {
  const enabled3 = String(source || '').trim();
  if (!enabled3) return '';
  const _getNode2 = _getNode(enabled3);
  if (_isAudioSplitLeader(_getNode2)) return enabled3;
  const next = String(_getNode2?.audioSplitPeerId || '').trim();
  if (next && _isAudioSplitLeader(_getNode(next))) return next;
  const _getState2 = _getState().nodes || {},
    current = Object.values(_getState2).find(
      (item2) =>
        _isAudioSplitLeader(item2) &&
        (String(item2.audioSplitPeerId || '') === enabled3 ||
          String(item2.rhSourceNodeId || '') === enabled3),
    );
  return String(current?.id || '');
}
function _getSpawnLayout(box) {
  const box2 = getNodeDefaultSize('source-audio'),
    width = Number(box?.width) > 0 ? Number(box.width) : box2.width,
    height = Number(box?.height) > 0 ? Number(box.height) : box2.height,
    { spacing: spacing, direction: direction, avoidOverlap: avoidOverlap } = getNodeSpawnPrefs(),
    resolvedDirection = direction === 'down' ? 'down' : 'right',
    innerGap = Math.max(24, Math.min(80, Math.round(spacing / 2))),
    entry = Number(box?.x) || 0,
    record = Number(box?.y) || 0,
    payload = Number(box?.width) || box2.width,
    handle = Number(box?.height) || box2.height;
  let x =
      resolvedDirection === 'right' ? entry + payload + spacing : entry + Math.round((payload - width) / 2),
    y = resolvedDirection === 'down' ? record + handle + spacing : record + Math.round((handle - height) / 2);
  const state = resolvedDirection === 'right' ? width * 2 + innerGap : width,
    config = resolvedDirection === 'down' ? height * 2 + innerGap : height;
  if (avoidOverlap) {
    const box3 = findAvailablePosition(
      _getState().nodes || {},
      x,
      y,
      state,
      config,
      spacing,
      resolvedDirection,
    );
    ((x = box3.x), (y = box3.y));
  }
  return {
    width: width,
    height: height,
    resolvedDirection: resolvedDirection,
    innerGap: innerGap,
    vocals: { x: x, y: y },
    background:
      resolvedDirection === 'right' ? { x: x + width + innerGap, y: y } : { x: x, y: y + height + innerGap },
  };
}
async function _persistAudioResult(scope) {
  const _saveRemoteAudioLocallyDetailedImpl2 = await _saveRemoteAudioLocallyDetailedImpl(scope),
    localPath2 = pickResultLocalPath(_saveRemoteAudioLocallyDetailedImpl2),
    audioUrl = String(
      _saveRemoteAudioLocallyDetailedImpl2?.localUrl || _saveRemoteAudioLocallyDetailedImpl2?.audioUrl || '',
    ).trim(),
    args = buildCanvasLocalAudioFields({ localPath: localPath2, audioUrl: audioUrl });
  if (!args.audioUrl || !args.localPath) throw new Error(audioSeparationText('localSaveFailed'));
  return { ...args, fileName: _fileNameFromPath(args.localPath) };
}
function _updateNodeIfExists(input, output) {
  if (!String(input || '').trim()) return;
  if (!_getNode(input)) return;
  appStore.updateNodeData(input, output);
}
function _focusCreatedNodes(value2, list2) {
  const list3 = Array.isArray(list2) ? list2.map((item3) => String(item3 || '').trim()).filter(Boolean) : [];
  if (!list3.length) return;
  appStore.setSelectedNodes(list3);
  if (typeof window.v2FocusOnNodes === 'function') window.v2FocusOnNodes([value2, ...list3]);
  else typeof window.v2FocusOnNode === 'function' && window.v2FocusOnNode(list3[0]);
}
function _persistLocalCache() {
  try {
    window._triggerLocalCacheSave?.();
  } catch {}
}
function _resolveSeparationResultUrls(value3) {
  const list4 = Array.isArray(value3?.audios) ? value3.audios : [],
    vocalsUrl = String(
      value3?.vocalsAudioUrl ||
        list4.find(
          (item4) =>
            String(item4?.role || '')
              .trim()
              .toLowerCase() === 'vocals' || String(item4?.nodeId || '').trim() === '5',
        )?.audioUrl ||
        list4[0]?.audioUrl ||
        '',
    ).trim(),
    backgroundUrl = String(
      value3?.backgroundAudioUrl ||
        list4.find(
          (item5) =>
            String(item5?.role || '')
              .trim()
              .toLowerCase() === 'background' || String(item5?.nodeId || '').trim() === '7',
        )?.audioUrl ||
        list4[1]?.audioUrl ||
        '',
    ).trim();
  return { vocalsUrl: vocalsUrl, backgroundUrl: backgroundUrl };
}
function _createPlaceholderPair(rhSourceNodeId) {
  const x2 = _getSpawnLayout(rhSourceNodeId),
    startedAt2 = Date.now(),
    id = generateId('source-audio-split-vocals'),
    audioSplitPeerId = generateId('source-audio-split-background'),
    sourceAudioNodePayload = buildSourceAudioNodePayload({
      id: id,
      x: x2.vocals.x,
      y: x2.vocals.y,
      width: x2.width,
      height: x2.height,
      name: audioSeparationText('nodeNames.vocalsProcessing'),
      audioSplitRole: AUDIO_SPLIT_ROLE_VOCALS,
      audioSplitPeerId: audioSplitPeerId,
      rhSourceNodeId: rhSourceNodeId.id,
      rhToolbarTaskType: 'audio-separation',
      provider: 'runninghubwf',
      model: AUDIO_SPLIT_MODEL,
      rhInstanceType: String(rhSourceNodeId?.rhInstanceType || '').trim() === 'plus' ? 'plus' : 'default',
      ...buildGenerationStartPatch({ startedAt: startedAt2 }),
      ..._buildRunningHubTaskPatch({
        taskId: '',
        status: 'pending',
        startedAt: startedAt2,
        recovering: false,
        useOpenapiQuery: true,
      }),
    }),
    sourceAudioNodePayload2 = buildSourceAudioNodePayload({
      id: audioSplitPeerId,
      x: x2.background.x,
      y: x2.background.y,
      width: x2.width,
      height: x2.height,
      name: audioSeparationText('nodeNames.backgroundProcessing'),
      audioSplitRole: AUDIO_SPLIT_ROLE_BACKGROUND,
      audioSplitPeerId: id,
      rhSourceNodeId: rhSourceNodeId.id,
      rhToolbarTaskType: 'audio-separation',
      ...buildGenerationStartPatch({ startedAt: startedAt2 }),
    });
  return (
    appStore.batch(() => {
      (appStore.addNode(sourceAudioNodePayload), appStore.addNode(sourceAudioNodePayload2));
    }),
    _focusCreatedNodes(rhSourceNodeId.id, [id, audioSplitPeerId]),
    _persistLocalCache(),
    { leaderId: id, peerId: audioSplitPeerId, startedAt: startedAt2 }
  );
}
async function _applySuccessResult({
  leaderId: leaderId,
  peerId: peerId,
  result: result2,
  startedAt: startedAt3,
}) {
  const { vocalsUrl: vocalsUrl2, backgroundUrl: backgroundUrl2 } = _resolveSeparationResultUrls(result2);
  if (!vocalsUrl2 || !backgroundUrl2) throw new Error(audioSeparationText('missingResultUrls'));
  const [value4, value5] = await Promise.all([
      _persistAudioResult(vocalsUrl2),
      _persistAudioResult(backgroundUrl2),
    ]),
    _getNode3 = _getNode(leaderId),
    taskId2 = String(_getNode3?.rhTaskId || result2?.taskId || '').trim();
  (appStore.batch(() => {
    (_updateNodeIfExists(leaderId, {
      name: audioSeparationText('nodeNames.vocals'),
      ...buildLocalAudioGenerationResultPatch(value4, { startedAt: startedAt3 }),
      ..._buildRunningHubTaskPatch({
        taskId: taskId2,
        status: 'success',
        startedAt: startedAt3,
        recovering: false,
        useOpenapiQuery: true,
      }),
    }),
      _updateNodeIfExists(peerId, {
        name: audioSeparationText('nodeNames.background'),
        ...buildLocalAudioGenerationResultPatch(value5, { startedAt: startedAt3 }),
      }));
  }),
    _persistLocalCache(),
    window.showToast?.(audioSeparationText('success'), 'success'));
}
function _buildEmptyAudioFields() {
  return buildCanvasLocalAudioFields({ localPath: '', audioUrl: '', fileName: '' });
}
function _applyFailureResult({
  leaderId: leaderId2,
  peerId: peerId2,
  startedAt: startedAt4,
  message: message,
}) {
  const error = String(message || audioSeparationText('fallback')).trim() || audioSeparationText('fallback'),
    _getNode4 = _getNode(leaderId2),
    args2 = _buildEmptyAudioFields();
  (appStore.batch(() => {
    (_updateNodeIfExists(leaderId2, {
      name: audioSeparationText('nodeNames.vocalsFailed'),
      ...buildLocalAudioGenerationResultPatch({ error: error }, { startedAt: startedAt4 }),
      ...args2,
      rhStatusMessage: error,
      rhStatusCode: null,
      ..._buildRunningHubTaskPatch({
        taskId: String(_getNode4?.rhTaskId || '').trim(),
        status: 'failed',
        startedAt: startedAt4,
        recovering: false,
        useOpenapiQuery: true,
      }),
    }),
      _updateNodeIfExists(peerId2, {
        name: audioSeparationText('nodeNames.backgroundFailed'),
        ...buildLocalAudioGenerationResultPatch({ error: error }, { startedAt: startedAt4 }),
        ...args2,
      }));
  }),
    _persistLocalCache(),
    window.showToast?.(audioSeparationText('failedWithMessage', { message: error }), 'error'));
}
async function _executeTask({
  leaderId: leaderId3,
  peerId: peerId3,
  sourceAudioUrl: sourceAudioUrl,
  rhInstanceType: rhInstanceType = 'default',
  startedAt: startedAt5,
  resume: resume = false,
  runtime: runtime,
}) {
  const run = (value6) => {
    const args3 = _runtimeByLeaderId.get(leaderId3) || {};
    _runtimeByLeaderId.set(leaderId3, { ...args3, taskId: String(value6 || '').trim() });
  };
  try {
    let result3 = null;
    if (resume) {
      const _getNode5 = _getNode(leaderId3),
        enabled4 = String(_getNode5?.rhTaskId || runtime.taskId || '').trim();
      if (!enabled4) throw new Error(audioSeparationText('missingTaskId'));
      result3 = await _resumeAudioSeparationTaskImpl(
        enabled4,
        { rhInstanceType: rhInstanceType },
        { signal: runtime.abortController?.signal },
      );
    } else
      (window.showToast?.(audioSeparationText('submitting'), 'info'),
        (result3 = await _runAudioSeparationImpl(
          { nodeId: leaderId3, audioUrl: sourceAudioUrl, rhInstanceType: rhInstanceType },
          {
            signal: runtime.abortController?.signal,
            onTaskMeta: ({ taskId: taskId3, useOpenapiQuery: useOpenapiQuery2 }) => {
              (run(taskId3),
                _updateNodeIfExists(leaderId3, {
                  ..._buildRunningHubTaskPatch({
                    taskId: taskId3,
                    status: 'pending',
                    startedAt: startedAt5,
                    recovering: false,
                    useOpenapiQuery: useOpenapiQuery2 === true,
                  }),
                }),
                _persistLocalCache());
            },
            onTaskId: (taskId4) => {
              (run(taskId4),
                _updateNodeIfExists(leaderId3, {
                  ..._buildRunningHubTaskPatch({
                    taskId: taskId4,
                    status: 'pending',
                    startedAt: startedAt5,
                    recovering: false,
                    useOpenapiQuery: true,
                  }),
                }),
                _persistLocalCache());
            },
          },
        )));
    await _applySuccessResult({
      leaderId: leaderId3,
      peerId: peerId3,
      result: result3,
      startedAt: startedAt5,
    });
  } catch (error2) {
    if (runtime.abortController?.signal?.aborted) return;
    const message2 =
      error2 instanceof Error ? error2.message : String(error2 || audioSeparationText('fallback'));
    _applyFailureResult({ leaderId: leaderId3, peerId: peerId3, startedAt: startedAt5, message: message2 });
  } finally {
    const value7 = _runtimeByLeaderId.get(leaderId3);
    value7?.promise === runtime.promise && _runtimeByLeaderId.delete(leaderId3);
  }
}
export async function runAudioSeparationFromNode(value8) {
  const rhInstanceType2 = _getNode(value8);
  if (!rhInstanceType2 || !_isAudioNodeType(rhInstanceType2.type))
    return (window.showToast?.(audioSeparationText('unsupportedNode'), 'warn'), null);
  if (rhInstanceType2.isGenerating) return (window.showToast?.(audioSeparationText('busy'), 'info'), null);
  const sourceAudioUrl2 = resolveCanvasAudioUrl(rhInstanceType2);
  if (!sourceAudioUrl2) return (window.showToast?.(audioSeparationText('missingAudio'), 'warn'), null);
  const {
      leaderId: leaderId4,
      peerId: peerId4,
      startedAt: startedAt6,
    } = _createPlaceholderPair(rhInstanceType2),
    runtime2 = { abortController: new AbortController(), promise: null, taskId: '' };
  _runtimeByLeaderId.set(leaderId4, runtime2);
  const _executeTask2 = _executeTask({
    leaderId: leaderId4,
    peerId: peerId4,
    sourceAudioUrl: sourceAudioUrl2,
    rhInstanceType: rhInstanceType2?.rhInstanceType || 'default',
    startedAt: startedAt6,
    resume: false,
    runtime: runtime2,
  });
  return (
    (runtime2.promise = _executeTask2),
    _runtimeByLeaderId.set(leaderId4, runtime2),
    await _executeTask2,
    { leaderId: leaderId4, peerId: peerId4 }
  );
}
export function getRunningAudioSeparationTaskForNode(value9) {
  const outId = _resolveAudioSplitLeaderId(value9);
  if (!outId) return null;
  const _getNode6 = _getNode(outId);
  if (!_isAudioSplitLeader(_getNode6)) return null;
  if (!_isRunningTaskStatus(_getNode6?.rhTaskStatus)) return null;
  return {
    sourceNodeId: String(_getNode6.rhSourceNodeId || ''),
    outId: outId,
    peerId: String(_getNode6.audioSplitPeerId || ''),
    taskId: String(_getNode6.rhTaskId || _runtimeByLeaderId.get(outId)?.taskId || ''),
    mode: 'audio-separation',
  };
}
export function hasRunningAudioSeparationTaskForNode(value10) {
  return !!getRunningAudioSeparationTaskForNode(value10);
}
async function _resolveRunningHubWorkflowApiKey() {
  try {
    return (await ensureConfig(), String(getProviderConfig('runninghubwf')?.apiKey || '').trim());
  } catch {
    return '';
  }
}
export async function cancelAudioSeparationTaskForNode(value11, { notify: notify = false } = {}) {
  const taskId5 = getRunningAudioSeparationTaskForNode(value11);
  if (!taskId5?.outId) return false;
  const value12 = taskId5.outId,
    value13 = taskId5.peerId,
    value14 = _runtimeByLeaderId.get(value12);
  try {
    value14?.abortController?.abort?.();
  } catch {}
  _runtimeByLeaderId.delete(value12);
  const _getNode7 = _getNode(value12),
    value15 = Number(_getNode7?.generationStartTime || _getNode7?.rhTaskStartedAt || 0) || Date.now(),
    generationDuration = Date.now() - value15,
    args4 = _buildEmptyAudioFields();
  (appStore.batch(() => {
    (_updateNodeIfExists(value12, {
      name: audioSeparationText('nodeNames.vocalsCancelled'),
      ...args4,
      isGenerating: false,
      jobStatus: null,
      jobError: null,
      generationDuration: generationDuration,
      rhTaskStatus: 'cancelled',
      rhTaskRecovering: false,
      rhStatusMessage: null,
    }),
      _updateNodeIfExists(value13, {
        name: audioSeparationText('nodeNames.backgroundCancelled'),
        ...args4,
        isGenerating: false,
        jobStatus: null,
        jobError: null,
        generationDuration: generationDuration,
      }));
  }),
    _persistLocalCache());
  const apiKey = await _resolveRunningHubWorkflowApiKey();
  if (apiKey && taskId5.taskId)
    try {
      await cancelRunningHubTask({ apiKey: apiKey, taskId: taskId5.taskId });
    } catch (value16) {
      console.warn('[AudioSeparationController] cancel request failed:', value16);
    }
  if (notify) window.showToast?.(audioSeparationText('cancelled'), 'info');
  return true;
}
export function maybeResumeAudioSeparationLeader(leaderId5) {
  const useOpenapiQuery3 = _getNode(leaderId5);
  if (!_isAudioSplitLeader(useOpenapiQuery3)) return null;
  if (!_isRunningTaskStatus(useOpenapiQuery3?.rhTaskStatus)) return null;
  const taskId6 = String(useOpenapiQuery3?.rhTaskId || '').trim();
  if (!taskId6) return null;
  const value17 = _runtimeByLeaderId.get(leaderId5);
  if (value17?.promise && value17.taskId === taskId6) return value17.promise;
  const startedAt7 =
    Number(useOpenapiQuery3?.rhTaskStartedAt || useOpenapiQuery3?.generationStartTime || 0) || Date.now();
  (appStore.batch(() => {
    (_updateNodeIfExists(leaderId5, {
      ...buildGenerationStartPatch({ startedAt: startedAt7 }),
      ..._buildRunningHubTaskPatch({
        taskId: taskId6,
        status:
          String(useOpenapiQuery3?.rhTaskStatus || '')
            .trim()
            .toLowerCase() === 'pending'
            ? 'pending'
            : 'running',
        startedAt: startedAt7,
        recovering: true,
        useOpenapiQuery: useOpenapiQuery3?.rhTaskUseOpenapiQuery === true,
      }),
    }),
      _updateNodeIfExists(useOpenapiQuery3?.audioSplitPeerId, {
        ...buildGenerationStartPatch({ startedAt: startedAt7 }),
        jobError: null,
      }));
  }),
    _persistLocalCache());
  const runtime3 = { abortController: new AbortController(), promise: null, taskId: taskId6 };
  _runtimeByLeaderId.set(leaderId5, runtime3);
  const _executeTask3 = _executeTask({
    leaderId: leaderId5,
    peerId: useOpenapiQuery3.audioSplitPeerId,
    sourceAudioUrl: '',
    rhInstanceType: useOpenapiQuery3?.rhInstanceType || 'default',
    startedAt: startedAt7,
    resume: true,
    runtime: runtime3,
  });
  return ((runtime3.promise = _executeTask3), _runtimeByLeaderId.set(leaderId5, runtime3), _executeTask3);
}
export function __setAudioSeparationDepsForTest({
  runAudioSeparationImpl: runAudioSeparationImpl,
  resumeAudioSeparationTaskImpl: resumeAudioSeparationTaskImpl,
  saveRemoteAudioLocallyDetailedImpl: saveRemoteAudioLocallyDetailedImpl,
} = {}) {
  ((_runAudioSeparationImpl =
    typeof runAudioSeparationImpl === 'function' ? runAudioSeparationImpl : runAudioSeparation),
    (_resumeAudioSeparationTaskImpl =
      typeof resumeAudioSeparationTaskImpl === 'function'
        ? resumeAudioSeparationTaskImpl
        : resumeAudioSeparationTask),
    (_saveRemoteAudioLocallyDetailedImpl =
      typeof saveRemoteAudioLocallyDetailedImpl === 'function'
        ? saveRemoteAudioLocallyDetailedImpl
        : saveRemoteAudioLocallyDetailed));
}
export function __resetAudioSeparationDepsForTest() {
  ((_runAudioSeparationImpl = runAudioSeparation),
    (_resumeAudioSeparationTaskImpl = resumeAudioSeparationTask),
    (_saveRemoteAudioLocallyDetailedImpl = saveRemoteAudioLocallyDetailed),
    _runtimeByLeaderId.forEach((item6) => {
      try {
        item6?.abortController?.abort?.();
      } catch {}
    }),
    _runtimeByLeaderId.clear());
}
