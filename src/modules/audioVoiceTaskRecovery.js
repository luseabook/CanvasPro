import { resumeRunningHubAudioTask } from '../../api/aiAudioApi.js';
import { createGenerationResumePlanFromNode } from '../core/generationExecutionPlan.js';
import { isTaskRunning } from '../core/generationTaskUiState.js';
import { cancelTask, resumeTask } from '../core/generationTaskRuntime.js';
function normalizeText(_0x1adc95) {
  return String(_0x1adc95 || '')['trim']();
}
export function patchAudioVoicePersistedAnalysisSegment(_0xb56e8e = {}, _0x4d85cd = '', _0x4da328 = {}) {
  const _0x4bf65c = normalizeText(_0x4d85cd);
  if (!_0x4bf65c || !_0x4da328 || typeof _0x4da328 !== 'object' || !Array['isArray'](_0xb56e8e?.['segments']))
    return null;
  const _0x1cccf2 = _0xb56e8e['segments']['findIndex'](
    (_0xa32535) => normalizeText(_0xa32535?.['id']) === _0x4bf65c,
  );
  if (_0x1cccf2 < 0x0) return null;
  return {
    ..._0xb56e8e,
    segments: _0xb56e8e['segments']['map']((_0x3dd63f, _0x2a3262) =>
      _0x2a3262 === _0x1cccf2 ? { ..._0x3dd63f, ..._0x4da328 } : _0x3dd63f,
    ),
  };
}
function buildRecoveryNode(_0x16e5ce = {}, _0x39b5ad = {}) {
  const _0x3653e2 = normalizeText(_0x16e5ce['status'])['toLowerCase'](),
    _0x5523fe = normalizeText(_0x16e5ce['rhTaskId']);
  return {
    ..._0x16e5ce,
    provider: normalizeText(_0x39b5ad['provider']) || 'runninghubwf',
    adapterType: normalizeText(_0x39b5ad['adapterType']) || 'workflow',
    isGenerating: _0x16e5ce['isGenerating'] === !![] || _0x3653e2 === 'generating',
    jobStatus: normalizeText(_0x16e5ce['jobStatus']) || (_0x3653e2 === 'generating' ? 'running' : ''),
    rhTaskStatus:
      normalizeText(_0x16e5ce['rhTaskStatus']) ||
      (_0x3653e2 === 'generating' ? (_0x5523fe ? 'running' : 'pending') : ''),
  };
}
export function isAudioVoiceTaskRecoveryCandidate(_0x47a8e9 = {}, _0x31f59a = {}) {
  return (
    _0x47a8e9['isGenerating'] === !![] ||
    normalizeText(_0x47a8e9['status'])['toLowerCase']() === 'generating' ||
    isTaskRunning(buildRecoveryNode(_0x47a8e9, _0x31f59a))
  );
}
export function resolveAudioVoiceTaskModelId(_0x2800ed = {}, _0x996173 = {}) {
  return (
    normalizeText(_0x2800ed?.['taskModelId']) ||
    normalizeText(_0x2800ed?.['voiceModelId']) ||
    normalizeText(_0x996173?.['id']) ||
    'restored-audio-task'
  );
}
export function createAudioVoiceTaskRecoveryManager({
  cancelTaskFn: cancelTaskFn = cancelTask,
  resumeTaskFn: resumeTaskFn = resumeTask,
  resumeAudioTaskFn: resumeAudioTaskFn = resumeRunningHubAudioTask,
} = {}) {
  const _0x2165a7 = new Map();
  async function _0x2165de({
    sourceNodeId: _0x277e86,
    segment: _0x952a3c,
    modelOption: _0x15ed4b,
    createTaskStore: _0x4515ec,
    buildResultPatch: _0x5253d0,
    getErrorMessage: _0x1b9c14,
    cancelledMessage: _0x5d3561,
  }) {
    const _0x4fa835 = normalizeText(_0x952a3c?.['id']),
      _0x315283 = normalizeText(_0x952a3c?.['rhTaskId']),
      _0x23d41b = 'audio-voice:' + (_0x277e86 || 'source') + ':' + _0x4fa835,
      _0x429f5f = _0x4515ec(_0x4fa835, _0x23d41b, _0x277e86),
      _0x42366a = normalizeText(_0x15ed4b?.['provider']) || 'runninghubwf',
      _0x40d015 = normalizeText(_0x15ed4b?.['adapterType']) || 'workflow',
      _0x5a73c6 = resolveAudioVoiceTaskModelId(_0x952a3c, _0x15ed4b),
      _0x1c80a5 =
        Number(_0x952a3c?.['generationStartTime'] || _0x952a3c?.['rhTaskStartedAt'] || 0x0) || Date['now'](),
      _0x540d7d = () => ({ status: 'edited', error: '', rhStatusMessage: _0x5d3561 });
    if (!_0x315283)
      return cancelTaskFn(_0x23d41b, {
        store: _0x429f5f,
        spec: {
          sourceNodeId: _0x277e86,
          provider: _0x42366a,
          adapterType: _0x40d015,
          cancelledBuilder: _0x540d7d,
        },
        cancellable: !![],
        abortLocal: !![],
        cancelledBuilder: _0x540d7d,
      });
    const _0x3db0f0 = { provider: _0x42366a, adapterType: _0x40d015, audioWorkflowKey: _0x5a73c6 },
      _0x4325eb = new AbortController(),
      _0x4c0b43 = createGenerationResumePlanFromNode({
        kind: 'audio',
        node: buildRecoveryNode(_0x952a3c, _0x15ed4b),
        payload: _0x3db0f0,
        sourceNodeId: _0x277e86,
        targetNodeId: _0x23d41b,
        trigger: 'audio-voice-panel-recovery',
        taskType: 'audio-generation',
        taskProtocol: 'workflow',
        provider: _0x42366a,
        adapterType: _0x40d015,
        modelId: _0x5a73c6,
        executionId: normalizeText(_0x15ed4b?.['executionId']),
        taskId: _0x315283,
        startedAt: _0x1c80a5,
        cancellable: _0x15ed4b?.['cancellable'] === !![],
        resumable: !![],
        pauseOnAbort: ![],
        completionFeedback: ![],
        startBuilder: () => ({ status: 'generating', error: '' }),
        poll: ({ taskId: _0x2509b3, signal: _0x4752be }) =>
          resumeAudioTaskFn(_0x2509b3, _0x3db0f0, {
            signal: _0x4752be,
            useOpenapiQuery: !![],
            pollImmediately: !![],
          }),
        resultBuilder: (_0x2045c9, _0x1a185e) =>
          _0x5253d0(_0x2045c9, _0x1a185e, {
            segmentId: _0x4fa835,
            modelOption: _0x15ed4b,
            modelId: _0x5a73c6,
            startedAt: _0x1c80a5,
          }),
        failureBuilder: (_0x19daf9) => {
          const _0x5206db = _0x1b9c14(_0x19daf9);
          return { status: 'edited', error: _0x5206db, rhStatusMessage: _0x5206db };
        },
        cancelledBuilder: _0x540d7d,
        parseError: _0x1b9c14,
      });
    return resumeTaskFn(_0x4c0b43, { store: _0x429f5f, startedAt: _0x1c80a5, abortController: _0x4325eb });
  }
  function _0x4168a2({
    sourceNodeId: sourceNodeId = '',
    segments: segments = [],
    resolveModelOption: _0xb5feac,
    createTaskStore: _0x100af2,
    buildResultPatch: _0x589a25,
    getErrorMessage: getErrorMessage = (_0x1d5230) => normalizeText(_0x1d5230?.['message'] || _0x1d5230),
    cancelledMessage: cancelledMessage = '',
  } = {}) {
    if (
      !normalizeText(sourceNodeId) ||
      typeof _0xb5feac !== 'function' ||
      typeof _0x100af2 !== 'function' ||
      typeof _0x589a25 !== 'function'
    )
      return Promise['resolve']([]);
    const _0x466208 = (Array['isArray'](segments) ? segments : [])
      ['filter']((_0x4f243b) => {
        const _0x347127 = _0xb5feac(_0x4f243b) || {};
        return isAudioVoiceTaskRecoveryCandidate(_0x4f243b, _0x347127);
      })
      ['map']((_0x3e0514) => {
        const _0x2fae0f = _0xb5feac(_0x3e0514) || {},
          _0x357548 = [
            sourceNodeId,
            normalizeText(_0x3e0514['id']),
            normalizeText(_0x3e0514['rhTaskId']) || 'orphaned',
          ]['join'](':'),
          _0x24f8e0 = _0x2165a7['get'](_0x357548);
        if (_0x24f8e0) return _0x24f8e0;
        const _0x82206 = _0x2165de({
          sourceNodeId: sourceNodeId,
          segment: _0x3e0514,
          modelOption: _0x2fae0f,
          createTaskStore: _0x100af2,
          buildResultPatch: _0x589a25,
          getErrorMessage: getErrorMessage,
          cancelledMessage: cancelledMessage,
        })['finally'](() => {
          _0x2165a7['get'](_0x357548) === _0x82206 && _0x2165a7['delete'](_0x357548);
        });
        return (_0x2165a7['set'](_0x357548, _0x82206), _0x82206);
      });
    return Promise['allSettled'](_0x466208);
  }
  return { recover: _0x4168a2, getActiveCount: () => _0x2165a7['size'] };
}
