import { getModelManifest } from '../../manifests/index.js';
import {
  GENERATION_MANUAL_DISPLAY_SIZE_FIELD,
  buildGenerationModelSelectionDisplayPatch,
} from '../../components/shared/generationDisplayPolicy.js';
function getAspectRatioField(_0x3ef845 = {}) {
  const _0x36e5ac = Array['isArray'](_0x3ef845?.['uiSchema']?.['fields'])
    ? _0x3ef845['uiSchema']['fields']
    : [];
  return (
    _0x36e5ac['find']((_0x59b96a) => {
      const _0x1168db = String(_0x59b96a?.['id'] || '')['trim'](),
        _0x399d03 = String(_0x59b96a?.['displayRole'] || '')['trim']();
      return _0x1168db === 'aspectRatio' || _0x399d03 === 'aspectRatio';
    }) || null
  );
}
function normalizeRatioValue(_0x2a7429) {
  return String(_0x2a7429 ?? '')
    ['trim']()
    ['replace'](/[：∶﹕]/g, ':')
    ['replace'](/\s+/g, '')
    ['toLowerCase']();
}
export function buildGenerationParamDisplayPatch({
  store: _0x36759b,
  nodeId: nodeId = '',
  nodeData: nodeData = {},
  modelId: modelId = '',
  generationParams: generationParams = {},
  changedParamIds: changedParamIds = [],
  force: force = ![],
  respectManualDisplaySize: respectManualDisplaySize = !![],
} = {}) {
  const _0x55e54f = getModelManifest(modelId),
    _0x16e30b = getAspectRatioField(_0x55e54f),
    _0x1d3beb = String(_0x16e30b?.['id'] || '')['trim']();
  if (!_0x1d3beb) return {};
  const _0x2f2bc4 = new Set(
      (Array['isArray'](changedParamIds) ? changedParamIds : [])
        ['map']((_0x2c4987) => String(_0x2c4987 || '')['trim']())
        ['filter'](Boolean),
    ),
    _0x48716a = _0x2f2bc4['has'](_0x1d3beb),
    _0x458031 = generationParams?.[_0x1d3beb],
    _0x1b81af = nodeData?.['aspectRatio'],
    _0xf88987 = _0x458031 !== undefined && normalizeRatioValue(_0x458031) !== normalizeRatioValue(_0x1b81af);
  if (!force && !_0x48716a && !_0xf88987) return {};
  const _0x3b1332 =
      String(_0x55e54f?.['kind'] || '')['trim']() === 'video' ||
      String(nodeData?.['type'] || '')['trim']() === 'ai-video',
    _0x3d54fb = _0x48716a,
    _0x307aaf = buildGenerationModelSelectionDisplayPatch({
      store: _0x36759b,
      nodeId: nodeId,
      nodeData: nodeData,
      modelId: modelId,
      generationParams: generationParams,
      inputKinds: _0x3b1332 ? ['image', 'video'] : ['image'],
      resultFields: _0x3b1332 ? ['videos', 'localPath', 'thumbUrl', 'videoUrl', 'src'] : undefined,
      mediaSelector: _0x3b1332 ? 'video, img' : undefined,
      respectManualDisplaySize: _0x48716a ? ![] : respectManualDisplaySize,
    });
  return { ...(_0x3d54fb ? { [GENERATION_MANUAL_DISPLAY_SIZE_FIELD]: ![] } : {}), ..._0x307aaf };
}
