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
function compactIdPart(_0x280638, _0x248e10 = '') {
  return String(_0x280638 || _0x248e10)
    ['trim']()
    ['replace'](/\s+/g, '-');
}
function firstTrimmed(..._0x4c4822) {
  for (const _0x4fdf76 of _0x4c4822) {
    const _0x253746 = String(_0x4fdf76 || '')['trim']();
    if (_0x253746) return _0x253746;
  }
  return '';
}
export function normalizeGenerationAdapterType(_0x2ee406, _0x138845 = 'modelApi') {
  const _0x1af26d = String(_0x2ee406 || _0x138845)
    ['trim']()
    ['toLowerCase']();
  return ADAPTER_TYPE_ALIASES[_0x1af26d] || _0x138845;
}
export function resolveGenerationTaskIdentity(_0x44393b = {}) {
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
    } = _0x44393b || {},
    _0x19fe12 = inferGenerationTaskProtocol({
      taskProtocol: taskProtocol,
      adapterType: adapterType,
      provider: provider,
      node: node,
      async: taskProtocol === 'asyncModelApi',
    }),
    _0x129eb2 = getGenerationTaskProtocolAdapter(_0x19fe12),
    _0x135f2c = normalizeGenerationAdapterType(
      adapterType || node['taskAdapterType'] || node['adapterType'] || _0x129eb2?.['adapterType'],
    ),
    _0x42b8a8 = firstTrimmed(
      provider,
      node['taskProvider'],
      payload?.['provider'],
      _0x19fe12 === 'asyncModelApi' ? node['asyncTaskProvider'] : '',
      node['provider'],
      _0x19fe12 === 'workflow' ? 'runninghubwf' : '',
      _0x19fe12 === 'dreamina' ? 'dreamina' : '',
      _0x135f2c,
    ),
    _0x323a5a = firstTrimmed(modelId, node['taskModelId'], payload?.['model'], node['model']),
    _0x42555a = firstTrimmed(
      executionId,
      node['taskExecutionId'],
      buildGenerationExecutionId({
        kind: kind,
        provider: _0x42b8a8,
        adapterType: _0x135f2c,
        modelId: _0x323a5a,
      }),
    );
  return {
    protocol: _0x19fe12,
    provider: _0x42b8a8,
    adapterType: _0x135f2c,
    modelId: _0x323a5a,
    executionId: _0x42555a,
    taskId:
      _0x129eb2?.['readTaskId'](node, taskId) ||
      firstTrimmed(taskId, node['rhTaskId'], node['asyncTaskId'], node['dreaminaSubmitId'], node['taskId']),
    startedAt:
      _0x129eb2?.['readStartedAt'](node, startedAt) ||
      Number(startedAt || node['generationStartTime'] || 0x0),
    async: _0x129eb2?.['async'] === !![],
  };
}
export function buildGenerationExecutionId({
  kind: _0x2e205b,
  provider: _0x2ded01,
  adapterType: _0x1e3f9b,
  modelId: _0x3da94a,
  fallbackModel: fallbackModel = 'default',
} = {}) {
  const _0x174563 = compactIdPart(_0x2e205b, 'generation'),
    _0x56636d = compactIdPart(_0x2ded01, normalizeGenerationAdapterType(_0x1e3f9b, 'modelApi')),
    _0xb963af = compactIdPart(_0x3da94a, fallbackModel);
  return _0x174563 + '.' + _0x56636d + '.' + _0xb963af;
}
export function createGenerationExecutionPlan(_0x512413 = {}) {
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
      payload: _0x4d7bfd,
      cancellable: _0xc795de,
      resumable: _0x3568ba,
      protocol: _0x12c288 = '',
      taskProtocol: taskProtocol = '',
      async: _0xaef874,
      ..._0x3dbb84
    } = _0x512413 || {},
    _0x1fa4b1 = normalizeGenerationAdapterType(adapterType),
    _0x3fa9b7 = _0x1fa4b1 === 'workflow',
    _0x5270c8 = _0xaef874 === !![] && _0x1fa4b1 === 'modelApi',
    _0x5ba9c0 = compactIdPart(provider || _0x4d7bfd?.['provider'], _0x1fa4b1),
    _0x4a1667 =
      inferGenerationTaskProtocol({
        taskProtocol: taskProtocol || _0x12c288,
        adapterType: _0x1fa4b1,
        provider: _0x5ba9c0,
        async: _0x5270c8,
      }) || _0x1fa4b1,
    _0x1da55a = String(modelId || _0x4d7bfd?.['model'] || '')['trim']();
  return {
    ..._0x3dbb84,
    sourceNodeId: sourceNodeId,
    targetNodeId: targetNodeId,
    trigger: trigger,
    taskType: String(taskType || kind + '-generation')['trim'](),
    provider: _0x5ba9c0,
    adapterType: _0x1fa4b1,
    protocol: _0x4a1667,
    modelId: _0x1da55a,
    executionId:
      String(executionId || '')['trim']() ||
      buildGenerationExecutionId({
        kind: kind,
        provider: _0x5ba9c0,
        adapterType: _0x1fa4b1,
        modelId: _0x1da55a,
      }),
    payload: _0x4d7bfd,
    cancellable: _0xc795de === undefined ? _0x3fa9b7 : _0xc795de === !![],
    resumable: _0x3568ba === undefined ? _0x3fa9b7 || _0x5270c8 : _0x3568ba === !![],
    async: _0x5270c8,
    capabilities: {
      async: _0x5270c8,
      cancellable: _0xc795de === undefined ? _0x3fa9b7 : _0xc795de === !![],
      resumable: _0x3568ba === undefined ? _0x3fa9b7 || _0x5270c8 : _0x3568ba === !![],
    },
  };
}
function createGenerationLifecyclePlan(_0x4fd4bc, _0x3afbf9 = {}) {
  const _0x247ded = createGenerationExecutionPlan(_0x3afbf9);
  return { ..._0x247ded, lifecycle: String(_0x4fd4bc || 'submit') };
}
export function createGenerationSubmitPlan(_0x4b51d4 = {}) {
  return createGenerationLifecyclePlan('submit', _0x4b51d4);
}
export function createGenerationResumePlan(_0xa11f91 = {}) {
  return createGenerationLifecyclePlan('resume', { resumable: !![], ..._0xa11f91 });
}
export function createGenerationCancelPlan(_0x3d8f0c = {}) {
  return createGenerationLifecyclePlan('cancel', { cancellable: !![], ..._0x3d8f0c });
}
function createGenerationPlanFromNode(_0x553059, _0x1105fa = {}) {
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
      ..._0x114cb1
    } = _0x1105fa || {},
    _0x500cc9 = resolveGenerationTaskIdentity({
      kind: _0x114cb1['kind'],
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
    _0x1be8fa = {
      ..._0x114cb1,
      provider: _0x500cc9['provider'],
      adapterType: _0x500cc9['adapterType'],
      modelId: _0x500cc9['modelId'],
      executionId: _0x500cc9['executionId'],
      payload: payload,
      taskId: _0x500cc9['taskId'],
      startedAt: _0x500cc9['startedAt'],
      taskProtocol: _0x500cc9['protocol'],
      async: _0x500cc9['async'],
    };
  if (_0x553059 === 'resume') return createGenerationResumePlan(_0x1be8fa);
  if (_0x553059 === 'cancel') return createGenerationCancelPlan(_0x1be8fa);
  return createGenerationSubmitPlan(_0x1be8fa);
}
export function createGenerationSubmitPlanFromNode(_0x48929d = {}) {
  return createGenerationPlanFromNode('submit', _0x48929d);
}
export function createGenerationResumePlanFromNode(_0x566390 = {}) {
  return createGenerationPlanFromNode('resume', _0x566390);
}
export function createGenerationCancelPlanFromNode(_0x3feebb = {}) {
  return createGenerationPlanFromNode('cancel', _0x3feebb);
}
