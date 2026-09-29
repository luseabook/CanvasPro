import { resolveModelProvider, sanitizeModelUiSchemaParams } from '../../manifests/index.js';
function normalizeText(_0x3358a7) {
  return String(_0x3358a7 ?? '')['trim']();
}
export function normalizeCharacterAssetImageGenerationParams(_0x4da8ce, _0x558f3c = {}) {
  const _0x1dd84a = sanitizeModelUiSchemaParams(_0x4da8ce, _0x558f3c, { includeDefaults: !![] });
  return (
    Object['prototype']['hasOwnProperty']['call'](_0x1dd84a, 'batchSize') && (_0x1dd84a['batchSize'] = 0x1),
    _0x1dd84a
  );
}
export function buildCharacterAssetImageGenerationPayload({
  prompt: prompt = '',
  modelId: modelId = '',
  provider: provider = '',
  providerProfileId: providerProfileId = '',
  generationParams: generationParams = {},
  referenceImageUrls: referenceImageUrls = [],
} = {}) {
  const _0x36911b = normalizeText(modelId),
    _0x11e599 = normalizeCharacterAssetImageGenerationParams(_0x36911b, generationParams);
  return {
    model: _0x36911b,
    provider: resolveModelProvider(_0x36911b, provider),
    ...(normalizeText(providerProfileId) ? { providerProfileId: normalizeText(providerProfileId) } : {}),
    prompt: normalizeText(prompt),
    inputUrls: [
      ...new Set(
        (Array['isArray'](referenceImageUrls) ? referenceImageUrls : [])
          ['map'](normalizeText)
          ['filter'](Boolean),
      ),
    ],
    generationParams: _0x11e599,
    aspectRatio: _0x11e599['aspectRatio'] || '1:1',
    imageSize: _0x11e599['imageSize'] || '2K',
    batchSize: 0x1,
  };
}
