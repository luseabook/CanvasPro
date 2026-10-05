import { resolveMappedImageResponseValues, resolveMappedResponseValues } from './modelApiMappingEngine.js';
function normalizeOutputType(value = null, item = null) {
  return String(
    item?.['result']?.['outputType'] || value?.['outputType'] || item?.['kind'] || value?.['kind'] || '',
  )['trim']();
}
function collectResultPaths(key, index = null) {
  const result = index?.['result'] || {},
    data = index?.['responseMapping'] || {},
    options =
      key === 'image'
        ? result['imagePaths']
        : key === 'video'
          ? result['videoPaths']
          : key === 'audio'
            ? result['audioPaths']
            : key === 'text'
              ? result['textPaths']
              : null;
  return [
    ...(Array['isArray'](result['paths']) ? result['paths'] : []),
    ...(Array['isArray'](options) ? options : []),
    ...(Array['isArray'](data['paths']) ? data['paths'] : []),
    ...(Array['isArray'](data['resultPaths']) ? data['resultPaths'] : []),
  ];
}
function collectFallbackValues(target, response = {}) {
  if (!response || typeof response !== 'object') return [];
  if (target === 'image')
    return [
      response['outputUrl'],
      response['imageUrl'],
      response['image_url'],
      response['url'],
      response['fileUrl'],
    ];
  if (target === 'video')
    return [
      response['outputVideoUrl'],
      response['videoUrl'],
      response['video_url'],
      response['url'],
      response['fileUrl'],
    ];
  if (target === 'audio')
    return [
      response['outputAudioUrl'],
      response['audioUrl'],
      response['audio_url'],
      response['url'],
      response['fileUrl'],
    ];
  if (target === 'text')
    return [
      response['outputText'],
      response['text'],
      response['output'],
      response['content'],
      response['message'],
    ];
  return [];
}
export function resolveManifestResultValues(
  source,
  { modelManifest: modelManifest = null, executionManifest: executionManifest = null } = {},
) {
  const outputType = normalizeOutputType(modelManifest, executionManifest),
    resultPaths = collectResultPaths(outputType, executionManifest),
    args =
      outputType === 'image'
        ? resolveMappedImageResponseValues(source, {
            ...(executionManifest?.['responseMapping'] || {}),
            resultPaths: resultPaths,
          })
        : resolveMappedResponseValues(source, resultPaths),
    args2 = collectFallbackValues(outputType, source)
      ['map']((next) => String(next ?? '')['trim']())
      ['filter'](Boolean);
  return Array['from'](new Set([...args, ...args2]));
}
export function buildManifestResultPatch(
  current,
  { modelManifest: modelManifest = null, executionManifest: executionManifest = null } = {},
) {
  const outputType2 = normalizeOutputType(modelManifest, executionManifest),
    outputUrl = resolveManifestResultValues(current, {
      modelManifest: modelManifest,
      executionManifest: executionManifest,
    })[0];
  if (!outputUrl) return {};
  if (outputType2 === 'image')
    return { outputUrl: outputUrl, imageUrl: outputUrl, sourceUrl: outputUrl, thumbUrl: outputUrl };
  if (outputType2 === 'video') return { outputVideoUrl: outputUrl, videoUrl: outputUrl };
  if (outputType2 === 'audio') return { outputAudioUrl: outputUrl, audioUrl: outputUrl, src: outputUrl };
  if (outputType2 === 'text') return { outputText: outputUrl };
  return {};
}
