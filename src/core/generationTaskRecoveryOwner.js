import {
  GENERATION_TASK_PROTOCOLS,
  getGenerationTaskProtocolAdapter,
} from './generationTaskProtocolAdapters.js';
import { resolveGenerationUiState, shouldShowGenerationBusyUi } from './generationTaskUiState.js';
const LEGACY_RECOVERY_FIELDS = Object['freeze']({
  [GENERATION_TASK_PROTOCOLS['WORKFLOW']]: Object['freeze']({
    abortController: '_rhResumeAbortController',
    taskId: '_rhResumeTaskId',
    promise: '_rhResumePromise',
  }),
  [GENERATION_TASK_PROTOCOLS['DREAMINA']]: Object['freeze']({
    abortController: '_dreaminaResumeAbortController',
    taskId: '_dreaminaResumeSubmitId',
    promise: '_dreaminaResumePromise',
  }),
  [GENERATION_TASK_PROTOCOLS['ASYNC_MODEL_API']]: Object['freeze']({
    abortController: '_asyncResumeAbortController',
    taskId: '_asyncResumeTaskId',
    promise: '_asyncResumePromise',
  }),
});
function createLane() {
  return { abortController: null, taskId: '', promise: null };
}
function normalizeTaskId(value) {
  return String(value || '')['trim']();
}
export function createGenerationTaskRecoveryOwner({
  readTaskNode: readTaskNode = () => ({}),
  updateTaskNode: updateTaskNode = () => {},
  persist: persist = () => {},
  onUiStateChange: onUiStateChange = () => {},
  createAbortController: createAbortController = () => new AbortController(),
} = {}) {
  const lane = new Map(Object['values'](GENERATION_TASK_PROTOCOLS)['map']((item) => [item, createLane()])),
    handler = (key) => {
      const adapter = getGenerationTaskProtocolAdapter(key);
      if (!adapter) throw new Error('Unknown generation task recovery protocol: ' + key);
      return { adapter: adapter, lane: lane['get'](adapter['id']) };
    },
    publishUiState = () => {
      const node = readTaskNode() || {},
        state = resolveGenerationUiState(node);
      return (onUiStateChange({ state: state, busy: shouldShowGenerationBusyUi(node), node: node }), state);
    },
    handler2 = (index, result = {}) => {
      try {
        const promise = persist(index, result);
        promise?.['catch']?.(() => {});
      } catch {}
    },
    stop = (data, { resetRecovering: resetRecovering = false } = {}) => {
      const { adapter: adapter2, lane: lane2 } = handler(data);
      lane2['abortController']?.['signal']?.['aborted'] !== true && lane2['abortController']?.['abort']?.();
      ((lane2['abortController'] = null), (lane2['taskId'] = ''), (lane2['promise'] = null));
      if (resetRecovering && readTaskNode()?.[adapter2['recoveringField']] === true) {
        const patch = { [adapter2['recoveringField']]: false };
        (updateTaskNode(patch), handler2(adapter2['id'], { type: 'recovering-reset', patch: patch }));
      }
      publishUiState();
    },
    claim = (options, target, { abortPrevious: abortPrevious = true } = {}) => {
      const { adapter: adapter3, lane: lane3 } = handler(options),
        taskId2 = normalizeTaskId(target);
      if (taskId2 && lane3['taskId'] === taskId2 && lane3['promise'])
        return { claimed: false, controller: lane3['abortController'], promise: lane3['promise'] };
      if (abortPrevious) stop(adapter3['id']);
      return (
        (lane3['taskId'] = taskId2),
        (lane3['abortController'] = createAbortController()),
        publishUiState(),
        { claimed: true, controller: lane3['abortController'], promise: null }
      );
    },
    setPromise = (source, next) => {
      const { adapter: adapter4, lane: lane4 } = handler(source);
      return (
        (lane4['promise'] = next || null),
        handler2(adapter4['id'], { type: 'recovery-start', taskId: lane4['taskId'] }),
        publishUiState(),
        lane4['promise']
      );
    },
    finish = (current, { taskId: taskId = '', controller: controller = null } = {}) => {
      const { adapter: adapter5, lane: lane5 } = handler(current),
        taskId3 = normalizeTaskId(taskId);
      if (controller && lane5['abortController'] && lane5['abortController'] !== controller) return false;
      if (taskId3 && lane5['taskId'] && lane5['taskId'] !== taskId3) return false;
      return (
        (lane5['abortController'] = null),
        (lane5['taskId'] = ''),
        (lane5['promise'] = null),
        handler2(adapter5['id'], { type: 'recovery-finish', taskId: taskId3 }),
        publishUiState(),
        true
      );
    },
    bindLegacyState = (enabled, entry = LEGACY_RECOVERY_FIELDS) => {
      if (!enabled || typeof enabled !== 'object') return enabled;
      return (
        Object['entries'](entry)['forEach'](([record, payload]) => {
          const { lane: lane6 } = handler(record);
          Object['entries'](payload)['forEach'](([handle, config]) => {
            const el = Object['getOwnPropertyDescriptor'](enabled, config);
            if (el && el['configurable'] === false) return;
            if (el && 'value' in el) lane6[handle] = el['value'];
            Object['defineProperty'](enabled, config, {
              configurable: true,
              enumerable: false,
              get: () => lane6[handle],
              set: (scope) => {
                lane6[handle] = handle === 'taskId' ? normalizeTaskId(scope) : scope;
              },
            });
          });
        }),
        enabled
      );
    };
  return Object['freeze']({
    bindLegacyState: bindLegacyState,
    claim: claim,
    finish: finish,
    getLane: (input) => handler(input)['lane'],
    getUiState: () => resolveGenerationUiState(readTaskNode() || {}),
    isBusy: (taskNode = readTaskNode() || {}) => shouldShowGenerationBusyUi(taskNode),
    publishUiState: publishUiState,
    setPromise: setPromise,
    stop: stop,
  });
}
