import { resolveMappedImageResponseValues, resolveMappedResponseValues } from './modelApiMappingEngine.js';
function normalizeOutputType(_0x4d2778 = null, _0x3e9ca5 = null) {
  return String(
    _0x3e9ca5?.['result']?.['outputType'] ||
      _0x4d2778?.['outputType'] ||
      _0x3e9ca5?.['kind'] ||
      _0x4d2778?.['kind'] ||
      '',
  )['trim']();
}
function collectResultPaths(_0x33e45d, _0x3d4a49 = null) {
  const _0x8517e9 = _0x3d4a49?.['result'] || {},
    _0x13287f = _0x3d4a49?.['responseMapping'] || {},
    _0x1f3e12 =
      _0x33e45d === 'image'
        ? _0x8517e9['imagePaths']
        : _0x33e45d === 'video'
          ? _0x8517e9['videoPaths']
          : _0x33e45d === 'audio'
            ? _0x8517e9['audioPaths']
            : _0x33e45d === 'text'
              ? _0x8517e9['textPaths']
              : null;
  return [
    ...(Array['isArray'](_0x8517e9['paths']) ? _0x8517e9['paths'] : []),
    ...(Array['isArray'](_0x1f3e12) ? _0x1f3e12 : []),
    ...(Array['isArray'](_0x13287f['paths']) ? _0x13287f['paths'] : []),
    ...(Array['isArray'](_0x13287f['resultPaths']) ? _0x13287f['resultPaths'] : []),
  ];
}
function collectFallbackValues(_0x534c03, _0x3468c1 = {}) {
  if (!_0x3468c1 || typeof _0x3468c1 !== 'object') return [];
  if (_0x534c03 === 'image')
    return [
      _0x3468c1['outputUrl'],
      _0x3468c1['imageUrl'],
      _0x3468c1['image_url'],
      _0x3468c1['url'],
      _0x3468c1['fileUrl'],
    ];
  if (_0x534c03 === 'video')
    return [
      _0x3468c1['outputVideoUrl'],
      _0x3468c1['videoUrl'],
      _0x3468c1['video_url'],
      _0x3468c1['url'],
      _0x3468c1['fileUrl'],
    ];
  if (_0x534c03 === 'audio')
    return [
      _0x3468c1['outputAudioUrl'],
      _0x3468c1['audioUrl'],
      _0x3468c1['audio_url'],
      _0x3468c1['url'],
      _0x3468c1['fileUrl'],
    ];
  if (_0x534c03 === 'text')
    return [
      _0x3468c1['outputText'],
      _0x3468c1['text'],
      _0x3468c1['output'],
      _0x3468c1['content'],
      _0x3468c1['message'],
    ];
  return [];
}
export function resolveManifestResultValues(
  _0x228412,
  { modelManifest: modelManifest = null, executionManifest: executionManifest = null } = {},
) {
  const _0x144b02 = normalizeOutputType(modelManifest, executionManifest),
    _0x3c492c = collectResultPaths(_0x144b02, executionManifest),
    _0x3562d6 =
      _0x144b02 === 'image'
        ? resolveMappedImageResponseValues(_0x228412, {
            ...(executionManifest?.['responseMapping'] || {}),
            resultPaths: _0x3c492c,
          })
        : resolveMappedResponseValues(_0x228412, _0x3c492c),
    _0x4c96ad = collectFallbackValues(_0x144b02, _0x228412)
      ['map']((_0x8edae2) => String(_0x8edae2 ?? '')['trim']())
      ['filter'](Boolean);
  return Array['from'](new Set([..._0x3562d6, ..._0x4c96ad]));
}
export function buildManifestResultPatch(
  _0x516347,
  { modelManifest: modelManifest = null, executionManifest: executionManifest = null } = {},
) {
  const _0x56f418 = normalizeOutputType(modelManifest, executionManifest),
    _0x66fff = resolveManifestResultValues(_0x516347, {
      modelManifest: modelManifest,
      executionManifest: executionManifest,
    })[0x0];
  if (!_0x66fff) return {};
  if (_0x56f418 === 'image')
    return { outputUrl: _0x66fff, imageUrl: _0x66fff, sourceUrl: _0x66fff, thumbUrl: _0x66fff };
  if (_0x56f418 === 'video') return { outputVideoUrl: _0x66fff, videoUrl: _0x66fff };
  if (_0x56f418 === 'audio') return { outputAudioUrl: _0x66fff, audioUrl: _0x66fff, src: _0x66fff };
  if (_0x56f418 === 'text') return { outputText: _0x66fff };
  return {};
}
