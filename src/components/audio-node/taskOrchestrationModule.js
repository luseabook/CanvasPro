import { cancelTask, resumeTask, submitTask } from '../../core/generationTaskRuntime.js';
import {
  createGenerationCancelPlanFromNode,
  createGenerationResumePlanFromNode,
  createGenerationSubmitPlan,
} from '../../core/generationExecutionPlan.js';
import { buildRunningHubTaskPatch } from '../../core/generationTaskProtocolState.js';
import { shouldShowGenerationBusyUi } from '../../core/generationTaskUiState.js';
import { getModelManifest } from '../../manifests/index.js';
const DEFAULT_RUNTIME = Object['freeze']({
  cancelTask: cancelTask,
  resumeTask: resumeTask,
  submitTask: submitTask,
});
function normalizeProvider(value, item = 'runninghubwf') {
  return String(value || item)
    ['trim']()
    ['toLowerCase']();
}
function isRunningHubProvider(key) {
  return key === 'runninghubwf' || key === 'runninghub';
}
function supportsAudioTaskCancellation(options = {}) {
  const modelManifest = getModelManifest(options['audioWorkflowKey'] || options['model'] || '');
  return modelManifest
    ? modelManifest['cancellable'] === !![]
    : normalizeProvider(options['provider']) === 'runninghubwf';
}
function getResultPatch(index) {
  if (index?.['patch'] && typeof index['patch'] === 'object') return index['patch'];
  return index && typeof index === 'object' ? index : {};
}
function isAbortLike(error, result) {
  return (
    result?.['aborted'] === !![] || error?.['name'] === 'AbortError' || error?.['message'] === 'CANCELLED'
  );
}
function throwIfAborted(data) {
  if (data?.['aborted'] !== !![]) return;
  const error2 = new Error('CANCELLED');
  error2['name'] = 'AbortError';
  throw error2;
}
export function createAudioNodeTaskOrchestration(options2 = {}) {
  const {
    nodeId: nodeId,
    store: store,
    runtime: runtime = DEFAULT_RUNTIME,
    api: api = {},
    ensureConfig: ensureConfig = async () => {},
    getProviderConfig: getProviderConfig = () => ({}),
    buildResultPatch: buildResultPatch = async () => ({}),
    afterResultCommit: afterResultCommit = () => {},
    persistTaskState: persistTaskState = () => {},
    setBusyState: setBusyState = () => {},
    setLoading: setLoading = () => {},
    onSuccess: onSuccess = () => {},
    onFailure: onFailure = () => {},
    now: now = () => Date['now'](),
    createAbortController: createAbortController = () => new AbortController(),
    messages: messages = {},
  } = options2;
  if (!String(nodeId || '')['trim']())
    throw new Error('[audioTaskOrchestration] nodeId is required');
  if (!store || typeof store['getState'] !== 'function')
    throw new Error('[audioTaskOrchestration] store is required');
  let enabled = ![],
    enabled2 = null,
    enabled3 = null,
    enabled4 = null,
    value2 = null,
    target = '',
    source = '',
    next = '',
    taskProviderProfileId = '',
    enabled5 = ![],
    cancelInFlight = ![],
    enabled6 = ![];
  const run = () => store['getState']()?.['nodes']?.[nodeId] || {},
    handler = (current, entry) => {
      if (typeof current?.['updateTaskNode'] === 'function') return current['updateTaskNode'](entry);
      return (store['updateNodeData'](nodeId, entry), !![]);
    },
    rhStatusMessage = (record, payload) => {
      const run2 = messages[record];
      if (typeof run2 === 'function') return run2() || payload;
      return run2 || payload;
    },
    persistTaskState2 = (options3 = {}) => {
      try {
        const promise = persistTaskState(options3);
        promise?.['catch']?.(() => {});
      } catch {}
    },
    handler2 = () => {
      const handle = run(),
        isGenerating = shouldShowGenerationBusyUi(handle);
      return (
        setBusyState({
          isGenerating: isGenerating,
          cancelInFlight: cancelInFlight,
          taskId: String(source || handle['rhTaskId'] || handle['taskId'] || ''),
        }),
        setLoading(isGenerating),
        isGenerating
      );
    },
    resetRecovery = ({ resetRecovering: resetRecovering = ![] } = {}) => {
      (value2 && value2['signal']['aborted'] !== !![] && value2['abort'](),
        (value2 = null),
        (target = ''),
        (enabled4 = null),
        resetRecovering &&
          run()['rhTaskRecovering'] === !![] &&
          (store['updateNodeData'](nodeId, { rhTaskRecovering: ![] }),
          persistTaskState2({ patch: { rhTaskRecovering: ![] } })));
    },
    resultBuilder = async (state, config) => ({
      ...getResultPatch(await buildResultPatch(state, config['startedAt'], config)),
      rhStatusMessage: null,
      rhStatusCode: null,
    }),
    failureBuilder = (rhStatusMessage2) => ({
      rhStatusMessage:
        rhStatusMessage2?.['message'] || rhStatusMessage('generationFailed', 'Audio generation failed'),
      rhStatusCode: Number['isFinite'](Number(rhStatusMessage2?.['code']))
        ? Number(rhStatusMessage2['code'])
        : null,
    }),
    cancelledBuilder = () => ({
      audioUrl: '',
      src: '',
      localPath: '',
      rhStatusMessage: rhStatusMessage('interrupted', 'Audio generation interrupted'),
    }),
    handler3 = (provider) => {
      const provider2 = normalizeProvider(provider['provider']),
        scope = {
          provider: provider['provider'],
          audioWorkflowKey: provider['audioWorkflowKey'],
          audioWorkflowLabel: provider['audioWorkflowLabel'],
          model: provider['audioWorkflowKey'],
        };
      return (
        isRunningHubProvider(provider2) && (scope['rhTaskUseOpenapiQuery'] = !![]),
        provider2 === 'runninghubwf' && (scope['rhInstanceType'] = provider['rhInstanceType']),
        isRunningHubProvider(provider2) &&
          provider['providerProfileId'] &&
          ((scope['providerProfileId'] = provider['providerProfileId']),
          (scope['rhProviderProfileId'] = provider['providerProfileId'])),
        scope
      );
    };
  async function runGeneration({ payload: payload2, startedAt: startedAt = now() } = {}) {
    if (enabled) return { ok: ![], status: 'disposed' };
    if (enabled2) return enabled2;
    if (!payload2 || typeof payload2 !== 'object')
      throw new Error('[audioTaskOrchestration] payload is required');
    resetRecovery({ resetRecovering: !![] });
    const provider3 = normalizeProvider(payload2['provider']),
      signal = createAbortController();
    ((enabled3 = signal),
      (enabled5 = ![]),
      (cancelInFlight = ![]),
      (enabled6 = ![]),
      (source = ''),
      (next = String(payload2['apiKey'] || '')['trim']()),
      (taskProviderProfileId = String(payload2['providerProfileId'] || payload2['rhProviderProfileId'] || '')[
        'trim'
      ]()),
      setBusyState({ isGenerating: !![], cancelInFlight: ![], taskId: '' }),
      setLoading(!![]));
    const generationSubmitPlan = createGenerationSubmitPlan({
        kind: 'audio',
        sourceNodeId: nodeId,
        targetNodeId: nodeId,
        trigger: 'node',
        taskType: 'audio-generation',
        provider: provider3,
        adapterType: payload2['adapterType'] || 'workflow',
        modelId: payload2['audioWorkflowKey'] || run()['model'] || '',
        executionId: payload2['executionId'],
        payload: payload2,
        cancellable: supportsAudioTaskCancellation(payload2),
        resumable: isRunningHubProvider(provider3),
        pauseOnAbort: isRunningHubProvider(provider3) ? 'afterTaskId' : ![],
        startBuilder: () => handler3(payload2),
        persistTaskState: persistTaskState2,
        submit: async (input, runningHubWorkflowQueueLease) =>
          api['generateAudio'](payload2, {
            signal: signal['signal'],
            runningHubWorkflowQueueLease: runningHubWorkflowQueueLease['runningHubWorkflowQueueLease'],
            onTaskMeta: (rhTaskUseOpenapiQuery = {}) => {
              const taskId = String(rhTaskUseOpenapiQuery['taskId'] || '')['trim']();
              if (!taskId) return;
              ((taskProviderProfileId = String(
                rhTaskUseOpenapiQuery['providerProfileId'] ||
                  rhTaskUseOpenapiQuery['rhProviderProfileId'] ||
                  taskProviderProfileId,
              )['trim']()),
                (source = taskId),
                (next =
                  String(rhTaskUseOpenapiQuery['apiKey'] || '')['trim']() ||
                  String(payload2['apiKey'] || '')['trim']() ||
                  next),
                runningHubWorkflowQueueLease['onTaskId'](taskId),
                handler(runningHubWorkflowQueueLease, {
                  rhTaskUseOpenapiQuery: rhTaskUseOpenapiQuery['useOpenapiQuery'] === !![],
                  ...(taskProviderProfileId
                    ? {
                        taskProviderProfileId: taskProviderProfileId,
                        providerProfileId: taskProviderProfileId,
                        rhProviderProfileId: taskProviderProfileId,
                      }
                    : {}),
                }),
                persistTaskState2({ taskId: taskId }),
                enabled5 && !cancelInFlight && !enabled6 && void cancelGeneration());
            },
            onTaskId: (output) => {
              const taskId2 = String(output || '')['trim']();
              if (!taskId2) return;
              ((source = taskId2),
                runningHubWorkflowQueueLease['onTaskId'](taskId2),
                handler(runningHubWorkflowQueueLease, { rhTaskUseOpenapiQuery: !![] }),
                persistTaskState2({ taskId: taskId2 }),
                enabled5 && !cancelInFlight && !enabled6 && void cancelGeneration());
            },
          }),
        cancel: async ({ taskId: taskId3 }) => {
          const apiKey = String(next || payload2['apiKey'] || '')['trim']();
          if (!apiKey || !taskId3) return;
          ((enabled6 = !![]),
            await api['cancelRunningHubAudioTask']?.({
              apiKey: apiKey,
              taskId: taskId3,
              ...(taskProviderProfileId ||
              payload2?.['providerProfileId'] ||
              payload2?.['rhProviderProfileId']
                ? {
                    providerProfileId:
                      taskProviderProfileId ||
                      payload2?.['providerProfileId'] ||
                      payload2?.['rhProviderProfileId'],
                  }
                : {}),
            }));
        },
        resultBuilder: resultBuilder,
        failureBuilder: failureBuilder,
        cancelledBuilder: cancelledBuilder,
        parseError: (error3) =>
          error3?.['message'] || rhStatusMessage('generationFailed', 'Audio generation failed'),
      }),
      value3 = runtime['submitTask'](generationSubmitPlan, {
        store: store,
        startedAt: startedAt,
        abortController: signal,
      })
        ['then'](async (result2) => {
          if (result2?.['status'] === 'success' && !enabled && signal['signal']['aborted'] !== !![]) {
            const resultPatch = getResultPatch(result2['patch'] || run());
            (await afterResultCommit(resultPatch, startedAt, result2),
              await onSuccess(result2, { recovering: ![], payload: payload2 }));
          } else
            result2?.['status'] === 'failed' &&
              !enabled &&
              (await onFailure(result2['error'], { payload: payload2, result: result2 }));
          return result2;
        })
        ['finally'](() => {
          enabled2 = null;
          if (enabled3 === signal) enabled3 = null;
          const enabled7 = enabled ? ![] : handler2();
          (!enabled7 && ((source = ''), !enabled5 && ((next = ''), (taskProviderProfileId = ''))),
            (enabled5 = ![]),
            (cancelInFlight = ![]),
            (enabled6 = ![]));
        });
    return ((enabled2 = value3), value3);
  }
  async function cancelGeneration() {
    if (!supportsAudioTaskCancellation(run())) return { ok: ![], reason: 'not-cancellable' };
    enabled5 = !![];
    if (cancelInFlight) return { ok: !![], status: 'cancelling' };
    cancelInFlight = !![];
    const node = run(),
      taskId4 = String(source || node['rhTaskId'] || '')['trim']();
    source = taskId4;
    let apiKey2 = String(next || '')['trim']();
    const providerProfileId = String(
      taskProviderProfileId ||
        node['taskProviderProfileId'] ||
        node['providerProfileId'] ||
        node['rhProviderProfileId'] ||
        '',
    )['trim']();
    if (!apiKey2)
      try {
        (await ensureConfig(),
          (apiKey2 = String(getProviderConfig(providerProfileId || 'runninghubwf')?.['apiKey'] || '')[
            'trim'
          ]()));
      } catch {}
    next = apiKey2;
    const startedAt2 = Number(node['generationStartTime'] || node['rhTaskStartedAt'] || 0),
      generationDuration =
        node['generationDuration'] != null
          ? node['generationDuration']
          : startedAt2 > 0
            ? Math['max'](0, now() - startedAt2)
            : 0,
      args = createGenerationCancelPlanFromNode({
        kind: 'audio',
        node: node,
        payload: node,
        sourceNodeId: nodeId,
        targetNodeId: nodeId,
        trigger: 'node',
        taskType: 'audio-generation',
        taskProtocol: 'workflow',
        provider: normalizeProvider(node['provider']),
        adapterType: node['adapterType'] || 'workflow',
        modelId: node['audioWorkflowKey'] || node['model'] || '',
        executionId: node['executionId'],
        taskId: taskId4,
        startedAt: startedAt2,
        cancellable: supportsAudioTaskCancellation(node),
        resumable: !![],
        persistTaskState: persistTaskState2,
      }),
      cancelledBuilder2 = ({
        remoteResult: remoteResult,
        remoteError: remoteError,
        startedAt: startedAt3,
      } = {}) => {
        const count = Number(remoteResult?.['code']),
          rhStatusMessage3 = !taskId4
            ? rhStatusMessage(
                'interruptedMissingTaskId',
                'Audio generation interrupted before task id was available',
              )
            : remoteError
              ? remoteError['message'] || rhStatusMessage('cancelFailed', 'Cancel failed')
              : count === 0
                ? rhStatusMessage('cancelSuccess', 'Cancelled')
                : count === 807
                  ? rhStatusMessage('cancelTaskMissing', 'Task no longer exists')
                  : remoteResult?.['msg'] || rhStatusMessage('cancelFailed', 'Cancel failed');
        return {
          audioUrl: '',
          src: '',
          localPath: '',
          generationDuration: generationDuration,
          rhStatusMessage: rhStatusMessage3,
          rhStatusCode: !taskId4 ? 813 : Number['isFinite'](count) ? count : null,
          ...buildRunningHubTaskPatch({
            taskId: taskId4,
            status: 'cancelled',
            startedAt: Number(startedAt3 || startedAt2 || 0),
            recovering: ![],
            useOpenapiQuery: node['rhTaskUseOpenapiQuery'] === !![],
          }),
        };
      };
    setBusyState({ isGenerating: !![], cancelInFlight: !![], taskId: taskId4 });
    try {
      return (
        (enabled6 = !![]),
        await runtime['cancelTask'](nodeId, {
          store: store,
          taskId: taskId4,
          cancellable: !![],
          cancel: async ({ taskId: taskId5 }) => {
            if (!apiKey2) throw new Error(rhStatusMessage('missingApiKey', 'RunningHub API key is required'));
            return api['cancelRunningHubAudioTask']?.({
              apiKey: apiKey2,
              taskId: taskId5,
              ...(providerProfileId || node?.['providerProfileId'] || node?.['rhProviderProfileId']
                ? {
                    providerProfileId:
                      providerProfileId || node?.['providerProfileId'] || node?.['rhProviderProfileId'],
                  }
                : {}),
            });
          },
          cancelledBuilder: cancelledBuilder2,
          persistTaskState: persistTaskState2,
          spec: { ...args, cancelledBuilder: cancelledBuilder2 },
        })
      );
    } finally {
      ((cancelInFlight = ![]), (enabled6 = ![]));
      const enabled8 = handler2();
      !enabled8 && ((source = ''), (next = ''), (taskProviderProfileId = ''), (enabled5 = ![]));
    }
  }
  async function resumeIfNeeded({ payload: payload3, startedAt: startedAt4 } = {}) {
    if (enabled) return { ok: ![], status: 'disposed' };
    const useOpenapiQuery = run(),
      provider4 = normalizeProvider(useOpenapiQuery['provider']),
      taskId6 = String(useOpenapiQuery['rhTaskId'] || '')['trim'](),
      value4 = String(useOpenapiQuery['rhTaskStatus'] || '')
        ['trim']()
        ['toLowerCase']();
    if (
      !isRunningHubProvider(provider4) ||
      !taskId6 ||
      ['success', 'failed', 'idle', 'cancelled', 'canceled']['includes'](value4)
    )
      return (resetRecovery(), null);
    if (target === taskId6 && enabled4) return enabled4;
    if (!payload3 || typeof payload3 !== 'object')
      throw new Error('[audioTaskOrchestration] resume payload is required');
    const startedAt5 = Number(
        startedAt4 || useOpenapiQuery['rhTaskStartedAt'] || useOpenapiQuery['generationStartTime'] || now(),
      ),
      signal2 = createAbortController();
    ((value2 = signal2), (target = taskId6), (source = taskId6));
    const providerProfileId2 = String(
      useOpenapiQuery['taskProviderProfileId'] ||
        useOpenapiQuery['providerProfileId'] ||
        useOpenapiQuery['rhProviderProfileId'] ||
        payload3['providerProfileId'] ||
        payload3['rhProviderProfileId'] ||
        '',
    )['trim']();
    taskProviderProfileId = providerProfileId2;
    const payload4 = {
      ...payload3,
      useOpenapiQuery: useOpenapiQuery['rhTaskUseOpenapiQuery'] !== ![],
      ...(providerProfileId2
        ? { providerProfileId: providerProfileId2, rhProviderProfileId: providerProfileId2 }
        : {}),
    };
    let enabled9 = String(payload3['apiKey'] || next || '')['trim']();
    if (!enabled9)
      try {
        (await ensureConfig(),
          (enabled9 = String(getProviderConfig(providerProfileId2 || 'runninghubwf')?.['apiKey'] || '')[
            'trim'
          ]()));
      } catch {}
    ((next = enabled9),
      setBusyState({ isGenerating: !![], cancelInFlight: ![], taskId: taskId6 }),
      setLoading(!![]));
    const generationResumePlanFromNode = createGenerationResumePlanFromNode({
        kind: 'audio',
        node: useOpenapiQuery,
        payload: payload4,
        sourceNodeId: nodeId,
        targetNodeId: nodeId,
        trigger: 'node',
        taskType: 'audio-generation',
        taskProtocol: 'workflow',
        provider: normalizeProvider(payload4['provider'], provider4),
        adapterType: payload4['adapterType'] || 'workflow',
        modelId: payload4['audioWorkflowKey'] || useOpenapiQuery['model'] || '',
        executionId: payload4['executionId'],
        taskId: taskId6,
        startedAt: startedAt5,
        cancellable: supportsAudioTaskCancellation(payload4),
        resumable: !![],
        pauseOnAbort: !![],
        startBuilder: () => handler3(payload4),
        persistTaskState: persistTaskState2,
        poll: async () => {
          return (
            throwIfAborted(signal2['signal']),
            api['resumeRunningHubAudioTask'](taskId6, payload4, {
              signal: signal2['signal'],
              useOpenapiQuery: payload4['useOpenapiQuery'],
            })
          );
        },
        resultBuilder: async (value5, startedAt6) => ({
          ...(await resultBuilder(value5, startedAt6)),
          rhStatusMessage: null,
          rhStatusCode: null,
          ...buildRunningHubTaskPatch({
            taskId: taskId6,
            status: 'success',
            startedAt: startedAt6['startedAt'],
            recovering: ![],
            useOpenapiQuery: payload4['useOpenapiQuery'],
          }),
        }),
        failureBuilder: (value6, startedAt7) => ({
          ...failureBuilder(value6),
          ...buildRunningHubTaskPatch({
            taskId: taskId6,
            status: 'failed',
            startedAt: startedAt7['startedAt'],
            recovering: ![],
            useOpenapiQuery: payload4['useOpenapiQuery'],
          }),
        }),
        cancelledBuilder: (startedAt8) => ({
          ...cancelledBuilder(),
          ...buildRunningHubTaskPatch({
            taskId: taskId6,
            status: 'cancelled',
            startedAt: startedAt8['startedAt'],
            recovering: ![],
            useOpenapiQuery: payload4['useOpenapiQuery'],
          }),
        }),
        parseError: (error4) =>
          error4?.['message'] || rhStatusMessage('generationFailed', 'Audio generation failed'),
      }),
      value7 = runtime['resumeTask'](generationResumePlanFromNode, {
        store: store,
        startedAt: startedAt5,
        abortController: signal2,
      })
        ['then'](async (result3) => {
          if (result3?.['status'] === 'success' && !enabled && signal2['signal']['aborted'] !== !![]) {
            const resultPatch2 = getResultPatch(result3['patch'] || run());
            (await afterResultCommit(resultPatch2, startedAt5, result3),
              await onSuccess(result3, { recovering: !![], payload: payload4 }));
          } else
            result3?.['status'] === 'failed' &&
              !enabled &&
              (await onFailure(result3['error'], {
                payload: payload4,
                result: result3,
                recovering: !![],
              }));
          return result3;
        })
        ['catch']((value8) => {
          if (isAbortLike(value8, signal2['signal'])) return { ok: !![], status: 'pending', paused: !![] };
          throw value8;
        })
        ['finally'](() => {
          if (value2 === signal2) value2 = null;
          if (target === taskId6) target = '';
          enabled4 = null;
          const enabled10 = enabled ? ![] : handler2();
          if (!enabled10) source = '';
        });
    return ((enabled4 = value7), value7);
  }
  function getGenerationStatus() {
    const value9 = run(),
      jobStatus = String(
        value9['jobStatus'] || value9['rhTaskStatus'] || (enabled2 || enabled4 ? 'running' : 'idle'),
      );
    return {
      nodeId: nodeId,
      jobStatus: jobStatus,
      isGenerating: !!enabled2 || !!enabled4 || jobStatus === 'running' || jobStatus === 'pending',
      taskId: String(source || value9['rhTaskId'] || value9['taskId'] || ''),
      cancellable: supportsAudioTaskCancellation(value9),
      resumable: Boolean(value9['rhTaskId']),
      cancelInFlight: cancelInFlight,
    };
  }
  function dispose({ preserveTask: preserveTask = ![] } = {}) {
    enabled = !![];
    !preserveTask && enabled3 && !enabled3['signal']['aborted'] && enabled3['abort']();
    enabled3 = null;
    if (!preserveTask) resetRecovery();
  }
  return Object['freeze']({
    runGeneration: runGeneration,
    cancelGeneration: cancelGeneration,
    getGenerationStatus: getGenerationStatus,
    resetRecovery: resetRecovery,
    resumeIfNeeded: resumeIfNeeded,
    dispose: dispose,
  });
}
