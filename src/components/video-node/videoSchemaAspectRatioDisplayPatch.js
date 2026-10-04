import {
  GENERATION_MANUAL_DISPLAY_SIZE_FIELD,
  applyImageSchemaRatioResizeAnimation,
  buildImageSchemaAspectRatioDisplayPatch,
} from '../shared/generationDisplayPolicy.js';
import { getPlainGenerationParams } from './runningHubVideoUiSchema.js';
export const VIDEO_DISPLAY_RATIO_RESULT_FIELDS = Object['freeze']([
  'videos',
  'localPath',
  'thumbUrl',
  'videoUrl',
  'src',
]);
function findUiSchemaFieldById(list = [], value = '') {
  const enabled = String(value || '')['trim']();
  if (!enabled) return null;
  return list['find']((item) => String(item?.['id'] || '')['trim']() === enabled) || null;
}
function isAspectRatioSchemaField(key, index) {
  const result = String(key || '')['trim']();
  return result === 'aspectRatio' || String(index?.['displayRole'] || '')['trim']() === 'aspectRatio';
}
function resolveSchemaPatchRatioValue({
  fieldId: fieldId = '',
  value: value2,
  schemaPatch: schemaPatch = {},
} = {}) {
  const data = String(fieldId || '')['trim'](),
    plainGenerationParams = getPlainGenerationParams(schemaPatch?.['generationParams']);
  if (data && Object['prototype']['hasOwnProperty']['call'](plainGenerationParams, data))
    return plainGenerationParams[data];
  if (Object['prototype']['hasOwnProperty']['call'](plainGenerationParams, 'aspectRatio'))
    return plainGenerationParams['aspectRatio'];
  return value2;
}
export function buildVideoSchemaAspectRatioDisplayPatch({
  owner: owner,
  store: store,
  nodeId: nodeId = '',
  latestNodeData: latestNodeData = {},
  fallbackNodeData: fallbackNodeData = {},
  resolved: resolved,
  fieldId: fieldId = '',
  value: value3,
  schemaPatch: schemaPatch = {},
  adapterType: adapterType = '',
  minSide: minSide,
  previewEl: previewEl,
  resultMediaElement: resultMediaElement,
} = {}) {
  const fieldId2 = String(fieldId || '')['trim'](),
    enabled2 = String(adapterType || '')['trim']();
  if (!fieldId2 || !enabled2) return {};
  if (
    resolved?.['modelManifest']?.['kind'] !== 'video' ||
    resolved?.['modelManifest']?.['adapterType'] !== enabled2 ||
    resolved?.['executionManifest']?.['adapterType'] !== enabled2
  )
    return {};
  const options = Array['isArray'](resolved?.['modelManifest']?.['uiSchema']?.['fields'])
      ? resolved['modelManifest']['uiSchema']['fields']
      : [],
    uiSchemaFieldById = findUiSchemaFieldById(options, fieldId2);
  if (!isAspectRatioSchemaField(fieldId2, uiSchemaFieldById)) return {};
  const ratioValue = String(
    resolveSchemaPatchRatioValue({ fieldId: fieldId2, value: value3, schemaPatch: schemaPatch }) || '',
  )['trim']();
  if (!ratioValue) return {};
  const patch = buildImageSchemaAspectRatioDisplayPatch({
    store: store,
    nodeId: nodeId,
    nodeData: latestNodeData,
    fallbackNodeData: fallbackNodeData,
    ratioValue: ratioValue,
    minSide: minSide,
    inputKinds: ['image', 'video'],
    resultMediaElement: resultMediaElement,
    resultFields: VIDEO_DISPLAY_RATIO_RESULT_FIELDS,
  });
  return (
    applyImageSchemaRatioResizeAnimation(owner, {
      nodeId: nodeId,
      previewEl: previewEl,
      nodeData: latestNodeData,
      patch: patch,
    }),
    { [GENERATION_MANUAL_DISPLAY_SIZE_FIELD]: ![], aspectRatio: ratioValue, ...patch }
  );
}
