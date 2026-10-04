import {
  getGenerationTaskProtocolAdapter,
  inferGenerationTaskProtocol,
} from './generationTaskProtocolAdapters.js';
const ADAPTER_TYPE_ALIASES = Object['freeze']({
  workflow: 'workflow',
  modelapi: 'modelApi',
  model_api: 'modelApi',
  'model-api': 'modelApi',
  localruntime: 'localRuntime',
  local_runtime: 'localRuntime',
  'local-runtime': 'localRuntime',
});
function compactIdPart(value, item = '') {
  return String(value || item)
    ['trim']()
    ['replace'](/\s+/g, '-');
}
function firstTrimmed(...args) {
  for (const key of args) {
    const index = String(key || '')['trim']();
    if (index) return index;
  }
  return '';
}
export function normalizeGenerationAdapterType(result, data = 'modelApi') {
  const options = String(result || data)
    ['trim']()
    ['toLowerCase']();
  return ADAPTER_TYPE_ALIASES[options] || data;
}
export function resolveGenerationTaskIdentity(options2 = {}) {
  const {
      kind: kind = 'generation',
      node: node = {},
      payload: payload = {},
      taskProtocol: taskProtocol = '',
      provider: provider = '',
      adapterType: adapterType = '',
      modelId: modelId = '',
      executionId: executionId = '',
      taskId: taskId = '',
      startedAt: startedAt = 0x0,
    } = options2 || {},
    protocol = inferGenerationTaskProtocol({
      taskProtocol: taskProtocol,
      adapterType: adapterType,
      provider: provider,
      node: node,
      async: taskProtocol === 'asyncModelApi',
    }),
    taskId2 = getGenerationTaskProtocolAdapter(protocol),
    adapterType2 = normalizeGenerationAdapterType(
      adapterType || node['taskAdapterType'] || node['adapterType'] || taskId2?.['adapterType'],
    ),
    provider2 = firstTrimmed(
      provider,
      node['taskProvider'],
      payload?.['provider'],
      protocol === 'asyncModelApi' ? node['asyncTaskProvider'] : '',
      node['provider'],
      protocol === 'workflow' ? 'runninghubwf' : '',
      protocol === 'dreamina' ? 'dreamina' : '',
      adapterType2,
    ),
    modelId2 = firstTrimmed(modelId, node['taskModelId'], payload?.['model'], node['model']),
    executionId2 = firstTrimmed(
      executionId,
      node['taskExecutionId'],
      buildGenerationExecutionId({
        kind: kind,
        provider: provider2,
        adapterType: adapterType2,
        modelId: modelId2,
      }),
    );
  return {
    protocol: protocol,
    provider: provider2,
    adapterType: adapterType2,
    modelId: modelId2,
    executionId: executionId2,
    taskId:
      taskId2?.['readTaskId'](node, taskId) ||
      firstTrimmed(taskId, node['rhTaskId'], node['asyncTaskId'], node['dreaminaSubmitId'], node['taskId']),
    startedAt:
      taskId2?.['readStartedAt'](node, startedAt) || Number(startedAt || node['generationStartTime'] || 0x0),
    async: taskId2?.['async'] === !![],
  };
}
export function buildGenerationExecutionId({
  kind: kind2,
  provider: provider3,
  adapterType: adapterType3,
  modelId: modelId3,
  fallbackModel: fallbackModel = 'default',
} = {}) {
  const compactIdPart2 = compactIdPart(kind2, 'generation'),
    compactIdPart3 = compactIdPart(provider3, normalizeGenerationAdapterType(adapterType3, 'modelApi')),
    compactIdPart4 = compactIdPart(modelId3, fallbackModel);
  return compactIdPart2 + '.' + compactIdPart3 + '.' + compactIdPart4;
}
export function createGenerationExecutionPlan(options3 = {}) {
  const {
      kind: kind = 'generation',
      sourceNodeId: sourceNodeId = '',
      targetNodeId: targetNodeId = '',
      trigger: trigger = 'node',
      taskType: taskType = '',
      provider: provider = '',
      adapterType: adapterType = 'modelApi',
      modelId: modelId = '',
      executionId: executionId = '',
      payload: payload2,
      cancellable: cancellable,
      resumable: resumable,
      protocol: protocol2 = '',
      taskProtocol: taskProtocol = '',
      async: async,
      ...args2
    } = options3 || {},
    adapterType4 = normalizeGenerationAdapterType(adapterType),
    target = adapterType4 === 'workflow',
    async2 = async === !![] && adapterType4 === 'modelApi',
    provider4 = compactIdPart(provider || payload2?.['provider'], adapterType4),
    protocol3 =
      inferGenerationTaskProtocol({
        taskProtocol: taskProtocol || protocol2,
        adapterType: adapterType4,
        provider: provider4,
        async: async2,
      }) || adapterType4,
    modelId4 = String(modelId || payload2?.['model'] || '')['trim']();
  return {
    ...args2,
    sourceNodeId: sourceNodeId,
    targetNodeId: targetNodeId,
    trigger: trigger,
    taskType: String(taskType || kind + '-generation')['trim'](),
    provider: provider4,
    adapterType: adapterType4,
    protocol: protocol3,
    modelId: modelId4,
    executionId:
      String(executionId || '')['trim']() ||
      buildGenerationExecutionId({
        kind: kind,
        provider: provider4,
        adapterType: adapterType4,
        modelId: modelId4,
      }),
    payload: payload2,
    cancellable: cancellable === undefined ? target : cancellable === !![],
    resumable: resumable === undefined ? target || async2 : resumable === !![],
    async: async2,
    capabilities: {
      async: async2,
      cancellable: cancellable === undefined ? target : cancellable === !![],
      resumable: resumable === undefined ? target || async2 : resumable === !![],
    },
  };
}
function createGenerationLifecyclePlan(source, next = {}) {
  const args3 = createGenerationExecutionPlan(next);
  return { ...args3, lifecycle: String(source || 'submit') };
}
export function createGenerationSubmitPlan(options4 = {}) {
  return createGenerationLifecyclePlan('submit', options4);
}
export function createGenerationResumePlan(args4 = {}) {
  return createGenerationLifecyclePlan('resume', { resumable: !![], ...args4 });
}
export function createGenerationCancelPlan(args5 = {}) {
  return createGenerationLifecyclePlan('cancel', { cancellable: !![], ...args5 });
}
function createGenerationPlanFromNode(current, entry = {}) {
  const {
      node: node = {},
      payload: payload = {},
      taskProtocol: taskProtocol = '',
      provider: provider = '',
      adapterType: adapterType = '',
      modelId: modelId = '',
      executionId: executionId = '',
      taskId: taskId = '',
      startedAt: startedAt = 0x0,
      ...kind3
    } = entry || {},
    provider5 = resolveGenerationTaskIdentity({
      kind: kind3['kind'],
      node: node,
      payload: payload,
      taskProtocol: taskProtocol,
      provider: provider,
      adapterType: adapterType,
      modelId: modelId,
      executionId: executionId,
      taskId: taskId,
      startedAt: startedAt,
    }),
    record = {
      ...kind3,
      provider: provider5['provider'],
      adapterType: provider5['adapterType'],
      modelId: provider5['modelId'],
      executionId: provider5['executionId'],
      payload: payload,
      taskId: provider5['taskId'],
      startedAt: provider5['startedAt'],
      taskProtocol: provider5['protocol'],
      async: provider5['async'],
    };
  if (current === 'resume') return createGenerationResumePlan(record);
  if (current === 'cancel') return createGenerationCancelPlan(record);
  return createGenerationSubmitPlan(record);
}
export function createGenerationSubmitPlanFromNode(options5 = {}) {
  return createGenerationPlanFromNode('submit', options5);
}
export function createGenerationResumePlanFromNode(options6 = {}) {
  return createGenerationPlanFromNode('resume', options6);
}
export function createGenerationCancelPlanFromNode(options7 = {}) {
  return createGenerationPlanFromNode('cancel', options7);
}
