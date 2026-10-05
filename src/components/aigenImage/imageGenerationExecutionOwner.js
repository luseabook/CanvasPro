import { createAIGenerateNodeTaskOrchestrationModule } from './taskOrchestrationModule.js';
import { isWorkflowModel } from '../../manifests/index.js';
import { submitTask, resumeTask, cancelTask } from '../../core/generationTaskRuntime.js';
import { getGenerationRatioMediaSize } from '../../modules/generationRatioSource.js';
const readState = (store) => store['getStateRaw']?.() || store['getState'](),
  cancelled = (targetNodeId) => ({
    ok: false,
    status: 'cancelled',
    reason: 'target-changed',
    targetNodeId: targetNodeId,
  });
export function createImageGenerationExecutionOwner({
  store: store2,
  getScopeId: getScopeId,
  dependencies: dependencies = {},
}) {
  if (!store2 || typeof getScopeId !== 'function')
    throw new TypeError('Image execution requires a Store and canvas scope reader');
  const map = new Map();
  let enabled = false;
  function run(nodeId, taskScopeId) {
    let enabled2 = null,
      enabled3 = false,
      value = null,
      submitting = false;
    const isTargetCurrent = () =>
        !enabled &&
        !enabled3 &&
        getScopeId() === taskScopeId &&
        readState(store2)['nodes']?.[nodeId]?.['type'] === 'ai-image',
      store3 = () => enabled2?.['store'] || store2,
      handler = () =>
        (enabled2?.['background'] === true || isTargetCurrent()) && !!readState(store3())['nodes']?.[nodeId],
      store4 = {
        getState: () => (handler() ? readState(store3()) : { nodes: {}, edges: {} }),
        getStateRaw: () => store4['getState'](),
        getIncomingEdges: (item) => (handler() ? store3()['getIncomingEdges']?.(item) || [] : []),
        updateNodeData: (key, index) => {
          if (handler() && readState(store3())['nodes']?.[key]) store3()['updateNodeData'](key, index);
        },
      },
      startLoading = () => {
        if (isTargetCurrent()) value?.['onStateChange']?.(args['getGenerationStatus']());
      },
      handler2 = async (handler3, args2, args3) => {
        if (!isTargetCurrent()) return cancelled(nodeId);
        return handler3(
          {
            ...args2,
            startBuilder: async (result) => {
              return ((enabled2 = result), args2['startBuilder']?.(result));
            },
            onTaskStart: (data) => {
              const options = args2['onTaskStart']?.(data);
              return (startLoading(), options);
            },
          },
          { ...args3, store: store3(), taskScopeId: taskScopeId, isTargetCurrent: isTargetCurrent },
        );
      },
      aIGenerateNodeTaskOrchestrationModule = createAIGenerateNodeTaskOrchestrationModule({
        ...dependencies,
        store: store4,
        isTargetCurrent: isTargetCurrent,
        startLoading: startLoading,
        stopLoading: startLoading,
        getInputRatioSize: ({ nodeData: nodeData, edge: edge, includeNodeFrame: includeNodeFrame }) =>
          getGenerationRatioMediaSize(nodeData, edge, { includeNodeFrame: includeNodeFrame }),
        taskRuntime: {
          submitTask: (target, source) => handler2(submitTask, target, source),
          resumeTask: (next, current) => handler2(resumeTask, next, current),
          cancelTask: (entry, args4) => cancelTask(entry, { ...args4, store: store3() }),
        },
      }),
      args5 = Object['assign'](Object['create'](aIGenerateNodeTaskOrchestrationModule), {
        nodeId: nodeId,
        _data: readState(store2)['nodes'][nodeId],
        _isRunninghubWorkflowModel: isWorkflowModel,
        _updateSubmitButtonState: startLoading,
      }),
      handler4 = async (record, payload) => {
        if (!isTargetCurrent()) return cancelled(nodeId);
        if (submitting) return { ok: false, status: 'running', targetNodeId: nodeId };
        (value?.['flushPrompt']?.(), (enabled2 = null), (submitting = true), startLoading());
        try {
          return await record['apply'](args5, payload);
        } finally {
          ((submitting = false), startLoading());
        }
      },
      args = {
        buildPayload: (handle) => {
          if (!isTargetCurrent()) return null;
          return (value?.['flushPrompt']?.(), args5['_buildPayload'](handle));
        },
        runGeneration: (options2 = {}) =>
          handler4(aIGenerateNodeTaskOrchestrationModule['runGeneration'], [options2]),
        runPreset: (state, config = {}) =>
          handler4(aIGenerateNodeTaskOrchestrationModule['_onGenerate'], [state, config]),
        getGenerationStatus: () => ({
          ...args5['getGenerationStatus'](),
          submitting: submitting && !enabled2,
          isGenerating: submitting || args5['getGenerationStatus']()['isGenerating'],
        }),
        cancelGeneration: async () => {
          if (!enabled2)
            return (
              value?.['onStateChange']?.({
                ...args['getGenerationStatus'](),
                isGenerating: false,
                submitting: false,
                jobStatus: 'cancelled',
              }),
              (enabled3 = true),
              { ok: true, status: 'cancelled', reason: 'user-cancelled', targetNodeId: nodeId }
            );
          if (args5['_isRunninghubWorkflowModel'](args5['_data']?.['model'], args5['_data']?.['provider']))
            return args5['cancelGeneration']();
          return cancelTask(nodeId, { store: store3(), abortLocal: true });
        },
        resumeGeneration: () => {
          const scope = store4['getState']()['nodes']?.[nodeId] || {};
          if (
            submitting ||
            !(
              args5['_isRunningHubRecoverableRunningTask'](scope) ||
              args5['_isDreaminaRecoverableRunningTask'](scope) ||
              args5['_isAsyncRecoverableRunningTask'](scope) ||
              args5['_shouldFallbackRegenerateAsyncTask'](scope)
            )
          )
            return args['getGenerationStatus']();
          return handler4(async function () {
            return (
              await this['_maybeResumeRunningHubTaskImpl'](),
              await this['_maybeResumeDreaminaTaskImpl'](),
              await this['_maybeResumeAsyncTaskImpl'](),
              await Promise['all'](
                [
                  this['_rhResumePromise'],
                  this['_dreaminaResumePromise'],
                  this['_asyncResumePromise'],
                  this['_asyncFallbackRegeneratePromise'],
                ]['filter'](Boolean),
              ),
              this['getGenerationStatus']()
            );
          }, []);
        },
        attachPresentation(input) {
          return (
            (value = input),
            startLoading(),
            () => {
              if (value === input) value = null;
            }
          );
        },
        reconcile() {
          if (!isTargetCurrent()) value = null;
          if (enabled2?.['background'] === true) return;
          if (!isTargetCurrent()) {
            enabled3 = true;
            if (enabled2 && submitting) void cancelTask(nodeId, { store: store3(), abortLocal: true });
          }
        },
        isReusable: () => !enabled3,
        isPending: () => submitting,
        dispose() {
          ((enabled3 = true), (value = null));
          if (enabled2 && submitting) void cancelTask(nodeId, { store: store3(), abortLocal: true });
        },
      };
    return args;
  }
  let state2 = readState(store2)['nodes'],
    state3 = readState(store2)['_nodesRev'],
    state4 = readState(store2)['_nodeMembershipRev'],
    output = getScopeId();
  const value2 = store2['subscribeRaw']?.((state5) => {
    const value3 = getScopeId();
    if (
      state5['_nodesRev'] !== undefined &&
      state2 === state5['nodes'] &&
      state3 === state5['_nodesRev'] &&
      output === value3
    )
      return;
    const value4 = state2 !== state5['nodes'] || state4 !== state5['_nodeMembershipRev'] || output !== value3;
    ((state2 = state5['nodes']),
      (state3 = state5['_nodesRev']),
      (state4 = state5['_nodeMembershipRev']),
      (output = value3));
    for (const [value5, map2] of map) {
      for (const [value6, enabled4] of map2) {
        enabled4['reconcile']();
        if (!enabled4['isPending']() && (value5 !== getScopeId() || !enabled4['isReusable']()))
          map2['delete'](value6);
      }
      if (!map2['size']) map['delete'](value5);
    }
    if (value4) run2();
  });
  let value7 = false;
  function run2() {
    if (enabled || value7) return;
    ((value7 = true),
      queueMicrotask(() => {
        value7 = false;
        if (enabled) return;
        for (const value8 of Object['values'](readState(store2)['nodes'] || {})) {
          value8['type'] === 'ai-image' &&
            (value8['isGenerating'] ||
              value8['rhTaskId'] ||
              value8['asyncTaskId'] ||
              value8['dreaminaSubmitId']) &&
            Promise['resolve'](promise['resolve'](value8['id'])?.['resumeGeneration']())['catch']((value9) =>
              console['error']('[imageGenerationExecution] recovery failed', value9),
            );
        }
      }));
  }
  const promise = {
    resolve(value10, value11 = {}) {
      if (
        enabled ||
        (value11['store'] && value11['store'] !== store2) ||
        readState(store2)['nodes']?.[value10]?.['type'] !== 'ai-image'
      )
        return null;
      const value12 = getScopeId();
      let map3 = map['get'](value12);
      !map3 && ((map3 = new Map()), map['set'](value12, map3));
      let enabled5 = map3['get'](value10);
      return (
        !enabled5?.['isReusable']() && ((enabled5 = run(value10, value12)), map3['set'](value10, enabled5)),
        enabled5
      );
    },
    dispose() {
      ((enabled = true), value2?.());
      for (const map4 of map['values']()) for (const value13 of map4['values']()) value13['dispose']();
      map['clear']();
    },
  };
  return (run2(), promise);
}
