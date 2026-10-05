const ADAPTER_TYPES = new Set(['workflow', 'modelApi', 'localRuntime']),
  KINDS = new Set(['image', 'video', 'audio', 'text']);
function normalizeText(value, item = '') {
  const key = String(value ?? '')['trim']();
  return key || item;
}
function normalizeKind(index) {
  const text = normalizeText(index);
  return KINDS['has'](text) ? text : 'image';
}
function clonePlainData(result) {
  if (result === undefined || result === null) return result;
  return JSON['parse'](JSON['stringify'](result));
}
function toSlug(data) {
  const text2 = normalizeText(data)
    ['toLowerCase']()
    ['replace'](/[^a-z0-9]+/g, '-')
    ['replace'](/^-+|-+$/g, '');
  return text2 || 'draft';
}
function hasWorkflowShape(options = {}) {
  return Boolean(
    options['workflowId'] ||
    options['appId'] ||
    options['mapping']?.['nodeInfoList'] ||
    options['nodeInfoList'],
  );
}
function hasModelApiShape(options2 = {}) {
  return Boolean(options2['endpoint'] || options2['apiModel'] || options2['modelToken']);
}
export function inferManifestDraftAdapterType(options3 = {}) {
  const text3 = normalizeText(options3['adapterType']);
  if (text3) {
    if (!ADAPTER_TYPES['has'](text3)) throw new Error('Unsupported manifest draft adapterType: ' + text3);
    return text3;
  }
  if (hasWorkflowShape(options3)) return 'workflow';
  if (hasModelApiShape(options3)) return 'modelApi';
  throw new Error('Unable to infer manifest draft adapterType');
}
function buildExecutionId({
  source: source,
  provider: provider,
  kind: kind,
  adapterType: adapterType,
  modelId: modelId,
}) {
  const text4 = normalizeText(source['executionId']);
  if (text4) return text4;
  return provider + '.' + adapterType + '.' + kind + '.' + toSlug(modelId) + '.v1';
}
function buildSourceId(target, next) {
  return normalizeText(target['sourceId'], 'manifest-draft:' + next);
}
function buildUiSchema(options4 = {}) {
  if (options4['uiSchema']) return options4['uiSchema'];
  return { fields: Array['isArray'](options4['uiFields']) ? options4['uiFields'] : [] };
}
function buildInputSlots(options5 = {}) {
  if (options5['inputSlots']) return options5['inputSlots'];
  return { maxByKind: { image: 0, video: 0, audio: 0 } };
}
function buildOutputType(options6 = {}, current) {
  return normalizeText(options6['outputType'] || options6['result']?.['outputType'], current);
}
function buildWorkflowExecutionManifest({
  source: source2,
  provider: provider2,
  kind: kind2,
  executionId: executionId,
  outputType: outputType2,
}) {
  const mapping =
    source2['mapping'] ||
    (Array['isArray'](source2['nodeInfoList']) ? { nodeInfoList: source2['nodeInfoList'] } : {});
  return {
    schemaVersion: normalizeText(source2['schemaVersion'], '1.0'),
    id: executionId,
    provider: provider2,
    kind: kind2,
    adapterType: 'workflow',
    ...(source2['workflowId'] ? { workflowId: String(source2['workflowId']) } : {}),
    ...(source2['appId'] ? { appId: String(source2['appId']) } : {}),
    submitMode: normalizeText(
      source2['submitMode'],
      source2['appId'] ? 'openapi-v2-ai-app' : 'runninghub-task-create',
    ),
    queryMode: normalizeText(
      source2['queryMode'],
      source2['appId'] ? 'openapi-v2-query' : 'runninghubwf-query',
    ),
    mapping: mapping,
    result: source2['result'] || {
      outputType: outputType2,
      taskIdPath: 'taskId',
      paths: Array['isArray'](source2['resultPaths']) ? source2['resultPaths'] : [],
    },
    ...(source2['instanceType'] ? { instanceType: source2['instanceType'] } : {}),
    ...(source2['executionExtensions'] || source2['extensions']
      ? { extensions: source2['executionExtensions'] || source2['extensions'] }
      : {}),
    ...(source2['validation'] ? { validation: source2['validation'] } : {}),
    ...(source2['capabilities'] ? { capabilities: clonePlainData(source2['capabilities']) } : {}),
  };
}
function buildModelApiExecutionManifest({
  source: source3,
  provider: provider3,
  kind: kind3,
  executionId: executionId2,
  outputType: outputType3,
}) {
  const responseMapping =
    source3['responseMapping'] ||
    (Array['isArray'](source3['resultPaths']) ? { paths: source3['resultPaths'] } : {});
  return {
    schemaVersion: normalizeText(source3['schemaVersion'], '1.0'),
    id: executionId2,
    provider: provider3,
    kind: kind3,
    adapterType: 'modelApi',
    endpoint: source3['endpoint'],
    method: normalizeText(source3['method'], 'POST'),
    model: source3['apiModel'] || source3['modelToken'] || source3['model'],
    ...(source3['endpointMode'] ? { endpointMode: source3['endpointMode'] } : {}),
    ...(source3['modeModels'] ? { modeModels: source3['modeModels'] } : {}),
    ...(source3['routeModels'] ? { routeModels: source3['routeModels'] } : {}),
    ...(source3['imageSizeModels'] ? { imageSizeModels: source3['imageSizeModels'] } : {}),
    ...(source3['headers'] ? { headers: source3['headers'] } : {}),
    bodyMapping: Array['isArray'](source3['bodyMapping']) ? source3['bodyMapping'] : [],
    responseMapping: responseMapping,
    result: source3['result'] || { outputType: outputType3, paths: responseMapping['paths'] || [] },
    ...(source3['executionExtensions'] || source3['extensions']
      ? { extensions: source3['executionExtensions'] || source3['extensions'] }
      : {}),
    ...(source3['validation'] ? { validation: source3['validation'] } : {}),
    ...(source3['capabilities'] ? { capabilities: clonePlainData(source3['capabilities']) } : {}),
  };
}
export function buildManifestDraftBundle(source4 = {}) {
  if (!source4 || typeof source4 !== 'object' || Array['isArray'](source4))
    throw new TypeError('Manifest draft source must be an object');
  const adapterType2 = inferManifestDraftAdapterType(source4),
    kind4 = normalizeKind(source4['kind']),
    provider4 = normalizeText(source4['provider'], adapterType2 === 'workflow' ? 'runninghubwf' : ''),
    modelId2 = normalizeText(source4['modelId']);
  if (!modelId2) throw new Error('Manifest draft source missing modelId');
  if (!provider4) throw new Error('Manifest draft source missing provider');
  const outputType4 = buildOutputType(source4, kind4),
    executionId3 = buildExecutionId({
      source: source4,
      provider: provider4,
      kind: kind4,
      adapterType: adapterType2,
      modelId: modelId2,
    }),
    entry = {
      schemaVersion: normalizeText(source4['schemaVersion'], '1.0'),
      modelId: modelId2,
      provider: provider4,
      kind: kind4,
      adapterType: adapterType2,
      executionId: executionId3,
      displayName: normalizeText(source4['displayName'], modelId2),
      uiSchema: buildUiSchema(source4),
      inputSlots: buildInputSlots(source4),
      outputType: outputType4,
      async: source4['async'] ?? adapterType2 === 'workflow',
      cancellable: source4['cancellable'] ?? adapterType2 === 'workflow',
      ...(source4['aliases'] ? { aliases: source4['aliases'] } : {}),
      ...(source4['description'] ? { description: source4['description'] } : {}),
      ...(source4['icon'] ? { icon: source4['icon'] } : {}),
      ...(source4['vip'] !== undefined ? { vip: source4['vip'] } : {}),
      ...(source4['help'] ? { help: clonePlainData(source4['help']) } : {}),
      ...(source4['prompt'] ? { prompt: source4['prompt'] } : {}),
      ...(source4['capabilities'] ? { capabilities: clonePlainData(source4['capabilities']) } : {}),
      ...(source4['modelExtensions'] ? { extensions: source4['modelExtensions'] } : {}),
    },
    record =
      adapterType2 === 'workflow'
        ? buildWorkflowExecutionManifest({
            source: source4,
            provider: provider4,
            kind: kind4,
            executionId: executionId3,
            outputType: outputType4,
          })
        : buildModelApiExecutionManifest({
            source: source4,
            provider: provider4,
            kind: kind4,
            executionId: executionId3,
            outputType: outputType4,
          });
  return { sourceId: buildSourceId(source4, modelId2), executions: [record], models: [entry] };
}
