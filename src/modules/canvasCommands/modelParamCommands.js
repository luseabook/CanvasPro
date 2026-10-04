import {
  getModelManifest,
  resolveModelExecution,
  sanitizeModelUiSchemaParams,
} from '../../manifests/index.js';
const MODEL_NODE_KINDS = Object.freeze({
  'ai-text': 'text',
  'ai-image': 'image',
  'ai-video': 'video',
  'ai-audio': 'audio',
  'storyboard-script': 'text',
});
function getState(value) {
  return value.store?.getStateRaw?.() || value.store?.getState?.() || {};
}
function getNode(item, key) {
  const index = String(key || '').trim();
  return index ? getState(item).nodes?.[index] || null : null;
}
function getPlainObject(result) {
  return result && typeof result === 'object' && !Array.isArray(result) ? result : {};
}
function getDeclaredParamIds(data) {
  return new Set(
    (Array.isArray(data?.uiSchema?.fields) ? data.uiSchema.fields : [])
      .map((item2) => String(item2?.id || '').trim())
      .filter(Boolean),
  );
}
function normalizeParamsArgs(el = {}) {
  if (el.params && typeof el.params === 'object' && !Array.isArray(el.params)) return { ...el.params };
  const options = String(el.field || el.param || '').trim();
  if (options) return { [options]: el.value };
  return {};
}
function normalizeModelArgs(preserveParams = {}) {
  return {
    modelId: String(preserveParams.model || preserveParams.modelId || '').trim(),
    providerHint: String(preserveParams.provider || '').trim(),
    preserveParams: preserveParams.resetParams === true ? false : preserveParams.preserveParams !== false,
    params: getPlainObject(preserveParams.params),
  };
}
function validateModelPatchArgs(message, target = {}, source = {}) {
  const nodeId = String(target.nodeId || '').trim();
  if (!nodeId) return { ok: false, errorCode: 'MISSING_NODE_ID', message: message + ' requires nodeId.' };
  const node = getNode(source, nodeId);
  if (!node) return { ok: false, errorCode: 'NODE_NOT_FOUND', message: 'Canvas node not found: ' + nodeId };
  const providerHint = normalizeModelArgs(target);
  if (!providerHint.modelId)
    return { ok: false, errorCode: 'MISSING_MODEL_ID', message: message + ' requires model or modelId.' };
  const modelExecution = resolveModelExecution(providerHint.modelId, {
      providerHint: providerHint.providerHint,
    }),
    modelId = modelExecution?.modelManifest || null;
  if (!modelId)
    return {
      ok: false,
      errorCode: 'MODEL_MANIFEST_NOT_FOUND',
      message: 'Model manifest not found: ' + providerHint.modelId,
    };
  const enabled = MODEL_NODE_KINDS[String(node.type || '').trim()] || '';
  if (!enabled)
    return {
      ok: false,
      errorCode: 'MODEL_UNSUPPORTED_NODE',
      message: 'Canvas node does not support model selection: ' + nodeId,
    };
  if (String(modelId.kind || '') !== enabled)
    return {
      ok: false,
      errorCode: 'MODEL_KIND_MISMATCH',
      message: 'Model ' + modelId.modelId + ' is ' + (modelId.kind || '(unknown)') + ', not ' + enabled + '.',
    };
  const args = providerHint.preserveParams ? getPlainObject(node.generationParams) : {},
    params = sanitizeModelUiSchemaParams(
      modelId.modelId,
      { ...args, ...providerHint.params },
      { includeDefaults: true },
    );
  return {
    args: {
      nodeId: nodeId,
      modelId: modelId.modelId,
      provider: modelId.provider || providerHint.providerHint,
      params: params,
      preserveParams: providerHint.preserveParams,
      changedParamIds: Object.keys(providerHint.params),
    },
  };
}
function executeModelPatch(model, store) {
  return (
    store.store?.updateNodeData?.(model.nodeId, {
      model: model.modelId,
      provider: model.provider,
      generationParams: model.params,
    }),
    store.commit?.(),
    {
      nodeId: model.nodeId,
      modelId: model.modelId,
      model: model.modelId,
      provider: model.provider,
      params: model.params,
      changedParamIds: model.changedParamIds,
    }
  );
}
export function registerModelParamCommands(next) {
  function run(id, description) {
    next.register({
      id: id,
      description: description,
      riskLevel: 'safe',
      argsSchema: {
        required: ['nodeId', 'model'],
        properties: {
          nodeId: { type: 'string' },
          model: { type: 'string' },
          modelId: { type: 'string' },
          provider: { type: 'string' },
          params: { type: 'object' },
          preserveParams: { type: 'boolean' },
          resetParams: { type: 'boolean' },
        },
        defaults: { preserveParams: true, resetParams: false },
      },
      capabilitySchema: { reads: ['nodes', 'modelRegistry'], writes: ['nodes'] },
      returnSchema: { aliasFields: ['nodeId', 'modelId', 'model', 'provider', 'params'] },
      validate(options2 = {}, current = {}) {
        return validateModelPatchArgs(id, options2, current);
      },
      execute: executeModelPatch,
    });
  }
  (run('node.setModel', 'Set a manifest-backed model on a generation node.'),
    run('node.changeModel', 'Change a generation node to another manifest-backed model.'),
    next.register({
      id: 'node.setParams',
      description: 'Set manifest-backed node generation parameters.',
      riskLevel: 'safe',
      argsSchema: {
        required: ['nodeId'],
        properties: {
          nodeId: { type: 'string' },
          params: { type: 'object' },
          field: { type: 'string' },
          param: { type: 'string' },
          value: {},
          modelId: { type: 'string' },
        },
      },
      capabilitySchema: { reads: ['nodes', 'modelRegistry'], writes: ['nodes'] },
      returnSchema: { aliasFields: ['nodeId', 'modelId', 'params', 'changedParamIds'] },
      validate(options3 = {}, entry = {}) {
        const nodeId2 = String(options3.nodeId || '').trim();
        if (!nodeId2)
          return { ok: false, errorCode: 'MISSING_NODE_ID', message: 'node.setParams requires nodeId.' };
        const node2 = getNode(entry, nodeId2);
        if (!node2)
          return { ok: false, errorCode: 'NODE_NOT_FOUND', message: 'Canvas node not found: ' + nodeId2 };
        const modelId2 = String(options3.modelId || node2.model || '').trim();
        if (!modelId2)
          return {
            ok: false,
            errorCode: 'MISSING_MODEL_ID',
            message: 'node.setParams requires a node model backed by a manifest.',
          };
        const modelManifest = getModelManifest(modelId2);
        if (!modelManifest)
          return {
            ok: false,
            errorCode: 'MODEL_MANIFEST_NOT_FOUND',
            message: 'Model manifest not found: ' + modelId2,
          };
        const map = getDeclaredParamIds(modelManifest);
        if (map.size === 0)
          return {
            ok: false,
            errorCode: 'MODEL_PARAMS_UNSUPPORTED',
            message: 'Model has no uiSchema params: ' + modelId2,
          };
        const args2 = normalizeParamsArgs(options3),
          changedParamIds = Object.keys(args2);
        if (changedParamIds.length === 0)
          return {
            ok: false,
            errorCode: 'MISSING_PARAMS',
            message: 'node.setParams requires params or field/value.',
          };
        const unknown = changedParamIds.filter((item3) => !map.has(item3));
        if (unknown.length > 0)
          return {
            ok: false,
            errorCode: 'UNSUPPORTED_MODEL_PARAM',
            message: 'Unsupported model param(s): ' + unknown.join(', '),
            details: { modelId: modelId2, unknown: unknown },
          };
        const args3 = getPlainObject(node2.generationParams),
          record = { ...args3, ...args2 },
          params2 = sanitizeModelUiSchemaParams(modelId2, record, { includeDefaults: false });
        return {
          args: { nodeId: nodeId2, modelId: modelId2, params: params2, changedParamIds: changedParamIds },
        };
      },
      execute(generationParams, store2) {
        return (
          store2.store?.updateNodeData?.(generationParams.nodeId, {
            generationParams: generationParams.params,
          }),
          store2.commit?.(),
          {
            nodeId: generationParams.nodeId,
            modelId: generationParams.modelId,
            params: generationParams.params,
            changedParamIds: generationParams.changedParamIds,
          }
        );
      },
    }));
}
