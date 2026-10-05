import { resolveModelProvider, sanitizeModelUiSchemaParams } from '../../manifests/index.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function normalizeCharacterAssetImageGenerationParams(item, key = {}) {
  const sanitizeModelUiSchemaParams2 = sanitizeModelUiSchemaParams(item, key, { includeDefaults: !![] });
  return (
    Object['prototype']['hasOwnProperty']['call'](sanitizeModelUiSchemaParams2, 'batchSize') &&
      (sanitizeModelUiSchemaParams2['batchSize'] = 1),
    sanitizeModelUiSchemaParams2
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
  const model = normalizeText(modelId),
    generationParams2 = normalizeCharacterAssetImageGenerationParams(model, generationParams);
  return {
    model: model,
    provider: resolveModelProvider(model, provider),
    ...(normalizeText(providerProfileId) ? { providerProfileId: normalizeText(providerProfileId) } : {}),
    prompt: normalizeText(prompt),
    inputUrls: [
      ...new Set(
        (Array['isArray'](referenceImageUrls) ? referenceImageUrls : [])
          ['map'](normalizeText)
          ['filter'](Boolean),
      ),
    ],
    generationParams: generationParams2,
    aspectRatio: generationParams2['aspectRatio'] || '1:1',
    imageSize: generationParams2['imageSize'] || '2K',
    batchSize: 1,
  };
}
