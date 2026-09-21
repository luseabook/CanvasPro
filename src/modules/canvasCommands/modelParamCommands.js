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
function getState(_0x1c564c) {
  return _0x1c564c.store?.getStateRaw?.() || _0x1c564c.store?.getState?.() || {};
}
function getNode(_0x3f6a0f, _0x47d8c2) {
  const _0x19c1ec = String(_0x47d8c2 || '').trim();
  return _0x19c1ec ? getState(_0x3f6a0f).nodes?.[_0x19c1ec] || null : null;
}
function getPlainObject(_0x1fdcbe) {
  return _0x1fdcbe && typeof _0x1fdcbe === 'object' && !Array.isArray(_0x1fdcbe) ? _0x1fdcbe : {};
}
function getDeclaredParamIds(_0x431f04) {
  return new Set(
    (Array.isArray(_0x431f04?.uiSchema?.fields) ? _0x431f04.uiSchema.fields : [])
      .map((_0x1b24b1) => String(_0x1b24b1?.id || '').trim())
      .filter(Boolean),
  );
}
function normalizeParamsArgs(_0x1f9595 = {}) {
  if (_0x1f9595.params && typeof _0x1f9595.params === 'object' && !Array.isArray(_0x1f9595.params))
    return { ..._0x1f9595.params };
  const _0x41b872 = String(_0x1f9595.field || _0x1f9595.param || '').trim();
  if (_0x41b872) return { [_0x41b872]: _0x1f9595.value };
  return {};
}
function normalizeModelArgs(_0x2b5079 = {}) {
  return {
    modelId: String(_0x2b5079.model || _0x2b5079.modelId || '').trim(),
    providerHint: String(_0x2b5079.provider || '').trim(),
    preserveParams: _0x2b5079.resetParams === true ? false : _0x2b5079.preserveParams !== false,
    params: getPlainObject(_0x2b5079.params),
  };
}
function validateModelPatchArgs(_0x580fc5, _0x26d428 = {}, _0x2bec18 = {}) {
  const _0x5bf746 = String(_0x26d428.nodeId || '').trim();
  if (!_0x5bf746)
    return { ok: false, errorCode: 'MISSING_NODE_ID', message: _0x580fc5 + ' requires nodeId.' };
  const _0x46a2e0 = getNode(_0x2bec18, _0x5bf746);
  if (!_0x46a2e0)
    return { ok: false, errorCode: 'NODE_NOT_FOUND', message: 'Canvas node not found: ' + _0x5bf746 };
  const _0x1bb38d = normalizeModelArgs(_0x26d428);
  if (!_0x1bb38d.modelId)
    return { ok: false, errorCode: 'MISSING_MODEL_ID', message: _0x580fc5 + ' requires model or modelId.' };
  const _0x1e978c = resolveModelExecution(_0x1bb38d.modelId, { providerHint: _0x1bb38d.providerHint }),
    _0x1d3f79 = _0x1e978c?.modelManifest || null;
  if (!_0x1d3f79)
    return {
      ok: false,
      errorCode: 'MODEL_MANIFEST_NOT_FOUND',
      message: 'Model manifest not found: ' + _0x1bb38d.modelId,
    };
  const _0x557ed6 = MODEL_NODE_KINDS[String(_0x46a2e0.type || '').trim()] || '';
  if (!_0x557ed6)
    return {
      ok: false,
      errorCode: 'MODEL_UNSUPPORTED_NODE',
      message: 'Canvas node does not support model selection: ' + _0x5bf746,
    };
  if (String(_0x1d3f79.kind || '') !== _0x557ed6)
    return {
      ok: false,
      errorCode: 'MODEL_KIND_MISMATCH',
      message:
        'Model ' + _0x1d3f79.modelId + ' is ' + (_0x1d3f79.kind || '(unknown)') + ', not ' + _0x557ed6 + '.',
    };
  const _0x1ab86e = _0x1bb38d.preserveParams ? getPlainObject(_0x46a2e0.generationParams) : {},
    _0x3ef0e4 = sanitizeModelUiSchemaParams(
      _0x1d3f79.modelId,
      { ..._0x1ab86e, ..._0x1bb38d.params },
      { includeDefaults: true },
    );
  return {
    args: {
      nodeId: _0x5bf746,
      modelId: _0x1d3f79.modelId,
      provider: _0x1d3f79.provider || _0x1bb38d.providerHint,
      params: _0x3ef0e4,
      preserveParams: _0x1bb38d.preserveParams,
      changedParamIds: Object.keys(_0x1bb38d.params),
    },
  };
}
function executeModelPatch(_0x29eec0, _0x159a56) {
  return (
    _0x159a56.store?.updateNodeData?.(_0x29eec0.nodeId, {
      model: _0x29eec0.modelId,
      provider: _0x29eec0.provider,
      generationParams: _0x29eec0.params,
    }),
    _0x159a56.commit?.(),
    {
      nodeId: _0x29eec0.nodeId,
      modelId: _0x29eec0.modelId,
      model: _0x29eec0.modelId,
      provider: _0x29eec0.provider,
      params: _0x29eec0.params,
      changedParamIds: _0x29eec0.changedParamIds,
    }
  );
}
export function registerModelParamCommands(_0x35e6cd) {
  function _0x4df775(_0xcb6160, _0x405d8a) {
    _0x35e6cd.register({
      id: _0xcb6160,
      description: _0x405d8a,
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
      validate(_0xe0d8cf = {}, _0x1b5e54 = {}) {
        return validateModelPatchArgs(_0xcb6160, _0xe0d8cf, _0x1b5e54);
      },
      execute: executeModelPatch,
    });
  }
  (_0x4df775('node.setModel', 'Set a manifest-backed model on a generation node.'),
    _0x4df775('node.changeModel', 'Change a generation node to another manifest-backed model.'),
    _0x35e6cd.register({
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
      validate(_0x167eee = {}, _0xc7244 = {}) {
        const _0x1cfb9b = String(_0x167eee.nodeId || '').trim();
        if (!_0x1cfb9b)
          return { ok: false, errorCode: 'MISSING_NODE_ID', message: 'node.setParams requires nodeId.' };
        const _0x4b07ed = getNode(_0xc7244, _0x1cfb9b);
        if (!_0x4b07ed)
          return { ok: false, errorCode: 'NODE_NOT_FOUND', message: 'Canvas node not found: ' + _0x1cfb9b };
        const _0x167751 = String(_0x167eee.modelId || _0x4b07ed.model || '').trim();
        if (!_0x167751)
          return {
            ok: false,
            errorCode: 'MISSING_MODEL_ID',
            message: 'node.setParams requires a node model backed by a manifest.',
          };
        const _0x1e4690 = getModelManifest(_0x167751);
        if (!_0x1e4690)
          return {
            ok: false,
            errorCode: 'MODEL_MANIFEST_NOT_FOUND',
            message: 'Model manifest not found: ' + _0x167751,
          };
        const _0x32851d = getDeclaredParamIds(_0x1e4690);
        if (_0x32851d.size === 0)
          return {
            ok: false,
            errorCode: 'MODEL_PARAMS_UNSUPPORTED',
            message: 'Model has no uiSchema params: ' + _0x167751,
          };
        const _0xf92954 = normalizeParamsArgs(_0x167eee),
          _0x122fcf = Object.keys(_0xf92954);
        if (_0x122fcf.length === 0)
          return {
            ok: false,
            errorCode: 'MISSING_PARAMS',
            message: 'node.setParams requires params or field/value.',
          };
        const _0x57b625 = _0x122fcf.filter((_0x5ea5b3) => !_0x32851d.has(_0x5ea5b3));
        if (_0x57b625.length > 0)
          return {
            ok: false,
            errorCode: 'UNSUPPORTED_MODEL_PARAM',
            message: 'Unsupported model param(s): ' + _0x57b625.join(', '),
            details: { modelId: _0x167751, unknown: _0x57b625 },
          };
        const _0x5c8a22 = getPlainObject(_0x4b07ed.generationParams),
          _0x83cfd8 = { ..._0x5c8a22, ..._0xf92954 },
          _0x39e808 = sanitizeModelUiSchemaParams(_0x167751, _0x83cfd8, { includeDefaults: false });
        return {
          args: { nodeId: _0x1cfb9b, modelId: _0x167751, params: _0x39e808, changedParamIds: _0x122fcf },
        };
      },
      execute(_0x16e1cd, _0x5ef073) {
        return (
          _0x5ef073.store?.updateNodeData?.(_0x16e1cd.nodeId, { generationParams: _0x16e1cd.params }),
          _0x5ef073.commit?.(),
          {
            nodeId: _0x16e1cd.nodeId,
            modelId: _0x16e1cd.modelId,
            params: _0x16e1cd.params,
            changedParamIds: _0x16e1cd.changedParamIds,
          }
        );
      },
    }));
}
