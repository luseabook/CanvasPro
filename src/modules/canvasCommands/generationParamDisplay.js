import { getModelManifest } from '../../manifests/index.js';
import {
  GENERATION_MANUAL_DISPLAY_SIZE_FIELD,
  buildGenerationModelSelectionDisplayPatch,
} from '../../components/shared/generationDisplayPolicy.js';
function getAspectRatioField(options = {}) {
  const list = Array['isArray'](options?.['uiSchema']?.['fields']) ? options['uiSchema']['fields'] : [];
  return (
    list['find']((value) => {
      const item = String(value?.['id'] || '')['trim'](),
        key = String(value?.['displayRole'] || '')['trim']();
      return item === 'aspectRatio' || key === 'aspectRatio';
    }) || null
  );
}
function normalizeRatioValue(index) {
  return String(index ?? '')
    ['trim']()
    ['replace'](/[：∶﹕]/g, ':')
    ['replace'](/\s+/g, '')
    ['toLowerCase']();
}
export function buildGenerationParamDisplayPatch({
  store: store,
  nodeId: nodeId = '',
  nodeData: nodeData = {},
  modelId: modelId = '',
  generationParams: generationParams = {},
  changedParamIds: changedParamIds = [],
  force: force = false,
  respectManualDisplaySize: respectManualDisplaySize = true,
} = {}) {
  const modelManifest = getModelManifest(modelId),
    aspectRatioField = getAspectRatioField(modelManifest),
    enabled = String(aspectRatioField?.['id'] || '')['trim']();
  if (!enabled) return {};
  const map = new Set(
      (Array['isArray'](changedParamIds) ? changedParamIds : [])
        ['map']((result) => String(result || '')['trim']())
        ['filter'](Boolean),
    ),
    respectManualDisplaySize2 = map['has'](enabled),
    data = generationParams?.[enabled],
    target = nodeData?.['aspectRatio'],
    enabled2 = data !== undefined && normalizeRatioValue(data) !== normalizeRatioValue(target);
  if (!force && !respectManualDisplaySize2 && !enabled2) return {};
  const inputKinds =
      String(modelManifest?.['kind'] || '')['trim']() === 'video' ||
      String(nodeData?.['type'] || '')['trim']() === 'ai-video',
    source = respectManualDisplaySize2,
    args = buildGenerationModelSelectionDisplayPatch({
      store: store,
      nodeId: nodeId,
      nodeData: nodeData,
      modelId: modelId,
      generationParams: generationParams,
      inputKinds: inputKinds ? ['image', 'video'] : ['image'],
      resultFields: inputKinds ? ['videos', 'localPath', 'thumbUrl', 'videoUrl', 'src'] : undefined,
      mediaSelector: inputKinds ? 'video, img' : undefined,
      respectManualDisplaySize: respectManualDisplaySize2 ? false : respectManualDisplaySize,
    });
  return { ...(source ? { [GENERATION_MANUAL_DISPLAY_SIZE_FIELD]: false } : {}), ...args };
}
