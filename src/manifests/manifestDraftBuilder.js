const ADAPTER_TYPES = new Set(['workflow', 'modelApi', 'localRuntime']),
  KINDS = new Set(['image', 'video', 'audio', 'text']);
function normalizeText(_0x25c198, _0x1da09b = '') {
  const _0x207b5f = String(_0x25c198 ?? '')['trim']();
  return _0x207b5f || _0x1da09b;
}
function normalizeKind(_0x2e503d) {
  const _0x278cf0 = normalizeText(_0x2e503d);
  return KINDS['has'](_0x278cf0) ? _0x278cf0 : 'image';
}
function clonePlainData(_0x55d8f2) {
  if (_0x55d8f2 === undefined || _0x55d8f2 === null) return _0x55d8f2;
  return JSON['parse'](JSON['stringify'](_0x55d8f2));
}
function toSlug(_0x2ef0a3) {
  const _0x2655ac = normalizeText(_0x2ef0a3)
    ['toLowerCase']()
    ['replace'](/[^a-z0-9]+/g, '-')
    ['replace'](/^-+|-+$/g, '');
  return _0x2655ac || 'draft';
}
function hasWorkflowShape(_0x5bf140 = {}) {
  return Boolean(
    _0x5bf140['workflowId'] ||
    _0x5bf140['appId'] ||
    _0x5bf140['mapping']?.['nodeInfoList'] ||
    _0x5bf140['nodeInfoList'],
  );
}
function hasModelApiShape(_0x38fb58 = {}) {
  return Boolean(_0x38fb58['endpoint'] || _0x38fb58['apiModel'] || _0x38fb58['modelToken']);
}
export function inferManifestDraftAdapterType(_0x94a5d6 = {}) {
  const _0x55d083 = normalizeText(_0x94a5d6['adapterType']);
  if (_0x55d083) {
    if (!ADAPTER_TYPES['has'](_0x55d083))
      throw new Error('Unsupported manifest draft adapterType: ' + _0x55d083);
    return _0x55d083;
  }
  if (hasWorkflowShape(_0x94a5d6)) return 'workflow';
  if (hasModelApiShape(_0x94a5d6)) return 'modelApi';
  throw new Error('Unable\x20to\x20infer\x20manifest\x20draft\x20adapterType');
}
function buildExecutionId({
  source: _0x3553e0,
  provider: _0x449eaf,
  kind: _0x574421,
  adapterType: _0x4d23e1,
  modelId: _0x2ebb5c,
}) {
  const _0x4ce2dc = normalizeText(_0x3553e0['executionId']);
  if (_0x4ce2dc) return _0x4ce2dc;
  return _0x449eaf + '.' + _0x4d23e1 + '.' + _0x574421 + '.' + toSlug(_0x2ebb5c) + '.v1';
}
function buildSourceId(_0x5c8f50, _0x132659) {
  return normalizeText(_0x5c8f50['sourceId'], 'manifest-draft:' + _0x132659);
}
function buildUiSchema(_0x1e1be5 = {}) {
  if (_0x1e1be5['uiSchema']) return _0x1e1be5['uiSchema'];
  return { fields: Array['isArray'](_0x1e1be5['uiFields']) ? _0x1e1be5['uiFields'] : [] };
}
function buildInputSlots(_0x23ecf6 = {}) {
  if (_0x23ecf6['inputSlots']) return _0x23ecf6['inputSlots'];
  return { maxByKind: { image: 0x0, video: 0x0, audio: 0x0 } };
}
function buildOutputType(_0x73bb70 = {}, _0x55ba72) {
  return normalizeText(_0x73bb70['outputType'] || _0x73bb70['result']?.['outputType'], _0x55ba72);
}
function buildWorkflowExecutionManifest({
  source: _0x5e41bd,
  provider: _0x17ea20,
  kind: _0x359b84,
  executionId: _0x422a0d,
  outputType: _0xfa5ef7,
}) {
  const _0x87d78d =
    _0x5e41bd['mapping'] ||
    (Array['isArray'](_0x5e41bd['nodeInfoList']) ? { nodeInfoList: _0x5e41bd['nodeInfoList'] } : {});
  return {
    schemaVersion: normalizeText(_0x5e41bd['schemaVersion'], '1.0'),
    id: _0x422a0d,
    provider: _0x17ea20,
    kind: _0x359b84,
    adapterType: 'workflow',
    ...(_0x5e41bd['workflowId'] ? { workflowId: String(_0x5e41bd['workflowId']) } : {}),
    ...(_0x5e41bd['appId'] ? { appId: String(_0x5e41bd['appId']) } : {}),
    submitMode: normalizeText(
      _0x5e41bd['submitMode'],
      _0x5e41bd['appId'] ? 'openapi-v2-ai-app' : 'runninghub-task-create',
    ),
    queryMode: normalizeText(
      _0x5e41bd['queryMode'],
      _0x5e41bd['appId'] ? 'openapi-v2-query' : 'runninghubwf-query',
    ),
    mapping: _0x87d78d,
    result: _0x5e41bd['result'] || {
      outputType: _0xfa5ef7,
      taskIdPath: 'taskId',
      paths: Array['isArray'](_0x5e41bd['resultPaths']) ? _0x5e41bd['resultPaths'] : [],
    },
    ...(_0x5e41bd['instanceType'] ? { instanceType: _0x5e41bd['instanceType'] } : {}),
    ...(_0x5e41bd['executionExtensions'] || _0x5e41bd['extensions']
      ? { extensions: _0x5e41bd['executionExtensions'] || _0x5e41bd['extensions'] }
      : {}),
    ...(_0x5e41bd['validation'] ? { validation: _0x5e41bd['validation'] } : {}),
    ...(_0x5e41bd['capabilities'] ? { capabilities: clonePlainData(_0x5e41bd['capabilities']) } : {}),
  };
}
function buildModelApiExecutionManifest({
  source: _0xa8977d,
  provider: _0x39ce80,
  kind: _0x4a3696,
  executionId: _0x540077,
  outputType: _0x4cb94f,
}) {
  const _0x24c369 =
    _0xa8977d['responseMapping'] ||
    (Array['isArray'](_0xa8977d['resultPaths']) ? { paths: _0xa8977d['resultPaths'] } : {});
  return {
    schemaVersion: normalizeText(_0xa8977d['schemaVersion'], '1.0'),
    id: _0x540077,
    provider: _0x39ce80,
    kind: _0x4a3696,
    adapterType: 'modelApi',
    endpoint: _0xa8977d['endpoint'],
    method: normalizeText(_0xa8977d['method'], 'POST'),
    model: _0xa8977d['apiModel'] || _0xa8977d['modelToken'] || _0xa8977d['model'],
    ...(_0xa8977d['endpointMode'] ? { endpointMode: _0xa8977d['endpointMode'] } : {}),
    ...(_0xa8977d['modeModels'] ? { modeModels: _0xa8977d['modeModels'] } : {}),
    ...(_0xa8977d['routeModels'] ? { routeModels: _0xa8977d['routeModels'] } : {}),
    ...(_0xa8977d['imageSizeModels'] ? { imageSizeModels: _0xa8977d['imageSizeModels'] } : {}),
    ...(_0xa8977d['headers'] ? { headers: _0xa8977d['headers'] } : {}),
    bodyMapping: Array['isArray'](_0xa8977d['bodyMapping']) ? _0xa8977d['bodyMapping'] : [],
    responseMapping: _0x24c369,
    result: _0xa8977d['result'] || { outputType: _0x4cb94f, paths: _0x24c369['paths'] || [] },
    ...(_0xa8977d['executionExtensions'] || _0xa8977d['extensions']
      ? { extensions: _0xa8977d['executionExtensions'] || _0xa8977d['extensions'] }
      : {}),
    ...(_0xa8977d['validation'] ? { validation: _0xa8977d['validation'] } : {}),
    ...(_0xa8977d['capabilities'] ? { capabilities: clonePlainData(_0xa8977d['capabilities']) } : {}),
  };
}
export function buildManifestDraftBundle(_0x19d151 = {}) {
  if (!_0x19d151 || typeof _0x19d151 !== 'object' || Array['isArray'](_0x19d151))
    throw new TypeError('Manifest draft source must be an object');
  const _0x4f85e8 = inferManifestDraftAdapterType(_0x19d151),
    _0x213f2e = normalizeKind(_0x19d151['kind']),
    _0x1edd26 = normalizeText(_0x19d151['provider'], _0x4f85e8 === 'workflow' ? 'runninghubwf' : ''),
    _0x3aa51e = normalizeText(_0x19d151['modelId']);
  if (!_0x3aa51e) throw new Error('Manifest\x20draft\x20source\x20missing\x20modelId');
  if (!_0x1edd26) throw new Error('Manifest draft source missing provider');
  const _0x10ca01 = buildOutputType(_0x19d151, _0x213f2e),
    _0x374549 = buildExecutionId({
      source: _0x19d151,
      provider: _0x1edd26,
      kind: _0x213f2e,
      adapterType: _0x4f85e8,
      modelId: _0x3aa51e,
    }),
    _0x2cdad6 = {
      schemaVersion: normalizeText(_0x19d151['schemaVersion'], '1.0'),
      modelId: _0x3aa51e,
      provider: _0x1edd26,
      kind: _0x213f2e,
      adapterType: _0x4f85e8,
      executionId: _0x374549,
      displayName: normalizeText(_0x19d151['displayName'], _0x3aa51e),
      uiSchema: buildUiSchema(_0x19d151),
      inputSlots: buildInputSlots(_0x19d151),
      outputType: _0x10ca01,
      async: _0x19d151['async'] ?? _0x4f85e8 === 'workflow',
      cancellable: _0x19d151['cancellable'] ?? _0x4f85e8 === 'workflow',
      ...(_0x19d151['aliases'] ? { aliases: _0x19d151['aliases'] } : {}),
      ...(_0x19d151['description'] ? { description: _0x19d151['description'] } : {}),
      ...(_0x19d151['icon'] ? { icon: _0x19d151['icon'] } : {}),
      ...(_0x19d151['vip'] !== undefined ? { vip: _0x19d151['vip'] } : {}),
      ...(_0x19d151['help'] ? { help: clonePlainData(_0x19d151['help']) } : {}),
      ...(_0x19d151['prompt'] ? { prompt: _0x19d151['prompt'] } : {}),
      ...(_0x19d151['capabilities'] ? { capabilities: clonePlainData(_0x19d151['capabilities']) } : {}),
      ...(_0x19d151['modelExtensions'] ? { extensions: _0x19d151['modelExtensions'] } : {}),
    },
    _0x45d437 =
      _0x4f85e8 === 'workflow'
        ? buildWorkflowExecutionManifest({
            source: _0x19d151,
            provider: _0x1edd26,
            kind: _0x213f2e,
            executionId: _0x374549,
            outputType: _0x10ca01,
          })
        : buildModelApiExecutionManifest({
            source: _0x19d151,
            provider: _0x1edd26,
            kind: _0x213f2e,
            executionId: _0x374549,
            outputType: _0x10ca01,
          });
  return { sourceId: buildSourceId(_0x19d151, _0x3aa51e), executions: [_0x45d437], models: [_0x2cdad6] };
}
