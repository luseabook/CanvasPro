import {
  buildImageNodeStorageFields,
  pickCanvasImageLocalPath,
  pickCanvasThumbLocalPath,
  pickPreviewFallbackLocalPath,
  pickPreviewImageLocalPath,
  toLocalPathUrl,
} from './imageDerivativeService.js';
import { isSafeVirtualLocalPath, localPathToUrl, normalizeLocalPath } from '../utils/localMediaPath.js';
const REMOTE_HTTP_RE = /^https?:\/\//i,
  IMAGE_NODE_TYPES = new Set(['source-image', 'image', 'ai-image']),
  VIDEO_NODE_TYPES = new Set(['source-video', 'video', 'ai-video']),
  AUDIO_NODE_TYPES = new Set(['source-audio', 'audio', 'ai-audio']),
  IMAGE_TRIGGER_KEYS = [
    'src',
    'imageUrl',
    'sourceUrl',
    'thumbUrl',
    'url',
    'resultUrl',
    'localPath',
    'originalLocalPath',
    'displayLocalPath',
    'thumbLocalPath',
  ],
  VIDEO_TRIGGER_KEYS = [
    'src',
    'videoUrl',
    'thumbUrl',
    'url',
    'resultUrl',
    'localPath',
    'originalLocalPath',
    'displayLocalPath',
    'posterLocalPath',
    'videoThumbSrc',
    'videoMetaSrc',
  ],
  AUDIO_TRIGGER_KEYS = ['src', 'audioUrl', 'url', 'resultUrl', 'localPath'];
