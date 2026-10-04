import { resumeRunningHubAudioTask } from '../../api/aiAudioApi.js';
import { createGenerationResumePlanFromNode } from '../core/generationExecutionPlan.js';
import { isTaskRunning } from '../core/generationTaskUiState.js';
import { cancelTask, resumeTask } from '../core/generationTaskRuntime.js';
function normalizeText(value) {
  return String(value || '')['trim']();
}
export function patchAudioVoicePersistedAnalysisSegment(segments2 = {}, item = '', args = {}) {
  const text = normalizeText(item);
  if (!text || !args || typeof args !== 'object' || !Array['isArray'](segments2?.['segments'])) return null;
  const count = segments2['segments']['findIndex']((key) => normalizeText(key?.['id']) === text);
  if (count < 0x0) return null;
  return {
    ...segments2,
    segments: segments2['segments']['map']((args2, index) =>
      index === count ? { ...args2, ...args } : args2,
    ),
  };
}
function buildRecoveryNode(isGenerating = {}, result = {}) {
  const text2 = normalizeText(isGenerating['status'])['toLowerCase'](),
    text3 = normalizeText(isGenerating['rhTaskId']);
  return {
    ...isGenerating,
    provider: normalizeText(result['provider']) || 'runninghubwf',
    adapterType: normalizeText(result['adapterType']) || 'workflow',
    isGenerating: isGenerating['isGenerating'] === !![] || text2 === 'generating',
    jobStatus: normalizeText(isGenerating['jobStatus']) || (text2 === 'generating' ? 'running' : ''),
    rhTaskStatus:
      normalizeText(isGenerating['rhTaskStatus']) ||
      (text2 === 'generating' ? (text3 ? 'running' : 'pending') : ''),
  };
}
export function isAudioVoiceTaskRecoveryCandidate(response = {}, data = {}) {
  return (
    response['isGenerating'] === !![] ||
    normalizeText(response['status'])['toLowerCase']() === 'generating' ||
    isTaskRunning(buildRecoveryNode(response, data))
  );
}
export function resolveAudioVoiceTaskModelId(options = {}, target = {}) {
  return (
    normalizeText(options?.['taskModelId']) ||
    normalizeText(options?.['voiceModelId']) ||
    normalizeText(target?.['id']) ||
    'restored-audio-task'
  );
}
export function createAudioVoiceTaskRecoveryManager({
  cancelTaskFn: cancelTaskFn = cancelTask,
  resumeTaskFn: resumeTaskFn = resumeTask,
  resumeAudioTaskFn: resumeAudioTaskFn = resumeRunningHubAudioTask,
} = {}) {
  const map = new Map();
  async function run({
    sourceNodeId: sourceNodeId2,
    segment: segment,
    modelOption: modelOption,
    createTaskStore: createTaskStore,
    buildResultPatch: buildResultPatch,
    getErrorMessage: getErrorMessage2,
    cancelledMessage: cancelledMessage2,
  }) {
    const segmentId = normalizeText(segment?.['id']),
      taskId = normalizeText(segment?.['rhTaskId']),
      targetNodeId = 'audio-voice:' + (sourceNodeId2 || 'source') + ':' + segmentId,
      store = createTaskStore(segmentId, targetNodeId, sourceNodeId2),
      provider = normalizeText(modelOption?.['provider']) || 'runninghubwf',
      adapterType = normalizeText(modelOption?.['adapterType']) || 'workflow',
      audioWorkflowKey = resolveAudioVoiceTaskModelId(segment, modelOption),
      startedAt =
        Number(segment?.['generationStartTime'] || segment?.['rhTaskStartedAt'] || 0x0) || Date['now'](),
      cancelledBuilder = () => ({ status: 'edited', error: '', rhStatusMessage: cancelledMessage2 });
    if (!taskId)
      return cancelTaskFn(targetNodeId, {
        store: store,
        spec: {
          sourceNodeId: sourceNodeId2,
          provider: provider,
          adapterType: adapterType,
          cancelledBuilder: cancelledBuilder,
        },
        cancellable: !![],
        abortLocal: !![],
        cancelledBuilder: cancelledBuilder,
      });
    const payload = { provider: provider, adapterType: adapterType, audioWorkflowKey: audioWorkflowKey },
      abortController = new AbortController(),
      generationResumePlanFromNode = createGenerationResumePlanFromNode({
        kind: 'audio',
        node: buildRecoveryNode(segment, modelOption),
        payload: payload,
        sourceNodeId: sourceNodeId2,
        targetNodeId: targetNodeId,
        trigger: 'audio-voice-panel-recovery',
        taskType: 'audio-generation',
        taskProtocol: 'workflow',
        provider: provider,
        adapterType: adapterType,
        modelId: audioWorkflowKey,
        executionId: normalizeText(modelOption?.['executionId']),
        taskId: taskId,
        startedAt: startedAt,
        cancellable: modelOption?.['cancellable'] === !![],
        resumable: !![],
        pauseOnAbort: ![],
        completionFeedback: ![],
        startBuilder: () => ({ status: 'generating', error: '' }),
        poll: ({ taskId: taskId2, signal: signal }) =>
          resumeAudioTaskFn(taskId2, payload, {
            signal: signal,
            useOpenapiQuery: !![],
            pollImmediately: !![],
          }),
        resultBuilder: (source, next) =>
          buildResultPatch(source, next, {
            segmentId: segmentId,
            modelOption: modelOption,
            modelId: audioWorkflowKey,
            startedAt: startedAt,
          }),
        failureBuilder: (current) => {
          const error = getErrorMessage2(current);
          return { status: 'edited', error: error, rhStatusMessage: error };
        },
        cancelledBuilder: cancelledBuilder,
        parseError: getErrorMessage2,
      });
    return resumeTaskFn(generationResumePlanFromNode, {
      store: store,
      startedAt: startedAt,
      abortController: abortController,
    });
  }
  function recover({
    sourceNodeId: sourceNodeId = '',
    segments: segments = [],
    resolveModelOption: resolveModelOption,
    createTaskStore: createTaskStore2,
    buildResultPatch: buildResultPatch2,
    getErrorMessage: getErrorMessage = (error2) => normalizeText(error2?.['message'] || error2),
    cancelledMessage: cancelledMessage = '',
  } = {}) {
    if (
      !normalizeText(sourceNodeId) ||
      typeof resolveModelOption !== 'function' ||
      typeof createTaskStore2 !== 'function' ||
      typeof buildResultPatch2 !== 'function'
    )
      return Promise['resolve']([]);
    const entry = (Array['isArray'](segments) ? segments : [])
      ['filter']((record) => {
        const handle = resolveModelOption(record) || {};
        return isAudioVoiceTaskRecoveryCandidate(record, handle);
      })
      ['map']((segment2) => {
        const modelOption2 = resolveModelOption(segment2) || {},
          state = [
            sourceNodeId,
            normalizeText(segment2['id']),
            normalizeText(segment2['rhTaskId']) || 'orphaned',
          ]['join'](':'),
          config = map['get'](state);
        if (config) return config;
        const scope = run({
          sourceNodeId: sourceNodeId,
          segment: segment2,
          modelOption: modelOption2,
          createTaskStore: createTaskStore2,
          buildResultPatch: buildResultPatch2,
          getErrorMessage: getErrorMessage,
          cancelledMessage: cancelledMessage,
        })['finally'](() => {
          map['get'](state) === scope && map['delete'](state);
        });
        return (map['set'](state, scope), scope);
      });
    return Promise['allSettled'](entry);
  }
  return { recover: recover, getActiveCount: () => map['size'] };
}
