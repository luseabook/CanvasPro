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
  const _0x3e9362 = resolveModelExecution(AUDIO_SPLIT_MODEL_ID),
    _0x1ee994 = String(_0x3e9362?.modelManifest?.modelId || '').trim();
  if (!_0x1ee994) throw new Error('RunningHub audio workflow manifest missing: ' + AUDIO_SPLIT_MODEL_ID);
  return _0x1ee994;
}
const AUDIO_SPLIT_MODEL = _resolveAudioSplitModelId();
let _runAudioSeparationImpl = runAudioSeparation,
  _resumeAudioSeparationTaskImpl = resumeAudioSeparationTask,
  _saveRemoteAudioLocallyDetailedImpl = saveRemoteAudioLocallyDetailed;
const _runtimeByLeaderId = new Map();
function audioSeparationText(_0x158e92, _0x560c2b = {}) {
  return t('mediaProcessing.audioSeparation.' + _0x158e92, _0x560c2b);
}
function _getState() {
  return typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
}
function _getNode(_0x2ed587) {
  return _getState().nodes?.[_0x2ed587] || null;
}
function _isAudioNodeType(_0x5b083c) {
  const _0x36a1af = String(_0x5b083c || '')
    .trim()
    .toLowerCase();
  return _0x36a1af === 'source-audio' || _0x36a1af === 'ai-audio' || _0x36a1af === 'audio';
}
function _fileNameFromPath(_0x4b40a1) {
  const _0x38f2f0 = normalizeLocalPath(_0x4b40a1);
  if (!_0x38f2f0) return '';
  const _0x1eec71 = _0x38f2f0.split('/');
  return String(_0x1eec71[_0x1eec71.length - 1] || '').trim();
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
function _isAudioSplitLeader(_0x319e91) {
  if (!_0x319e91 || typeof _0x319e91 !== 'object') return false;
  return (
    String(_0x319e91.type || '')
      .trim()
      .toLowerCase() === 'source-audio' &&
    String(_0x319e91.audioSplitRole || '')
      .trim()
      .toLowerCase() === AUDIO_SPLIT_ROLE_VOCALS &&
    String(_0x319e91.provider || '')
      .trim()
      .toLowerCase() === 'runninghubwf' &&
    String(_0x319e91.model || '').trim() === AUDIO_SPLIT_MODEL &&
    !!String(_0x319e91.audioSplitPeerId || '').trim()
  );
}
function _isRunningTaskStatus(_0xba60f6) {
  const _0x5720fd = String(_0xba60f6 || '')
    .trim()
    .toLowerCase();
  return !['success', 'failed', 'idle', 'cancelled'].includes(_0x5720fd);
}
function _resolveAudioSplitLeaderId(_0x5f30a8) {
  const _0x614a10 = String(_0x5f30a8 || '').trim();
  if (!_0x614a10) return '';
  const _0x187449 = _getNode(_0x614a10);
  if (_isAudioSplitLeader(_0x187449)) return _0x614a10;
  const _0x49bdd0 = String(_0x187449?.audioSplitPeerId || '').trim();
  if (_0x49bdd0 && _isAudioSplitLeader(_getNode(_0x49bdd0))) return _0x49bdd0;
  const _0x493933 = _getState().nodes || {},
    _0x1c6178 = Object.values(_0x493933).find(
      (_0x2f4ef0) =>
        _isAudioSplitLeader(_0x2f4ef0) &&
        (String(_0x2f4ef0.audioSplitPeerId || '') === _0x614a10 ||
          String(_0x2f4ef0.rhSourceNodeId || '') === _0x614a10),
    );
  return String(_0x1c6178?.id || '');
}
function _getSpawnLayout(_0x5df527) {
  const _0x3c1574 = getNodeDefaultSize('source-audio'),
    _0x356b14 = Number(_0x5df527?.width) > 0 ? Number(_0x5df527.width) : _0x3c1574.width,
    _0x2a07a3 = Number(_0x5df527?.height) > 0 ? Number(_0x5df527.height) : _0x3c1574.height,
    { spacing: _0x15b39b, direction: _0x2ddf74, avoidOverlap: _0xb74726 } = getNodeSpawnPrefs(),
    _0x34b2c5 = _0x2ddf74 === 'down' ? 'down' : 'right',
    _0x254057 = Math.max(24, Math.min(80, Math.round(_0x15b39b / 2))),
    _0x538bbc = Number(_0x5df527?.x) || 0,
    _0x2aabc6 = Number(_0x5df527?.y) || 0,
    _0x34344a = Number(_0x5df527?.width) || _0x3c1574.width,
    _0x5d80f8 = Number(_0x5df527?.height) || _0x3c1574.height;
  let _0x3774ac =
      _0x34b2c5 === 'right'
        ? _0x538bbc + _0x34344a + _0x15b39b
        : _0x538bbc + Math.round((_0x34344a - _0x356b14) / 2),
    _0xe25d3d =
      _0x34b2c5 === 'down'
        ? _0x2aabc6 + _0x5d80f8 + _0x15b39b
        : _0x2aabc6 + Math.round((_0x5d80f8 - _0x2a07a3) / 2);
  const _0x94a756 = _0x34b2c5 === 'right' ? _0x356b14 * 2 + _0x254057 : _0x356b14,
    _0xca9598 = _0x34b2c5 === 'down' ? _0x2a07a3 * 2 + _0x254057 : _0x2a07a3;
  if (_0xb74726) {
    const _0x2afce0 = findAvailablePosition(
      _getState().nodes || {},
      _0x3774ac,
      _0xe25d3d,
      _0x94a756,
      _0xca9598,
      _0x15b39b,
      _0x34b2c5,
    );
    ((_0x3774ac = _0x2afce0.x), (_0xe25d3d = _0x2afce0.y));
  }
  return {
    width: _0x356b14,
    height: _0x2a07a3,
    resolvedDirection: _0x34b2c5,
    innerGap: _0x254057,
    vocals: { x: _0x3774ac, y: _0xe25d3d },
    background:
      _0x34b2c5 === 'right'
        ? { x: _0x3774ac + _0x356b14 + _0x254057, y: _0xe25d3d }
        : { x: _0x3774ac, y: _0xe25d3d + _0x2a07a3 + _0x254057 },
  };
}
async function _persistAudioResult(_0xeda105) {
  const _0x5bef7e = await _saveRemoteAudioLocallyDetailedImpl(_0xeda105),
    _0x3d3538 = pickResultLocalPath(_0x5bef7e),
    _0x4ac961 = String(_0x5bef7e?.localUrl || _0x5bef7e?.audioUrl || '').trim(),
    _0x139843 = buildCanvasLocalAudioFields({ localPath: _0x3d3538, audioUrl: _0x4ac961 });
  if (!_0x139843.audioUrl || !_0x139843.localPath) throw new Error(audioSeparationText('localSaveFailed'));
  return { ..._0x139843, fileName: _fileNameFromPath(_0x139843.localPath) };
}
function _updateNodeIfExists(_0x1ae0a3, _0x571132) {
  if (!String(_0x1ae0a3 || '').trim()) return;
  if (!_getNode(_0x1ae0a3)) return;
  appStore.updateNodeData(_0x1ae0a3, _0x571132);
}
function _focusCreatedNodes(_0x1a2d43, _0x708ad9) {
  const _0x4f78bd = Array.isArray(_0x708ad9)
    ? _0x708ad9.map((_0xdb6b3b) => String(_0xdb6b3b || '').trim()).filter(Boolean)
    : [];
  if (!_0x4f78bd.length) return;
  appStore.setSelectedNodes(_0x4f78bd);
  if (typeof window.v2FocusOnNodes === 'function') window.v2FocusOnNodes([_0x1a2d43, ..._0x4f78bd]);
  else typeof window.v2FocusOnNode === 'function' && window.v2FocusOnNode(_0x4f78bd[0]);
}
function _persistLocalCache() {
  try {
    window._triggerLocalCacheSave?.();
  } catch {}
}
function _resolveSeparationResultUrls(_0x1ad3fe) {
  const _0x175c50 = Array.isArray(_0x1ad3fe?.audios) ? _0x1ad3fe.audios : [],
    _0x1a550e = String(
      _0x1ad3fe?.vocalsAudioUrl ||
        _0x175c50.find(
          (_0x2de3b9) =>
            String(_0x2de3b9?.role || '')
              .trim()
              .toLowerCase() === 'vocals' || String(_0x2de3b9?.nodeId || '').trim() === '5',
        )?.audioUrl ||
        _0x175c50[0]?.audioUrl ||
        '',
    ).trim(),
    _0x1e84ac = String(
      _0x1ad3fe?.backgroundAudioUrl ||
        _0x175c50.find(
          (_0x3f6433) =>
            String(_0x3f6433?.role || '')
              .trim()
              .toLowerCase() === 'background' || String(_0x3f6433?.nodeId || '').trim() === '7',
        )?.audioUrl ||
        _0x175c50[1]?.audioUrl ||
        '',
    ).trim();
  return { vocalsUrl: _0x1a550e, backgroundUrl: _0x1e84ac };
}
function _createPlaceholderPair(_0x576036) {
  const _0x2ea89b = _getSpawnLayout(_0x576036),
    _0x20e24f = Date.now(),
    _0x3e2ad5 = generateId('source-audio-split-vocals'),
    _0x342fef = generateId('source-audio-split-background'),
    _0x28b100 = buildSourceAudioNodePayload({
      id: _0x3e2ad5,
      x: _0x2ea89b.vocals.x,
      y: _0x2ea89b.vocals.y,
      width: _0x2ea89b.width,
      height: _0x2ea89b.height,
      name: audioSeparationText('nodeNames.vocalsProcessing'),
      audioSplitRole: AUDIO_SPLIT_ROLE_VOCALS,
      audioSplitPeerId: _0x342fef,
      rhSourceNodeId: _0x576036.id,
      rhToolbarTaskType: 'audio-separation',
      provider: 'runninghubwf',
      model: AUDIO_SPLIT_MODEL,
      rhInstanceType: String(_0x576036?.rhInstanceType || '').trim() === 'plus' ? 'plus' : 'default',
      ...buildGenerationStartPatch({ startedAt: _0x20e24f }),
      ..._buildRunningHubTaskPatch({
        taskId: '',
        status: 'pending',
        startedAt: _0x20e24f,
        recovering: false,
        useOpenapiQuery: true,
      }),
    }),
    _0x6499a6 = buildSourceAudioNodePayload({
      id: _0x342fef,
      x: _0x2ea89b.background.x,
      y: _0x2ea89b.background.y,
      width: _0x2ea89b.width,
      height: _0x2ea89b.height,
      name: audioSeparationText('nodeNames.backgroundProcessing'),
      audioSplitRole: AUDIO_SPLIT_ROLE_BACKGROUND,
      audioSplitPeerId: _0x3e2ad5,
      rhSourceNodeId: _0x576036.id,
      rhToolbarTaskType: 'audio-separation',
      ...buildGenerationStartPatch({ startedAt: _0x20e24f }),
    });
  return (
    appStore.batch(() => {
      (appStore.addNode(_0x28b100), appStore.addNode(_0x6499a6));
    }),
    _focusCreatedNodes(_0x576036.id, [_0x3e2ad5, _0x342fef]),
    _persistLocalCache(),
    { leaderId: _0x3e2ad5, peerId: _0x342fef, startedAt: _0x20e24f }
  );
}
async function _applySuccessResult({
  leaderId: _0x240f65,
  peerId: _0x18b0fa,
  result: _0x1c7653,
  startedAt: _0x4c1516,
}) {
  const { vocalsUrl: _0x1dd094, backgroundUrl: _0x2c8205 } = _resolveSeparationResultUrls(_0x1c7653);
  if (!_0x1dd094 || !_0x2c8205) throw new Error(audioSeparationText('missingResultUrls'));
  const [_0x424a80, _0x4dc756] = await Promise.all([
      _persistAudioResult(_0x1dd094),
      _persistAudioResult(_0x2c8205),
    ]),
    _0x5e53ea = _getNode(_0x240f65),
    _0x2b75fb = String(_0x5e53ea?.rhTaskId || _0x1c7653?.taskId || '').trim();
  (appStore.batch(() => {
    (_updateNodeIfExists(_0x240f65, {
      name: audioSeparationText('nodeNames.vocals'),
      ...buildLocalAudioGenerationResultPatch(_0x424a80, { startedAt: _0x4c1516 }),
      ..._buildRunningHubTaskPatch({
        taskId: _0x2b75fb,
        status: 'success',
        startedAt: _0x4c1516,
        recovering: false,
        useOpenapiQuery: true,
      }),
    }),
      _updateNodeIfExists(_0x18b0fa, {
        name: audioSeparationText('nodeNames.background'),
        ...buildLocalAudioGenerationResultPatch(_0x4dc756, { startedAt: _0x4c1516 }),
      }));
  }),
    _persistLocalCache(),
    window.showToast?.(audioSeparationText('success'), 'success'));
}
function _buildEmptyAudioFields() {
  return buildCanvasLocalAudioFields({ localPath: '', audioUrl: '', fileName: '' });
}
function _applyFailureResult({
  leaderId: _0x2d4101,
  peerId: _0x59d51a,
  startedAt: _0x5ad1ec,
  message: _0x4968b6,
}) {
  const _0x37c0dc =
      String(_0x4968b6 || audioSeparationText('fallback')).trim() || audioSeparationText('fallback'),
    _0x2ce204 = _getNode(_0x2d4101),
    _0x5d03d5 = _buildEmptyAudioFields();
  (appStore.batch(() => {
    (_updateNodeIfExists(_0x2d4101, {
      name: audioSeparationText('nodeNames.vocalsFailed'),
      ...buildLocalAudioGenerationResultPatch({ error: _0x37c0dc }, { startedAt: _0x5ad1ec }),
      ..._0x5d03d5,
      rhStatusMessage: _0x37c0dc,
      rhStatusCode: null,
      ..._buildRunningHubTaskPatch({
        taskId: String(_0x2ce204?.rhTaskId || '').trim(),
        status: 'failed',
        startedAt: _0x5ad1ec,
        recovering: false,
        useOpenapiQuery: true,
      }),
    }),
      _updateNodeIfExists(_0x59d51a, {
        name: audioSeparationText('nodeNames.backgroundFailed'),
        ...buildLocalAudioGenerationResultPatch({ error: _0x37c0dc }, { startedAt: _0x5ad1ec }),
        ..._0x5d03d5,
      }));
  }),
    _persistLocalCache(),
    window.showToast?.(audioSeparationText('failedWithMessage', { message: _0x37c0dc }), 'error'));
}
async function _executeTask({
  leaderId: _0x7ec01d,
  peerId: _0x56021f,
  sourceAudioUrl: _0x5416db,
  rhInstanceType: rhInstanceType = 'default',
  startedAt: _0x1be3f0,
  resume: resume = false,
  runtime: _0x2adb55,
}) {
  const _0xcf352d = (_0x530399) => {
    const _0x537f14 = _runtimeByLeaderId.get(_0x7ec01d) || {};
    _runtimeByLeaderId.set(_0x7ec01d, { ..._0x537f14, taskId: String(_0x530399 || '').trim() });
  };
  try {
    let _0x4f156b = null;
    if (resume) {
      const _0x5cbcbf = _getNode(_0x7ec01d),
        _0x1f87a1 = String(_0x5cbcbf?.rhTaskId || _0x2adb55.taskId || '').trim();
      if (!_0x1f87a1) throw new Error(audioSeparationText('missingTaskId'));
      _0x4f156b = await _resumeAudioSeparationTaskImpl(
        _0x1f87a1,
        { rhInstanceType: rhInstanceType },
        { signal: _0x2adb55.abortController?.signal },
      );
    } else
      (window.showToast?.(audioSeparationText('submitting'), 'info'),
        (_0x4f156b = await _runAudioSeparationImpl(
          { nodeId: _0x7ec01d, audioUrl: _0x5416db, rhInstanceType: rhInstanceType },
          {
            signal: _0x2adb55.abortController?.signal,
            onTaskMeta: ({ taskId: _0x21ecdb, useOpenapiQuery: _0x67bb4 }) => {
              (_0xcf352d(_0x21ecdb),
                _updateNodeIfExists(_0x7ec01d, {
                  ..._buildRunningHubTaskPatch({
                    taskId: _0x21ecdb,
                    status: 'pending',
                    startedAt: _0x1be3f0,
                    recovering: false,
                    useOpenapiQuery: _0x67bb4 === true,
                  }),
                }),
                _persistLocalCache());
            },
            onTaskId: (_0x148106) => {
              (_0xcf352d(_0x148106),
                _updateNodeIfExists(_0x7ec01d, {
                  ..._buildRunningHubTaskPatch({
                    taskId: _0x148106,
                    status: 'pending',
                    startedAt: _0x1be3f0,
                    recovering: false,
                    useOpenapiQuery: true,
                  }),
                }),
                _persistLocalCache());
            },
          },
        )));
    await _applySuccessResult({
      leaderId: _0x7ec01d,
      peerId: _0x56021f,
      result: _0x4f156b,
      startedAt: _0x1be3f0,
    });
  } catch (_0x2b08df) {
    if (_0x2adb55.abortController?.signal?.aborted) return;
    const _0xff45a3 =
      _0x2b08df instanceof Error ? _0x2b08df.message : String(_0x2b08df || audioSeparationText('fallback'));
    _applyFailureResult({ leaderId: _0x7ec01d, peerId: _0x56021f, startedAt: _0x1be3f0, message: _0xff45a3 });
  } finally {
    const _0x4f9bc2 = _runtimeByLeaderId.get(_0x7ec01d);
    _0x4f9bc2?.promise === _0x2adb55.promise && _runtimeByLeaderId.delete(_0x7ec01d);
  }
}
export async function runAudioSeparationFromNode(_0x29fa33) {
  const _0x894ff8 = _getNode(_0x29fa33);
  if (!_0x894ff8 || !_isAudioNodeType(_0x894ff8.type))
    return (window.showToast?.(audioSeparationText('unsupportedNode'), 'warn'), null);
  if (_0x894ff8.isGenerating) return (window.showToast?.(audioSeparationText('busy'), 'info'), null);
  const _0x4fce9d = resolveCanvasAudioUrl(_0x894ff8);
  if (!_0x4fce9d) return (window.showToast?.(audioSeparationText('missingAudio'), 'warn'), null);
  const { leaderId: _0x545203, peerId: _0x368d97, startedAt: _0x387c5e } = _createPlaceholderPair(_0x894ff8),
    _0x37eb95 = { abortController: new AbortController(), promise: null, taskId: '' };
  _runtimeByLeaderId.set(_0x545203, _0x37eb95);
  const _0x3d0032 = _executeTask({
    leaderId: _0x545203,
    peerId: _0x368d97,
    sourceAudioUrl: _0x4fce9d,
    rhInstanceType: _0x894ff8?.rhInstanceType || 'default',
    startedAt: _0x387c5e,
    resume: false,
    runtime: _0x37eb95,
  });
  return (
    (_0x37eb95.promise = _0x3d0032),
    _runtimeByLeaderId.set(_0x545203, _0x37eb95),
    await _0x3d0032,
    { leaderId: _0x545203, peerId: _0x368d97 }
  );
}
export function getRunningAudioSeparationTaskForNode(_0x2a0bef) {
  const _0x93b66a = _resolveAudioSplitLeaderId(_0x2a0bef);
  if (!_0x93b66a) return null;
  const _0x5a0acf = _getNode(_0x93b66a);
  if (!_isAudioSplitLeader(_0x5a0acf)) return null;
  if (!_isRunningTaskStatus(_0x5a0acf?.rhTaskStatus)) return null;
  return {
    sourceNodeId: String(_0x5a0acf.rhSourceNodeId || ''),
    outId: _0x93b66a,
    peerId: String(_0x5a0acf.audioSplitPeerId || ''),
    taskId: String(_0x5a0acf.rhTaskId || _runtimeByLeaderId.get(_0x93b66a)?.taskId || ''),
    mode: 'audio-separation',
  };
}
export function hasRunningAudioSeparationTaskForNode(_0x2cccc6) {
  return !!getRunningAudioSeparationTaskForNode(_0x2cccc6);
}
async function _resolveRunningHubWorkflowApiKey() {
  try {
    return (await ensureConfig(), String(getProviderConfig('runninghubwf')?.apiKey || '').trim());
  } catch {
    return '';
  }
}
export async function cancelAudioSeparationTaskForNode(_0x321d4f, { notify: notify = false } = {}) {
  const _0x72875f = getRunningAudioSeparationTaskForNode(_0x321d4f);
  if (!_0x72875f?.outId) return false;
  const _0x3e9229 = _0x72875f.outId,
    _0x250b93 = _0x72875f.peerId,
    _0x4e101e = _runtimeByLeaderId.get(_0x3e9229);
  try {
    _0x4e101e?.abortController?.abort?.();
  } catch {}
  _runtimeByLeaderId.delete(_0x3e9229);
  const _0x7dc931 = _getNode(_0x3e9229),
    _0x5749b4 = Number(_0x7dc931?.generationStartTime || _0x7dc931?.rhTaskStartedAt || 0) || Date.now(),
    _0x258dca = Date.now() - _0x5749b4,
    _0x4ab690 = _buildEmptyAudioFields();
  (appStore.batch(() => {
    (_updateNodeIfExists(_0x3e9229, {
      name: audioSeparationText('nodeNames.vocalsCancelled'),
      ..._0x4ab690,
      isGenerating: false,
      jobStatus: null,
      jobError: null,
      generationDuration: _0x258dca,
      rhTaskStatus: 'cancelled',
      rhTaskRecovering: false,
      rhStatusMessage: null,
    }),
      _updateNodeIfExists(_0x250b93, {
        name: audioSeparationText('nodeNames.backgroundCancelled'),
        ..._0x4ab690,
        isGenerating: false,
        jobStatus: null,
        jobError: null,
        generationDuration: _0x258dca,
      }));
  }),
    _persistLocalCache());
  const _0x5f3455 = await _resolveRunningHubWorkflowApiKey();
  if (_0x5f3455 && _0x72875f.taskId)
    try {
      await cancelRunningHubTask({ apiKey: _0x5f3455, taskId: _0x72875f.taskId });
    } catch (_0x1ba8bf) {
      console.warn('[AudioSeparationController] cancel request failed:', _0x1ba8bf);
    }
  if (notify) window.showToast?.(audioSeparationText('cancelled'), 'info');
  return true;
}
export function maybeResumeAudioSeparationLeader(_0x57af96) {
  const _0x54c624 = _getNode(_0x57af96);
  if (!_isAudioSplitLeader(_0x54c624)) return null;
  if (!_isRunningTaskStatus(_0x54c624?.rhTaskStatus)) return null;
  const _0x3954c8 = String(_0x54c624?.rhTaskId || '').trim();
  if (!_0x3954c8) return null;
  const _0x3a07d8 = _runtimeByLeaderId.get(_0x57af96);
  if (_0x3a07d8?.promise && _0x3a07d8.taskId === _0x3954c8) return _0x3a07d8.promise;
  const _0x57b991 = Number(_0x54c624?.rhTaskStartedAt || _0x54c624?.generationStartTime || 0) || Date.now();
  (appStore.batch(() => {
    (_updateNodeIfExists(_0x57af96, {
      ...buildGenerationStartPatch({ startedAt: _0x57b991 }),
      ..._buildRunningHubTaskPatch({
        taskId: _0x3954c8,
        status:
          String(_0x54c624?.rhTaskStatus || '')
            .trim()
            .toLowerCase() === 'pending'
            ? 'pending'
            : 'running',
        startedAt: _0x57b991,
        recovering: true,
        useOpenapiQuery: _0x54c624?.rhTaskUseOpenapiQuery === true,
      }),
    }),
      _updateNodeIfExists(_0x54c624?.audioSplitPeerId, {
        ...buildGenerationStartPatch({ startedAt: _0x57b991 }),
        jobError: null,
      }));
  }),
    _persistLocalCache());
  const _0x32a563 = { abortController: new AbortController(), promise: null, taskId: _0x3954c8 };
  _runtimeByLeaderId.set(_0x57af96, _0x32a563);
  const _0x10a00a = _executeTask({
    leaderId: _0x57af96,
    peerId: _0x54c624.audioSplitPeerId,
    sourceAudioUrl: '',
    rhInstanceType: _0x54c624?.rhInstanceType || 'default',
    startedAt: _0x57b991,
    resume: true,
    runtime: _0x32a563,
  });
  return ((_0x32a563.promise = _0x10a00a), _runtimeByLeaderId.set(_0x57af96, _0x32a563), _0x10a00a);
}
export function __setAudioSeparationDepsForTest({
  runAudioSeparationImpl: _0x379f86,
  resumeAudioSeparationTaskImpl: _0x3b76b2,
  saveRemoteAudioLocallyDetailedImpl: _0x4133ec,
} = {}) {
  ((_runAudioSeparationImpl = typeof _0x379f86 === 'function' ? _0x379f86 : runAudioSeparation),
    (_resumeAudioSeparationTaskImpl =
      typeof _0x3b76b2 === 'function' ? _0x3b76b2 : resumeAudioSeparationTask),
    (_saveRemoteAudioLocallyDetailedImpl =
      typeof _0x4133ec === 'function' ? _0x4133ec : saveRemoteAudioLocallyDetailed));
}
export function __resetAudioSeparationDepsForTest() {
  ((_runAudioSeparationImpl = runAudioSeparation),
    (_resumeAudioSeparationTaskImpl = resumeAudioSeparationTask),
    (_saveRemoteAudioLocallyDetailedImpl = saveRemoteAudioLocallyDetailed),
    _runtimeByLeaderId.forEach((_0x54f357) => {
      try {
        _0x54f357?.abortController?.abort?.();
      } catch {}
    }),
    _runtimeByLeaderId.clear());
}
