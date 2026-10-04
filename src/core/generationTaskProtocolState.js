import {
  GENERATION_TASK_PROTOCOLS,
  buildGenerationTaskProtocolPatch,
  inferGenerationTaskProtocol,
} from './generationTaskProtocolAdapters.js';
function normalizeStatus(value, item = 'pending') {
  return String(value || item)['trim']() || item;
}
function normalizeNumber(key, index = 0x0) {
  const result = Number(key);
  return Number['isFinite'](result) ? result : index;
}
const DEFAULT_IMAGE_DREAMINA_TASK_LABEL = '生成中';
function isWorkflowProtocolSpec(options = {}, data = {}) {
  return (
    inferGenerationTaskProtocol({
      taskProtocol: options['protocol'],
      adapterType: options['adapterType'] || data['adapterType'],
      provider: options['provider'] || data['provider'],
      async: options['async'],
      node: data,
    }) === GENERATION_TASK_PROTOCOLS['WORKFLOW']
  );
}
function isAsyncModelApiProtocolSpec(options2 = {}, target = {}) {
  return (
    inferGenerationTaskProtocol({
      taskProtocol: options2['protocol'],
      adapterType: options2['adapterType'] || target['adapterType'],
      provider: options2['provider'] || target['provider'],
      async: options2['async'],
      node: target,
    }) === GENERATION_TASK_PROTOCOLS['ASYNC_MODEL_API']
  );
}
function buildTaskMetaPatch(options3 = {}) {
  const args = String(
    options3['providerProfileId'] ||
      options3['payload']?.['providerProfileId'] ||
      options3['payload']?.['rhProviderProfileId'] ||
      '',
  )['trim']();
  return {
    taskTrigger: String(options3['trigger'] || ''),
    taskType: String(options3['taskType'] || ''),
    taskProvider: String(options3['provider'] || ''),
    ...(args ? { taskProviderProfileId: args } : {}),
    taskAdapterType: String(options3['adapterType'] || ''),
    taskModelId: String(options3['modelId'] || ''),
    taskExecutionId: String(options3['executionId'] || ''),
    taskCancellable: options3['cancellable'] === !![],
    taskResumable: options3['resumable'] === !![],
  };
}
export function buildRunningHubTaskPatch({
  taskId: taskId = '',
  status: status = 'pending',
  startedAt: startedAt = 0x0,
  recovering: recovering = ![],
  useOpenapiQuery: useOpenapiQuery = ![],
} = {}) {
  return buildGenerationTaskProtocolPatch(GENERATION_TASK_PROTOCOLS['WORKFLOW'], {
    taskId: taskId,
    status: status,
    startedAt: startedAt,
    recovering: recovering,
    useOpenapiQuery: useOpenapiQuery,
  });
}
export function buildAsyncTaskPatch({
  provider: provider = '',
  kind: kind = 'generation',
  taskId: taskId = '',
  status: status = 'pending',
  startedAt: startedAt = 0x0,
  recovering: recovering = ![],
} = {}) {
  return buildGenerationTaskProtocolPatch(GENERATION_TASK_PROTOCOLS['ASYNC_MODEL_API'], {
    provider: provider,
    kind: kind,
    taskId: taskId,
    status: status,
    startedAt: startedAt,
    recovering: recovering,
  });
}
export function buildDreaminaTaskPatch({
  submitId: submitId = '',
  status: status = 'pending',
  phase: phase = 'generating',
  label: label = '',
  startedAt: startedAt = 0x0,
  lastCheckedAt: lastCheckedAt = Date['now'](),
  recovering: recovering = ![],
  raw: raw = {},
  defaultLabel: defaultLabel = '',
} = {}) {
  return buildGenerationTaskProtocolPatch(GENERATION_TASK_PROTOCOLS['DREAMINA'], {
    submitId: submitId,
    status: status,
    phase: phase,
    label: label,
    startedAt: startedAt,
    lastCheckedAt: lastCheckedAt,
    recovering: recovering,
    raw: raw,
    defaultLabel: defaultLabel,
  });
}
export function buildImageGenerationRunningHubTaskPatch(options4 = {}) {
  return buildRunningHubTaskPatch(options4);
}
export function buildImageGenerationDreaminaTaskPatch({
  submitId: submitId = '',
  status: status = 'pending',
  phase: phase = 'generating',
  label: label = DEFAULT_IMAGE_DREAMINA_TASK_LABEL,
  startedAt: startedAt = 0x0,
  lastCheckedAt: lastCheckedAt = Date['now'](),
  recovering: recovering = ![],
  raw: raw = {},
} = {}) {
  return buildDreaminaTaskPatch({
    submitId: submitId,
    status: status,
    phase: phase,
    label: label,
    startedAt: startedAt,
    lastCheckedAt: lastCheckedAt,
    recovering: recovering,
    raw: raw,
    defaultLabel: DEFAULT_IMAGE_DREAMINA_TASK_LABEL,
  });
}
export function buildImageGenerationAsyncTaskPatch({
  provider: provider = '',
  kind: kind = 'image',
  taskId: taskId = '',
  status: status = 'pending',
  startedAt: startedAt = 0x0,
  recovering: recovering = ![],
} = {}) {
  return buildAsyncTaskPatch({
    provider: provider,
    kind: kind,
    taskId: taskId,
    status: status,
    startedAt: startedAt,
    recovering: recovering,
  });
}
export function buildRunningHubOpenapiTaskPatch({
  taskId: taskId = '',
  status: status = 'pending',
  startedAt: startedAt = 0x0,
  recovering: recovering = ![],
  useOpenapiQuery: useOpenapiQuery = !![],
} = {}) {
  return buildRunningHubTaskPatch({
    taskId: taskId,
    status: status,
    startedAt: startedAt,
    recovering: recovering,
    useOpenapiQuery: useOpenapiQuery,
  });
}
export function buildIdleGenerationProtocolPatch({ kind: kind = 'generation' } = {}) {
  return {
    generationQueueStatus: 'idle',
    generationQueueIndex: -0x1,
    generationQueueLength: 0x0,
    ...buildRunningHubTaskPatch({
      taskId: '',
      status: 'idle',
      startedAt: 0x0,
      recovering: ![],
      useOpenapiQuery: ![],
    }),
    ...buildDreaminaTaskPatch({
      submitId: '',
      status: 'idle',
      phase: 'idle',
      label: '',
      startedAt: 0x0,
      lastCheckedAt: 0x0,
      recovering: ![],
      raw: {},
    }),
    ...buildAsyncTaskPatch({
      provider: '',
      kind: kind,
      taskId: '',
      status: 'idle',
      startedAt: 0x0,
      recovering: ![],
    }),
  };
}
export function buildGenerationProtocolResetPatch(options5 = {}) {
  return buildIdleGenerationProtocolPatch(options5);
}
export function buildGenerationProtocolStartPatch(options6 = {}, source = 0x0) {
  const args2 = buildTaskMetaPatch(options6),
    args3 = { generationQueueStatus: 'submitting', generationQueueIndex: -0x1, generationQueueLength: 0x0 };
  if (isWorkflowProtocolSpec(options6))
    return {
      ...args2,
      ...args3,
      ...buildRunningHubTaskPatch({
        taskId: '',
        status: 'pending',
        startedAt: source,
        recovering: ![],
        useOpenapiQuery: ![],
      }),
      rhSourceNodeId: String(options6['sourceNodeId'] || ''),
      rhToolbarTaskType: String(options6['taskType'] || ''),
    };
  if (isAsyncModelApiProtocolSpec(options6))
    return {
      ...args2,
      ...args3,
      asyncTaskId: '',
      asyncTaskStatus: 'pending',
      asyncTaskStartedAt: normalizeNumber(source),
      asyncTaskRecovering: ![],
    };
  return { ...args2, ...args3 };
}
export function buildGenerationProtocolTaskIdPatch(options7 = {}, next = '', current = 0x0) {
  const enabled = String(next || '')['trim']();
  if (!enabled) return {};
  if (isWorkflowProtocolSpec(options7))
    return buildRunningHubTaskPatch({
      taskId: enabled,
      status: 'running',
      startedAt: current,
      recovering: ![],
      useOpenapiQuery: ![],
    });
  if (isAsyncModelApiProtocolSpec(options7))
    return {
      asyncTaskId: enabled,
      asyncTaskStatus: 'running',
      asyncTaskStartedAt: normalizeNumber(current),
      asyncTaskRecovering: ![],
    };
  return {};
}
export function buildGenerationProtocolTerminalPatch(options8 = {}, entry = 'idle') {
  const status2 = normalizeStatus(entry, 'idle');
  if (isWorkflowProtocolSpec(options8))
    return {
      generationQueueStatus: 'idle',
      generationQueueIndex: -0x1,
      generationQueueLength: 0x0,
      rhTaskStatus: status2,
      rhTaskRecovering: ![],
    };
  if (isAsyncModelApiProtocolSpec(options8))
    return {
      generationQueueStatus: 'idle',
      generationQueueIndex: -0x1,
      generationQueueLength: 0x0,
      asyncTaskStatus: status2,
      asyncTaskRecovering: ![],
    };
  return { generationQueueStatus: 'idle', generationQueueIndex: -0x1, generationQueueLength: 0x0 };
}
export function buildGenerationProtocolPendingPatch(options9 = {}, record = {}, payload = '') {
  const args4 = String(record?.['taskId'] || '')['trim'](),
    args5 = String(payload || '')['trim'](),
    args6 = {
      isGenerating: !![],
      jobStatus: 'running',
      jobError: null,
      generationDuration: null,
      ...(args5 ? { statusMessage: args5 } : {}),
    };
  if (isWorkflowProtocolSpec(options9))
    return {
      ...args6,
      ...(args4
        ? buildGenerationProtocolTaskIdPatch(options9, args4, record['startedAt'])
        : { rhTaskStatus: 'pending' }),
      rhTaskRecovering: ![],
      ...(args5 ? { rhStatusMessage: args5 } : {}),
    };
  if (isAsyncModelApiProtocolSpec(options9))
    return {
      ...args6,
      ...(args4
        ? buildGenerationProtocolTaskIdPatch(options9, args4, record['startedAt'])
        : { asyncTaskStatus: 'pending' }),
      asyncTaskRecovering: ![],
    };
  return args6;
}
export function buildGenerationProtocolTransitionPatch({
  type: type = '',
  spec: spec = {},
  context: context = {},
  startedAt: startedAt = 0x0,
  taskId: taskId = '',
  status: status = '',
  message: message = '',
  kind: kind = 'generation',
} = {}) {
  const handle = String(type || '')['trim']();
  if (handle === 'start') return buildGenerationProtocolStartPatch(spec, startedAt);
  if (handle === 'taskId') return buildGenerationProtocolTaskIdPatch(spec, taskId, startedAt);
  if (handle === 'pending') return buildGenerationProtocolPendingPatch(spec, context, message);
  if (handle === 'terminal') return buildGenerationProtocolTerminalPatch(spec, status);
  if (handle === 'reset') return buildGenerationProtocolResetPatch({ kind: kind });
  return {};
}
