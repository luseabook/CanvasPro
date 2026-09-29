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
function findUiSchemaFieldById(_0x134f41 = [], _0x4391e5 = '') {
  const _0x570556 = String(_0x4391e5 || '')['trim']();
  if (!_0x570556) return null;
  return _0x134f41['find']((_0x1912c3) => String(_0x1912c3?.['id'] || '')['trim']() === _0x570556) || null;
}
function isAspectRatioSchemaField(_0x39fb91, _0x3bad99) {
  const _0x307cd7 = String(_0x39fb91 || '')['trim']();
  return _0x307cd7 === 'aspectRatio' || String(_0x3bad99?.['displayRole'] || '')['trim']() === 'aspectRatio';
}
function resolveSchemaPatchRatioValue({
  fieldId: fieldId = '',
  value: _0x7b7e68,
  schemaPatch: schemaPatch = {},
} = {}) {
  const _0x443fa4 = String(fieldId || '')['trim'](),
    _0x30a3e1 = getPlainGenerationParams(schemaPatch?.['generationParams']);
  if (_0x443fa4 && Object['prototype']['hasOwnProperty']['call'](_0x30a3e1, _0x443fa4))
    return _0x30a3e1[_0x443fa4];
  if (Object['prototype']['hasOwnProperty']['call'](_0x30a3e1, 'aspectRatio'))
    return _0x30a3e1['aspectRatio'];
  return _0x7b7e68;
}
export function buildVideoSchemaAspectRatioDisplayPatch({
  owner: _0x3d3ad2,
  store: _0x4fe39e,
  nodeId: nodeId = '',
  latestNodeData: latestNodeData = {},
  fallbackNodeData: fallbackNodeData = {},
  resolved: _0x35279d,
  fieldId: fieldId = '',
  value: _0x5f2d6a,
  schemaPatch: schemaPatch = {},
  adapterType: adapterType = '',
  minSide: _0x3ff188,
  previewEl: _0x36fbd4,
  resultMediaElement: _0xf8edff,
} = {}) {
  const _0x4733be = String(fieldId || '')['trim'](),
    _0x5541fa = String(adapterType || '')['trim']();
  if (!_0x4733be || !_0x5541fa) return {};
  if (
    _0x35279d?.['modelManifest']?.['kind'] !== 'video' ||
    _0x35279d?.['modelManifest']?.['adapterType'] !== _0x5541fa ||
    _0x35279d?.['executionManifest']?.['adapterType'] !== _0x5541fa
  )
    return {};
  const _0x18bf9b = Array['isArray'](_0x35279d?.['modelManifest']?.['uiSchema']?.['fields'])
      ? _0x35279d['modelManifest']['uiSchema']['fields']
      : [],
    _0x34b322 = findUiSchemaFieldById(_0x18bf9b, _0x4733be);
  if (!isAspectRatioSchemaField(_0x4733be, _0x34b322)) return {};
  const _0x54990e = String(
    resolveSchemaPatchRatioValue({ fieldId: _0x4733be, value: _0x5f2d6a, schemaPatch: schemaPatch }) || '',
  )['trim']();
  if (!_0x54990e) return {};
  const _0x3db5bd = buildImageSchemaAspectRatioDisplayPatch({
    store: _0x4fe39e,
    nodeId: nodeId,
    nodeData: latestNodeData,
    fallbackNodeData: fallbackNodeData,
    ratioValue: _0x54990e,
    minSide: _0x3ff188,
    inputKinds: ['image', 'video'],
    resultMediaElement: _0xf8edff,
    resultFields: VIDEO_DISPLAY_RATIO_RESULT_FIELDS,
  });
  return (
    applyImageSchemaRatioResizeAnimation(_0x3d3ad2, {
      nodeId: nodeId,
      previewEl: _0x36fbd4,
      nodeData: latestNodeData,
      patch: _0x3db5bd,
    }),
    { [GENERATION_MANUAL_DISPLAY_SIZE_FIELD]: ![], aspectRatio: _0x54990e, ..._0x3db5bd }
  );
}