function hasOwn(_0x30e500, _0x4f8596) {
  return !!_0x30e500 && Object.prototype.hasOwnProperty.call(_0x30e500, _0x4f8596);
}
function normalizeText(_0x168d49) {
  return String(_0x168d49 || '').trim();
}
function firstNonEmptyString(..._0x424c38) {
  for (const _0x287bca of _0x424c38) {
    const _0x37d9bb = normalizeText(_0x287bca);
    if (_0x37d9bb) return _0x37d9bb;
  }
  return '';
}
function touchesAnyKey(_0x3a45f6, _0x4630e8) {
  return Array.isArray(_0x4630e8) && _0x4630e8.some((_0x53c2a0) => hasOwn(_0x3a45f6, _0x53c2a0));
}
function normalizeLocalUrlText(_0x4ecb57) {
  const _0xcc8672 = normalizeCanvasLocalPath(_0x4ecb57);
  return localPathToUrl(_0xcc8672);
}
function pickLocalPath(_0x4678ff, _0xc12d79) {
  for (const _0x29217b of _0xc12d79) {
    const _0x43ab29 = normalizeCanvasLocalPath(_0x4678ff?.[_0x29217b]);
    if (_0x43ab29) return _0x43ab29;
  }
  return '';
}
function copyCommonImageMeta(_0x25d851, _0x37c661) {
  if (hasOwn(_0x37c661, 'assetId')) _0x25d851.assetId = normalizeText(_0x37c661.assetId);
  if (hasOwn(_0x37c661, 'sourceId')) _0x25d851.sourceId = normalizeText(_0x37c661.sourceId);
  if (hasOwn(_0x37c661, 'thumbId')) _0x25d851.thumbId = normalizeText(_0x37c661.thumbId);
  if (hasOwn(_0x37c661, 'fileName')) _0x25d851.fileName = _0x37c661.fileName;
  if (hasOwn(_0x37c661, 'error')) _0x25d851.error = _0x37c661.error;
  hasOwn(_0x37c661, 'derivativeStatus') &&
    (_0x25d851.derivativeStatus = normalizeText(_0x37c661.derivativeStatus));
}
function copyCommonVideoMeta(_0x93126b, _0x1e132f) {
  if (hasOwn(_0x1e132f, 'assetId')) _0x93126b.assetId = normalizeText(_0x1e132f.assetId);
  if (hasOwn(_0x1e132f, 'fileName')) _0x93126b.fileName = _0x1e132f.fileName;
  if (hasOwn(_0x1e132f, 'thumbId')) _0x93126b.thumbId = normalizeText(_0x1e132f.thumbId);
  hasOwn(_0x1e132f, 'videoProxyStatus') &&
    (_0x93126b.videoProxyStatus = normalizeText(_0x1e132f.videoProxyStatus));
  if (hasOwn(_0x1e132f, 'videoCodec')) _0x93126b.videoCodec = normalizeText(_0x1e132f.videoCodec);
  if (hasOwn(_0x1e132f, 'videoWidth')) _0x93126b.videoWidth = Number(_0x1e132f.videoWidth || 0) || 0;
  if (hasOwn(_0x1e132f, 'videoHeight')) _0x93126b.videoHeight = Number(_0x1e132f.videoHeight || 0) || 0;
  if (hasOwn(_0x1e132f, 'videoDuration')) _0x93126b.videoDuration = Number(_0x1e132f.videoDuration || 0) || 0;
  if (hasOwn(_0x1e132f, 'videoFps')) _0x93126b.videoFps = Number(_0x1e132f.videoFps || 0) || 0;
  hasOwn(_0x1e132f, 'derivativeStatus') &&
    (_0x93126b.derivativeStatus = normalizeText(_0x1e132f.derivativeStatus));
}
function buildNormalizedImageStorage(_0x488c34 = {}) {
  const _0x3e730d = pickLocalPath(_0x488c34, [
      'localPath',
      'originalLocalPath',
      'displayLocalPath',
      'imageUrl',
      'sourceUrl',
      'src',
      'url',
      'resultUrl',
    ]),
    _0x1eb31c = pickLocalPath(_0x488c34, [
      'originalLocalPath',
      'localPath',
      'sourceUrl',
      'imageUrl',
      'src',
      'url',
      'resultUrl',
    ]),
    _0x5b50f7 = pickLocalPath(_0x488c34, ['displayLocalPath', 'imageUrl', 'src', 'url', 'resultUrl']),
    _0x1a1149 = pickLocalPath(_0x488c34, ['thumbLocalPath', 'thumbUrl']);
  return buildImageNodeStorageFields({
    ..._0x488c34,
    localPath: _0x3e730d,
    originalLocalPath: _0x1eb31c,
    displayLocalPath: _0x5b50f7,
    thumbLocalPath: _0x1a1149,
  });
}
export function resolveCanvasImageSourceUrl(_0x3c5a76 = {}) {
  const _0x2ae896 = buildNormalizedImageStorage(_0x3c5a76),
    _0x58bca8 = pickPreviewImageLocalPath(_0x2ae896) || _0x2ae896.originalLocalPath || _0x2ae896.localPath;
  return toLocalPathUrl(_0x58bca8);
}
function resolveCanvasImageDisplayPath(_0xdaa3b2 = {}) {
  return pickCanvasImageLocalPath(buildNormalizedImageStorage(_0xdaa3b2));
}
function resolveCanvasImageThumbPath(_0x508605 = {}) {
  return pickCanvasThumbLocalPath(buildNormalizedImageStorage(_0x508605));
}
export function isRemoteHttpUrl(_0x51d791) {
  return REMOTE_HTTP_RE.test(normalizeText(_0x51d791));
}
export function normalizeCanvasLocalPath(_0x8a4cd7) {
  return normalizeLocalPath(_0x8a4cd7);
}
export function toCanvasLocalUrl(_0x3086c9) {
  return localPathToUrl(_0x3086c9);
}
export function resolveCanvasImageDisplayUrl(_0x3d1278 = {}) {
  return toLocalPathUrl(resolveCanvasImageDisplayPath(_0x3d1278));
}
export function resolveCanvasImageThumbUrl(_0x484bf4 = {}) {
  return toLocalPathUrl(resolveCanvasImageThumbPath(_0x484bf4));
}
export function resolveCanvasImageLowZoomUrl(_0x2691d3 = {}) {
  return (
    resolveCanvasImageThumbUrl(_0x2691d3) ||
    resolveCanvasImageDisplayUrl(_0x2691d3) ||
    resolveCanvasImageSourceUrl(_0x2691d3)
  );
}
export function resolveCanvasImagePreviewUrl(_0x425d4b = {}) {
  const _0x338c45 = buildNormalizedImageStorage(_0x425d4b),
    _0x95389 = firstNonEmptyString(
      pickPreviewImageLocalPath(_0x338c45),
      pickPreviewFallbackLocalPath(_0x338c45),
    );
  return toLocalPathUrl(_0x95389);
}
export function resolveCanvasVideoLocalPath(_0x3a1870 = {}) {
  const _0x5bde6d = pickLocalPath(_0x3a1870, ['displayLocalPath']);
  if (_0x5bde6d) return _0x5bde6d;
  const _0x18c18e = normalizeText(_0x3a1870?.videoProxyStatus);
  if (_0x18c18e === 'processing' || _0x18c18e === 'waiting') return '';
  return pickLocalPath(_0x3a1870, ['src', 'videoUrl', 'url', 'resultUrl', 'localPath']);
}
export function resolveCanvasVideoUrl(_0x465994 = {}) {
  return toCanvasLocalUrl(resolveCanvasVideoLocalPath(_0x465994));
}
function normalizeCanvasVideoPosterUrl(value, { localOnly = false } = {}) {
  const normalized = normalizeText(value);
  if (!normalized) return '';
  if (/^data:image\//i.test(normalized) || /^blob:/i.test(normalized) || /^aic-local-preview:/i.test(normalized)) {
    return normalized;
  }
  if (/^(?:https?:|file:)/i.test(normalized)) return '';
  const localUrl = localPathToUrl(normalized);
  if (localUrl) return localUrl;
  return localOnly ? '' : normalized;
}
export function resolveCanvasVideoPosterUrl(_0x3ed78b = {}) {
  const videos = Array.isArray(_0x3ed78b?.videos) ? _0x3ed78b.videos : [],
    mainIndex = Math.max(0, Number(_0x3ed78b?.mainVideoIndex) || 0),
    mainVideo = videos[mainIndex] || videos[0] || null,
    candidates = [
      [mainVideo?.posterLocalPath, true],
      [mainVideo?.previewLocalPath, true],
      [mainVideo?.thumbLocalPath, true],
      [mainVideo?.thumbnailLocalPath, true],
      [mainVideo?.posterUrl, false],
      [mainVideo?.previewUrl, false],
      [mainVideo?.thumbUrl, false],
      [mainVideo?.thumbnailUrl, false],
      [_0x3ed78b?.posterLocalPath, true],
      [_0x3ed78b?.previewLocalPath, true],
      [_0x3ed78b?.thumbLocalPath, true],
      [_0x3ed78b?.thumbnailLocalPath, true],
      [_0x3ed78b?.posterUrl, false],
      [_0x3ed78b?.previewUrl, false],
      [_0x3ed78b?.thumbUrl, false],
      [_0x3ed78b?.thumbnailUrl, false],
    ];
  for (const [value, localOnly] of candidates) {
    const resolved = normalizeCanvasVideoPosterUrl(value, { localOnly });
    if (resolved) return resolved;
  }
  return '';
}
export function resolveCanvasAudioLocalPath(_0x20103f = {}) {
  return pickLocalPath(_0x20103f, ['localPath', 'audioUrl', 'src', 'url', 'resultUrl']);
}
export function resolveCanvasAudioUrl(_0x17b660 = {}) {
  return toCanvasLocalUrl(resolveCanvasAudioLocalPath(_0x17b660));
}
export function buildCanvasLocalImageFields(_0x45d21d = {}, _0x43d094 = {}) {
  const _0x334aa4 = buildNormalizedImageStorage(_0x45d21d),
    _0x485cf7 = toLocalPathUrl(pickCanvasImageLocalPath(_0x334aa4)),
    _0x242a24 = resolveCanvasImageSourceUrl(_0x334aa4),
    _0x2d8914 = toLocalPathUrl(pickCanvasThumbLocalPath(_0x334aa4)),
    _0x30504e = _0x43d094.includeSrc === true || hasOwn(_0x45d21d, 'src'),
    _0x37d28a = _0x43d094.includeCanonicalUrl === true || hasOwn(_0x45d21d, 'url'),
    _0x136b8a = _0x43d094.includeResultUrl === true || hasOwn(_0x45d21d, 'resultUrl'),
    _0x3b8f49 = {};
  (hasOwn(_0x45d21d, 'localPath') || _0x334aa4.localPath || _0x334aa4.originalLocalPath) &&
    ((_0x3b8f49.localPath = _0x334aa4.localPath || ''),
    (_0x3b8f49.originalLocalPath = _0x334aa4.originalLocalPath || ''));
  (hasOwn(_0x45d21d, 'displayLocalPath') || _0x334aa4.displayLocalPath) &&
    (_0x3b8f49.displayLocalPath = _0x334aa4.displayLocalPath || '');
  (hasOwn(_0x45d21d, 'thumbLocalPath') || hasOwn(_0x45d21d, 'thumbUrl') || _0x334aa4.thumbLocalPath) &&
    (_0x3b8f49.thumbLocalPath = _0x334aa4.thumbLocalPath || '');
  (touchesAnyKey(_0x45d21d, [
    'imageUrl',
    'sourceUrl',
    'thumbUrl',
    'localPath',
    'originalLocalPath',
    'displayLocalPath',
    'thumbLocalPath',
    'src',
    'url',
    'resultUrl',
  ]) ||
    _0x485cf7 ||
    _0x242a24 ||
    _0x2d8914) &&
    ((_0x3b8f49.imageUrl = _0x485cf7 || ''),
    (_0x3b8f49.sourceUrl = _0x242a24 || ''),
    (_0x3b8f49.thumbUrl = _0x2d8914 || ''));
  if (_0x30504e) _0x3b8f49.src = _0x485cf7 || '';
  if (_0x37d28a) _0x3b8f49.url = _0x485cf7 || '';
  if (_0x136b8a) _0x3b8f49.resultUrl = _0x485cf7 || '';
  return (copyCommonImageMeta(_0x3b8f49, _0x45d21d), _0x3b8f49);
}
export function buildCanvasLocalVideoFields(_0x3ed78b = {}, _0x8ee498 = {}) {
  const _0x1f8cf3 = pickLocalPath(_0x3ed78b, [
      'localPath',
      'originalLocalPath',
      'videoUrl',
      'src',
      'url',
      'resultUrl',
    ]),
    _0xc990b1 = pickLocalPath(_0x3ed78b, ['originalLocalPath']),
    _0x25f6a7 = pickLocalPath(_0x3ed78b, ['displayLocalPath']),
    _0xda53e6 = resolveCanvasVideoLocalPath(_0x3ed78b),
    _0x19882e = toLocalPathUrl(_0xda53e6),
    _0x3d6ef2 = toCanvasLocalUrl(_0x3ed78b?.thumbUrl),
    _0x1c491c = pickLocalPath(_0x3ed78b, ['posterLocalPath']),
    _0x4f4ea1 = toLocalPathUrl(_0x1c491c),
    _0x3c2184 = toCanvasLocalUrl(_0x3ed78b?.videoThumbSrc || _0xda53e6),
    _0x10468b = _0x8ee498.includeCanonicalUrl === true || hasOwn(_0x3ed78b, 'url'),
    _0x1fcde4 = _0x8ee498.includeResultUrl === true || hasOwn(_0x3ed78b, 'resultUrl'),
    _0x28a0b8 = {};
  (hasOwn(_0x3ed78b, 'localPath') ||
    hasOwn(_0x3ed78b, 'videoUrl') ||
    hasOwn(_0x3ed78b, 'src') ||
    hasOwn(_0x3ed78b, 'url') ||
    hasOwn(_0x3ed78b, 'resultUrl') ||
    hasOwn(_0x3ed78b, 'displayLocalPath') ||
    _0xda53e6) &&
    ((hasOwn(_0x3ed78b, 'localPath') ||
      hasOwn(_0x3ed78b, 'videoUrl') ||
      hasOwn(_0x3ed78b, 'src') ||
      hasOwn(_0x3ed78b, 'url') ||
      hasOwn(_0x3ed78b, 'resultUrl') ||
      _0x1f8cf3) &&
      (_0x28a0b8.localPath = _0x1f8cf3 || ''),
    (hasOwn(_0x3ed78b, 'originalLocalPath') || _0xc990b1) && (_0x28a0b8.originalLocalPath = _0xc990b1 || ''),
    (hasOwn(_0x3ed78b, 'displayLocalPath') || _0x25f6a7) && (_0x28a0b8.displayLocalPath = _0x25f6a7 || ''),
    (_0x28a0b8.videoUrl = _0x19882e || ''),
    (_0x28a0b8.src = _0x19882e || ''));
  (hasOwn(_0x3ed78b, 'thumbUrl') || _0x3d6ef2) && (_0x28a0b8.thumbUrl = _0x3d6ef2 || _0x4f4ea1 || '');
  if (hasOwn(_0x3ed78b, 'posterLocalPath') || _0x1c491c) {
    _0x28a0b8.posterLocalPath = _0x1c491c || '';
    if (!_0x28a0b8.thumbUrl) _0x28a0b8.thumbUrl = _0x4f4ea1 || '';
  }
  hasOwn(_0x3ed78b, 'videoThumbSrc') && (_0x28a0b8.videoThumbSrc = _0x3c2184 || '');
  hasOwn(_0x3ed78b, 'videoMetaSrc') &&
    (_0x28a0b8.videoMetaSrc = toCanvasLocalUrl(_0x3ed78b.videoMetaSrc || _0xda53e6));
  if (_0x10468b) _0x28a0b8.url = _0x19882e || '';
  if (_0x1fcde4) _0x28a0b8.resultUrl = _0x19882e || '';
  return (copyCommonVideoMeta(_0x28a0b8, _0x3ed78b), _0x28a0b8);
}
export function buildCanvasLocalAudioFields(_0x195920 = {}, _0x478724 = {}) {
  const _0x1e673f = resolveCanvasAudioLocalPath(_0x195920),
    _0x49d430 = toLocalPathUrl(_0x1e673f),
    _0x310a47 = pickLocalPath(_0x195920, ['waveformLocalPath']),
    _0x2a5e27 = _0x478724.includeCanonicalUrl === true || hasOwn(_0x195920, 'url'),
    _0x30f698 = _0x478724.includeResultUrl === true || hasOwn(_0x195920, 'resultUrl'),
    _0xc0e5f = {};
  (hasOwn(_0x195920, 'localPath') ||
    hasOwn(_0x195920, 'audioUrl') ||
    hasOwn(_0x195920, 'src') ||
    hasOwn(_0x195920, 'url') ||
    hasOwn(_0x195920, 'resultUrl') ||
    _0x1e673f) &&
    ((_0xc0e5f.localPath = _0x1e673f || ''),
    (_0xc0e5f.audioUrl = _0x49d430 || ''),
    (_0xc0e5f.src = _0x49d430 || ''));
  if (_0x2a5e27) _0xc0e5f.url = _0x49d430 || '';
  if (_0x30f698) _0xc0e5f.resultUrl = _0x49d430 || '';
  (hasOwn(_0x195920, 'waveformLocalPath') || _0x310a47) && (_0xc0e5f.waveformLocalPath = _0x310a47 || '');
  if (hasOwn(_0x195920, 'assetId')) _0xc0e5f.assetId = normalizeText(_0x195920.assetId);
  hasOwn(_0x195920, 'derivativeStatus') &&
    (_0xc0e5f.derivativeStatus = normalizeText(_0x195920.derivativeStatus));
  if (hasOwn(_0x195920, 'fileName')) _0xc0e5f.fileName = _0x195920.fileName;
  return _0xc0e5f;
}
function normalizeImageCollection(_0x471208) {
  if (!Array.isArray(_0x471208)) return _0x471208;
  return _0x471208.map((_0x234dd5) => {
    if (!_0x234dd5 || typeof _0x234dd5 !== 'object') return _0x234dd5;
    return {
      ..._0x234dd5,
      ...buildCanvasLocalImageFields(_0x234dd5, {
        includeSrc: hasOwn(_0x234dd5, 'src'),
        includeCanonicalUrl: hasOwn(_0x234dd5, 'url'),
        includeResultUrl: hasOwn(_0x234dd5, 'resultUrl'),
      }),
    };
  });
}
function normalizeVideoCollection(_0x4fee5e) {
  if (!Array.isArray(_0x4fee5e)) return _0x4fee5e;
  return _0x4fee5e.map((_0x3437cc) => {
    if (!_0x3437cc || typeof _0x3437cc !== 'object') return _0x3437cc;
    return {
      ..._0x3437cc,
      ...buildCanvasLocalVideoFields(_0x3437cc, {
        includeCanonicalUrl: hasOwn(_0x3437cc, 'url'),
        includeResultUrl: hasOwn(_0x3437cc, 'resultUrl'),
      }),
    };
  });
}
function validateUrlField(_0x3e7650, _0x3e4fb8) {
  const _0x1b7dd9 = normalizeText(_0x3e4fb8);
  if (!_0x1b7dd9) return;
  if (normalizeLocalUrlText(_0x1b7dd9) !== _0x1b7dd9)
    throw new Error('[canvasMediaLocalService] ' + _0x3e7650 + ' 必须是本地 URL');
}
function validatePathField(_0x5a2c98, _0x2efe7f) {
  const _0x29c20e = normalizeText(_0x2efe7f);
  if (!_0x29c20e) return;
  const _0x2f5aef = normalizeCanvasLocalPath(_0x29c20e);
  if (!_0x2f5aef || !isSafeVirtualLocalPath(_0x2f5aef))
    throw new Error('[canvasMediaLocalService] ' + _0x5a2c98 + ' 必须是本地路径');
}
export function assertCanvasMediaPatchLocalOnly(_0x3877ee = {}) {
  if (!_0x3877ee || typeof _0x3877ee !== 'object') return;
  const _0x26c825 = (_0x393204) => {
    if (!_0x393204 || typeof _0x393204 !== 'object') return;
    for (const _0x42b7a9 of [
      'src',
      'imageUrl',
      'sourceUrl',
      'thumbUrl',
      'videoUrl',
      'audioUrl',
      'url',
      'resultUrl',
      'videoThumbSrc',
      'videoMetaSrc',
    ]) {
      if (hasOwn(_0x393204, _0x42b7a9)) validateUrlField(_0x42b7a9, _0x393204[_0x42b7a9]);
    }
    for (const _0x2a1f9c of [
      'localPath',
      'originalLocalPath',
      'displayLocalPath',
      'thumbLocalPath',
      'posterLocalPath',
      'waveformLocalPath',
      'path',
    ]) {
      if (hasOwn(_0x393204, _0x2a1f9c)) validatePathField(_0x2a1f9c, _0x393204[_0x2a1f9c]);
    }
  };
  _0x26c825(_0x3877ee);
  if (Array.isArray(_0x3877ee.images)) {
    for (const _0x531492 of _0x3877ee.images) _0x26c825(_0x531492);
  }
  if (Array.isArray(_0x3877ee.videos)) {
    for (const _0x55395d of _0x3877ee.videos) _0x26c825(_0x55395d);
  }
}
export function sanitizeCanvasNodeMediaPatchForStore(_0x21e4a2 = {}, _0x39b8b9 = null) {
  if (!_0x21e4a2 || typeof _0x21e4a2 !== 'object' || Array.isArray(_0x21e4a2)) return _0x21e4a2;
  const _0x3c288 = normalizeText(_0x21e4a2.type || _0x39b8b9?.type),
    _0x112d1f = { ..._0x21e4a2 };
  hasOwn(_0x21e4a2, 'images') && (_0x112d1f.images = normalizeImageCollection(_0x21e4a2.images));
  hasOwn(_0x21e4a2, 'videos') && (_0x112d1f.videos = normalizeVideoCollection(_0x21e4a2.videos));
  const _0x34ae66 =
    hasOwn(_0x21e4a2, 'images') ||
    touchesAnyKey(_0x21e4a2, IMAGE_TRIGGER_KEYS) ||
    (IMAGE_NODE_TYPES.has(_0x3c288) && touchesAnyKey(_0x21e4a2, ['src', 'localPath', 'fileName']));
  _0x34ae66 &&
    Object.assign(
      _0x112d1f,
      buildCanvasLocalImageFields(_0x21e4a2, {
        includeSrc: hasOwn(_0x21e4a2, 'src') || IMAGE_NODE_TYPES.has(_0x3c288),
        includeCanonicalUrl: hasOwn(_0x21e4a2, 'url'),
        includeResultUrl: hasOwn(_0x21e4a2, 'resultUrl'),
      }),
    );
  const _0x474a11 =
    hasOwn(_0x21e4a2, 'videos') ||
    touchesAnyKey(_0x21e4a2, [
      'videoUrl',
      'videoThumbSrc',
      'videoMetaSrc',
      'posterLocalPath',
      'videoProxyStatus',
    ]) ||
    (VIDEO_NODE_TYPES.has(_0x3c288) && touchesAnyKey(_0x21e4a2, VIDEO_TRIGGER_KEYS));
  _0x474a11 &&
    Object.assign(
      _0x112d1f,
      buildCanvasLocalVideoFields(_0x21e4a2, {
        includeCanonicalUrl: hasOwn(_0x21e4a2, 'url'),
        includeResultUrl: hasOwn(_0x21e4a2, 'resultUrl'),
      }),
    );
  const _0xeaed5f =
    hasOwn(_0x21e4a2, 'audioUrl') ||
    (AUDIO_NODE_TYPES.has(_0x3c288) &&
      touchesAnyKey(_0x21e4a2, ['src', 'localPath', 'waveformLocalPath', 'fileName']));
  return (
    _0xeaed5f &&
      Object.assign(
        _0x112d1f,
        buildCanvasLocalAudioFields(_0x21e4a2, {
          includeCanonicalUrl: hasOwn(_0x21e4a2, 'url'),
          includeResultUrl: hasOwn(_0x21e4a2, 'resultUrl'),
        }),
      ),
    _0x112d1f
  );
}
