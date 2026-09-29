import { hasPresentedVideoFrame } from '../services/videoFramePresentation.js';
import {
  resolveCanvasImageSourceUrl,
  resolveCanvasVideoDisplayUrl,
  toCanvasLocalUrl,
} from '../services/canvasMediaLocalService.js';
import {
  cancelQueuedCanvasImagePreloads,
  forgetCanvasImageDisplayLoad,
  isCanvasImageDisplayLoadTracked,
  isCanvasImagePreloadCoolingDown,
  isCanvasImagePreloadPending,
  isCanvasImagePreloadSharedImage,
  rememberCanvasImagePreloadResolved,
  preloadCanvasImage,
  trackCanvasImageDisplayLoad,
} from '../modules/canvasMediaScheduler.js';
import { isPerfProbeEnabled, recordFastPreviewSample } from '../modules/perf/perfProbe.js';
import {
  buildCanvasImageResultIdentityKey,
  versionCanvasImageDisplayUrl,
} from '../modules/canvasImageLod.js';
import { isTaskCancelled, isTaskFailed, shouldShowGenerationBusyUi } from './generationTaskUiState.js';
import {
  isRendererFastPreviewGeometryVisible,
  isRendererFastPreviewMediaReadable,
  planRendererFastPreviewAdmission,
  resolveRendererFastPreviewMediaQueuePriority,
} from './rendererFastPreviewAdmission.js';
import {
  isRendererRuntimeDiagnosticsEnabled,
  recordRendererRuntimeDiagnostic,
} from './rendererRuntimeDiagnostics.js';
const FAST_PREVIEW_NODE_COUNT_THRESHOLD = 0x30,
  FAST_PREVIEW_CANDIDATE_THRESHOLD = 0x10,
  FAST_PREVIEW_MEDIA_SRC_BATCH_SIZE = 0xc,
  FAST_PREVIEW_FALLBACK_NODE_CREATE_BATCH_SIZE = 0x50,
  FAST_PREVIEW_LARGE_CANDIDATE_COUNT = 0xb4,
  FAST_PREVIEW_HUGE_CANDIDATE_COUNT = 0x168,
  FAST_PREVIEW_LARGE_MEDIA_SRC_BATCH_SIZE = 0xa,
  FAST_PREVIEW_HUGE_MEDIA_SRC_BATCH_SIZE = 0x8,
  FAST_PREVIEW_BUSY_MEDIA_SRC_BATCH_SIZE = 0x8,
  FAST_PREVIEW_VIDEO_MEDIA_SRC_BATCH_SIZE = 0x8,
  FAST_PREVIEW_LARGE_VIDEO_MEDIA_SRC_BATCH_SIZE = 0x6,
  FAST_PREVIEW_HUGE_VIDEO_MEDIA_SRC_BATCH_SIZE = 0x4,
  FAST_PREVIEW_BUSY_VIDEO_MEDIA_SRC_BATCH_SIZE = 0x2,
  FAST_PREVIEW_BUSY_HINT_TTL_MS = 0xb4,
  FAST_PREVIEW_BUSY_MEDIA_SRC_RETRY_MS = 0x40,
  FAST_PREVIEW_MEDIA_PRELOAD_PRIORITY = 0x2d,
  FAST_PREVIEW_LOW_PRIORITY_MEDIA_PRELOAD_PRIORITY = 0x19,
  FAST_PREVIEW_BUSY_MEDIA_PRELOAD_PRIORITY = 0x14,
  FAST_PREVIEW_VIEWPORT_BUSY_PRELOAD_CANCEL_PRIORITY_LIMIT = 0x50,
  FAST_PREVIEW_NODE_POOL_LIMIT = 0x140,
  FAST_PREVIEW_DETACHED_NODE_CACHE_LIMIT = 0xf0,
  FAST_PREVIEW_DETACHED_IN_FLIGHT_CACHE_LIMIT = 0x208,
  FAST_PREVIEW_LAYER_PADDING = 0x60,
  FAST_PREVIEW_MEDIA_PRELOAD_SCOPE = 'renderer-fast-preview-media',
  FAST_PREVIEW_MOTION_MIN_DISTANCE_SQ = 0x4,
  FAST_PREVIEW_MINIMAL_INTERACTION_DETAIL_MAX_ZOOM = 0.08,
  FAST_PREVIEW_AUDIO_WAVE_PATH =
    'M10,40 L10,40 M15,30 L15,50 M20,20 L20,60 M25,35 L25,45 M30,25 L30,55 M35,15 L35,65 M40,30 L40,50 M45,38 L45,42 M50,22 L50,58 M55,18 L55,62 M60,28 L60,52 M65,32 L65,48 M70,24 L70,56 M75,36 L75,44 M80,20 L80,60 M85,16 L85,64 M90,26 L90,54 M95,34 L95,46 M100,22 L100,58 M105,18 L105,62 M110,30 L110,50 M115,38 L115,42 M120,15 L120,65 M125,25 L125,55 M130,35 L130,45 M135,20 L135,60 M140,30 L140,50 M145,40 L145,40 M150,25 L150,55 M155,15 L155,65 M160,30 L160,50 M165,38 L165,42 M170,22 L170,58 M175,18 L175,62 M180,28 L180,52 M185,32 L185,48 M190,24 L190,56';
function toNumber(_0x23d4c7, _0x449434 = 0x0) {
  const _0x38c0b8 = Number(_0x23d4c7);
  return Number['isFinite'](_0x38c0b8) ? _0x38c0b8 : _0x449434;
}
function nowPerf() {
  return typeof performance !== 'undefined' && performance && typeof performance['now'] === 'function'
    ? performance['now']()
    : Date['now']();
}
function isViewportInteractionBusyForPreview() {
  const _0x3485a2 = typeof document !== 'undefined' ? document?.['body']?.['classList'] : null;
  return Boolean(
    _0x3485a2?.['contains']?.('is-panning') ||
    _0x3485a2?.['contains']?.('is-zooming') ||
    _0x3485a2?.['contains']?.('is-viewport-animating'),
  );
}
function isDirectViewportGestureBusyForPreview() {
  const _0x24039d = typeof document !== 'undefined' ? document?.['body']?.['classList'] : null;
  return Boolean(_0x24039d?.['contains']?.('is-panning') || _0x24039d?.['contains']?.('is-zooming'));
}
function isElementVisible(_0x3c15b1) {
  if (!_0x3c15b1 || _0x3c15b1['isConnected'] === ![]) return ![];
  if (_0x3c15b1['hidden'] === !![] || _0x3c15b1['classList']?.['contains']?.('is-hidden')) return ![];
  const _0x2bf84f = _0x3c15b1['style'] || {};
  return (
    _0x2bf84f['display'] !== 'none' && _0x2bf84f['visibility'] !== 'hidden' && _0x2bf84f['opacity'] !== '0'
  );
}
function isMountedImageReady(_0x5d098e) {
  const _0x4bb21d = String(
    _0x5d098e?.['currentSrc'] || _0x5d098e?.['src'] || _0x5d098e?.['getAttribute']?.('src') || '',
  )['trim']();
  if (!_0x4bb21d || !isElementVisible(_0x5d098e)) return ![];
  if (_0x5d098e['complete'] === ![]) return ![];
  return Number(_0x5d098e['naturalWidth'] || 0x0) > 0x0 || _0x5d098e['complete'] === undefined;
}
function isMountedVideoReady(_0x4a8993) {
  const _0x5da41b = String(
    _0x4a8993?.['currentSrc'] || _0x4a8993?.['src'] || _0x4a8993?.['getAttribute']?.('src') || '',
  )['trim']();
  return (
    !!_0x5da41b &&
    isElementVisible(_0x4a8993) &&
    (Number(_0x4a8993['readyState'] || 0x0) >= 0x2 || hasPresentedVideoFrame(_0x4a8993))
  );
}
function hasActiveMountedVideoPlayback(_0x57f513) {
  return Array['from'](_0x57f513?.['querySelectorAll']?.('video') || [])['some'](
    (_0x3040e0) =>
      isMountedPresentationMediaElement(_0x3040e0) &&
      isMountedVideoReady(_0x3040e0) &&
      _0x3040e0['paused'] === ![] &&
      _0x3040e0['ended'] !== !![],
  );
}
function hasMountedMediaElement(_0x421470) {
  return !!(_0x421470?.['querySelector']?.('img') || _0x421470?.['querySelector']?.('video'));
}
function isMountedPresentationMediaElement(_0x2883e0) {
  const _0x14dc06 = String(_0x2883e0?.['tagName'] || '')['toLowerCase'](),
    _0x52b7c3 = _0x2883e0?.['classList'];
  if (_0x14dc06 === 'img')
    return !!(
      _0x52b7c3?.['contains']?.('node-img') ||
      _0x52b7c3?.['contains']?.('v2-media-preview') ||
      _0x52b7c3?.['contains']?.('aigen-image-media') ||
      _0x52b7c3?.['contains']?.('source-video-poster-frame') ||
      _0x52b7c3?.['contains']?.('source-video-capture-preview') ||
      _0x52b7c3?.['contains']?.('ai-video-deferred-poster')
    );
  if (_0x14dc06 === 'video') return !![];
  return ![];
}
function isMountedMediaReady(_0x4015e4) {
  if (!hasMountedMediaElement(_0x4015e4)) return ![];
  const _0x19fc32 = Array['from'](_0x4015e4?.['querySelectorAll']?.('img') || [])['filter'](
      isMountedPresentationMediaElement,
    ),
    _0x201302 = Array['from'](_0x4015e4?.['querySelectorAll']?.('video') || [])['filter'](
      isMountedPresentationMediaElement,
    );
  if (_0x19fc32['length'] === 0x0 && _0x201302['length'] === 0x0) return ![];
  for (const _0x22bd5a of _0x19fc32) {
    if (isMountedImageReady(_0x22bd5a)) return !![];
  }
  for (const _0x154f9c of _0x201302) {
    if (isMountedVideoReady(_0x154f9c)) return !![];
  }
  return ![];
}
function isFastPreviewReleasedForPlayback(_0x2182c7) {
  return _0x2182c7?.['dataset']?.['fastPreviewReleasedForPlayback'] === '1';
}
function getPreviewKind(_0x433e28 = {}) {
  const _0x306897 = String(_0x433e28['type'] || '')['toLowerCase']();
  if (_0x306897['includes']('group')) return 'group';
  if (_0x306897['includes']('video') || _0x306897['includes']('media-clip')) return 'video';
  if (_0x306897['includes']('image')) return 'image';
  if (_0x306897['includes']('audio')) return 'audio';
  if (_0x306897['includes']('text') || _0x306897['includes']('comment')) return 'text';
  return 'node';
}
function isWebPreviewNode(_0x11ef6c = {}) {
  return (
    String(_0x11ef6c?.['type'] || '')
      ['trim']()
      ['toLowerCase']() === 'web-preview'
  );
}
function getPreviewText(_0x9f4dac = {}, _0x2cb30d = 'node') {
  const _0x354bc2 =
    _0x2cb30d === 'image'
      ? 'Image'
      : _0x2cb30d === 'video'
        ? 'Video'
        : _0x2cb30d === 'audio'
          ? 'Audio'
          : _0x2cb30d === 'text'
            ? 'Text'
            : 'Node';
  return String(
    _0x9f4dac['name'] || _0x9f4dac['title'] || _0x9f4dac['prompt'] || _0x9f4dac['text'] || _0x354bc2,
  )
    ['replace'](/\s+/g, '\x20')
    ['trim']()
    ['slice'](0x0, _0x2cb30d === 'text' ? 0xa0 : 0x30);
}
function getPrimaryListItem(_0x4072e1, _0x4e0e11 = 0x0) {
  if (!Array['isArray'](_0x4072e1) || _0x4072e1['length'] === 0x0) return null;
  const _0x505037 = Math['max'](0x0, Math['trunc'](Number(_0x4e0e11) || 0x0));
  return _0x4072e1[_0x505037] || _0x4072e1[0x0] || null;
}
function getPrimaryListItemIndex(_0x49d440, _0x5326fd = 0x0) {
  if (!Array['isArray'](_0x49d440) || _0x49d440['length'] === 0x0) return 0x0;
  return Math['max'](0x0, Math['min'](_0x49d440['length'] - 0x1, Math['trunc'](Number(_0x5326fd) || 0x0)));
}
function firstLocalPreviewUrl(_0xf4876b = []) {
  for (const _0x297a40 of _0xf4876b) {
    const _0x359fac = toCanvasLocalUrl(_0x297a40);
    if (_0x359fac) return _0x359fac;
  }
  return '';
}
function uniquePreviewUrls(_0x4bb781 = []) {
  const _0x29c4f1 = [],
    _0x25b827 = new Set();
  for (const _0x29b9ea of _0x4bb781) {
    const _0x149722 = String(_0x29b9ea || '')['trim']();
    if (!_0x149722 || _0x25b827['has'](_0x149722)) continue;
    (_0x25b827['add'](_0x149722), _0x29c4f1['push'](_0x149722));
  }
  return _0x29c4f1;
}
function isLikelyImagePreviewUrl(_0x39cdaa) {
  const _0x2ff296 = String(_0x39cdaa || '')['trim']();
  if (!_0x2ff296) return ![];
  if (/^(data:image\/|blob:)/i['test'](_0x2ff296)) return !![];
  return /\.(?:png|jpe?g|webp|gif|avif|bmp)(?:[?#].*)?$/i['test'](_0x2ff296);
}
function normalizeViewport(_0x1596dc = {}) {
  const _0x2e5e95 = Number(_0x1596dc?.['zoom']);
  return {
    x: Number['isFinite'](Number(_0x1596dc?.['x'])) ? Number(_0x1596dc['x']) : 0x0,
    y: Number['isFinite'](Number(_0x1596dc?.['y'])) ? Number(_0x1596dc['y']) : 0x0,
    zoom: Number['isFinite'](_0x2e5e95) && _0x2e5e95 > 0x0 ? _0x2e5e95 : 0x1,
  };
}
function getViewportContainerSize(_0x2329bb = {}) {
  return {
    width: Math['max'](
      0x1,
      Number(_0x2329bb['containerWidth'] ?? _0x2329bb['containerW']) ||
        (typeof window !== 'undefined' ? Number(window['innerWidth']) : 0x0) ||
        0x640,
    ),
    height: Math['max'](
      0x1,
      Number(_0x2329bb['containerHeight'] ?? _0x2329bb['containerH']) ||
        (typeof window !== 'undefined' ? Number(window['innerHeight']) : 0x0) ||
        0x384,
    ),
  };
}
function getViewportWorldCenter(_0x54d4cc = {}) {
  const _0x38335c = normalizeViewport(_0x54d4cc['viewport']),
    { width: _0x555cf9, height: _0x15fbe0 } = getViewportContainerSize(_0x54d4cc);
  return {
    x: ((0x0 - _0x38335c['x']) / _0x38335c['zoom'] + (_0x555cf9 - _0x38335c['x']) / _0x38335c['zoom']) / 0x2,
    y: ((0x0 - _0x38335c['y']) / _0x38335c['zoom'] + (_0x15fbe0 - _0x38335c['y']) / _0x38335c['zoom']) / 0x2,
  };
}
function resolveMediaSrcBatchSize(_0x3dc9ea, _0x1b60b9 = {}) {
  const _0x3f42b6 = Number(_0x1b60b9['batchLimit']);
  if (Number['isFinite'](_0x3f42b6) && _0x3f42b6 >= 0x0) return Math['max'](0x0, Math['trunc'](_0x3f42b6));
  if (_0x1b60b9['viewportBusy'] === !![]) return FAST_PREVIEW_BUSY_MEDIA_SRC_BATCH_SIZE;
  if (_0x3dc9ea >= FAST_PREVIEW_HUGE_CANDIDATE_COUNT) return FAST_PREVIEW_HUGE_MEDIA_SRC_BATCH_SIZE;
  if (_0x3dc9ea >= FAST_PREVIEW_LARGE_CANDIDATE_COUNT) return FAST_PREVIEW_LARGE_MEDIA_SRC_BATCH_SIZE;
  return FAST_PREVIEW_MEDIA_SRC_BATCH_SIZE;
}
function resolveVideoMediaSrcBatchSize(_0x107f94, _0x9c9181 = {}) {
  const _0x17d551 = Number(_0x9c9181['batchLimit']);
  if (Number['isFinite'](_0x17d551) && _0x17d551 >= 0x0) return Math['max'](0x0, Math['trunc'](_0x17d551));
  if (_0x9c9181['viewportBusy'] === !![]) return FAST_PREVIEW_BUSY_VIDEO_MEDIA_SRC_BATCH_SIZE;
  if (_0x107f94 >= FAST_PREVIEW_HUGE_CANDIDATE_COUNT) return FAST_PREVIEW_HUGE_VIDEO_MEDIA_SRC_BATCH_SIZE;
  if (_0x107f94 >= FAST_PREVIEW_LARGE_CANDIDATE_COUNT) return FAST_PREVIEW_LARGE_VIDEO_MEDIA_SRC_BATCH_SIZE;
  return FAST_PREVIEW_VIDEO_MEDIA_SRC_BATCH_SIZE;
}
function getExplicitImagePreviewUrls(
  _0x164524 = {},
  { displayFirst: displayFirst = ![], displayVersionKey: displayVersionKey = '' } = {},
) {
  _0x164524 = _0x164524 && typeof _0x164524 === 'object' ? _0x164524 : {};
  const _0x55ad07 = firstLocalPreviewUrl([
      _0x164524['thumbLocalPath'],
      _0x164524['previewLocalPath'],
      _0x164524['thumbnailLocalPath'],
      _0x164524['thumbUrl'],
      _0x164524['previewUrl'],
      _0x164524['thumbnailUrl'],
    ]),
    _0x12797b = versionCanvasImageDisplayUrl(
      firstLocalPreviewUrl([_0x164524['displayLocalPath'], _0x164524['displayUrl'], _0x164524['imageUrl']]),
      displayVersionKey,
    );
  return displayFirst ? [_0x12797b, _0x55ad07] : [_0x55ad07, _0x12797b];
}
function getExplicitVideoPreviewUrls(_0x37c014 = {}) {
  return (
    (_0x37c014 = _0x37c014 && typeof _0x37c014 === 'object' ? _0x37c014 : {}),
    [
      _0x37c014['posterLocalPath'],
      _0x37c014['thumbLocalPath'],
      _0x37c014['previewLocalPath'],
      _0x37c014['thumbnailLocalPath'],
      _0x37c014['videoThumbSrc'],
      _0x37c014['posterUrl'],
      _0x37c014['thumbUrl'],
      _0x37c014['previewUrl'],
      _0x37c014['thumbnailUrl'],
    ]
      ['map']((_0x383d13) => toCanvasLocalUrl(_0x383d13))
      ['filter'](isLikelyImagePreviewUrl)
  );
}
function hasExplicitPreviewValue(_0x7c8ede = {}, _0x135b9e = []) {
  if (!_0x7c8ede || typeof _0x7c8ede !== 'object') return ![];
  return _0x135b9e['some']((_0x30a55c) => !!String(_0x7c8ede[_0x30a55c] || '')['trim']());
}
function hasPreviewMediaHint(_0x235963 = {}, _0xe2b108 = 'node') {
  if (_0xe2b108 === 'image') {
    const _0xfc132f = getPrimaryListItem(_0x235963['images'], _0x235963['mainImageIndex']);
    return [_0x235963, _0xfc132f]['some']((_0x501127) =>
      hasExplicitPreviewValue(_0x501127, [
        'thumbLocalPath',
        'previewLocalPath',
        'thumbnailLocalPath',
        'thumbUrl',
        'previewUrl',
        'thumbnailUrl',
        'displayLocalPath',
        'displayUrl',
        'imageUrl',
      ]),
    );
  }
  if (_0xe2b108 === 'video') {
    const _0x1a7a23 = getPrimaryListItem(_0x235963['videos'], _0x235963['mainVideoIndex']);
    if (
      String(_0x235963['type'] || '')
        ['trim']()
        ['toLowerCase']() === 'ai-video' &&
      (isTaskFailed(_0x235963) ||
        isTaskCancelled(_0x235963) ||
        !!String(_0x1a7a23?.['error'] || '')['trim']())
    )
      return ![];
    const _0x5f4b75 = [_0x1a7a23];
    return (
      (!_0x1a7a23 || !Array['isArray'](_0x235963['videos']) || _0x235963['videos']['length'] <= 0x1) &&
        _0x5f4b75['push'](_0x235963),
      _0x5f4b75['some']((_0xd80627) =>
        hasExplicitPreviewValue(_0xd80627, [
          'posterLocalPath',
          'thumbLocalPath',
          'previewLocalPath',
          'thumbnailLocalPath',
          'videoThumbSrc',
          'posterUrl',
          'thumbUrl',
          'previewUrl',
          'thumbnailUrl',
        ]),
      )
    );
  }
  return ![];
}
function getPreviewMediaUrls(_0x29a4bb = {}, _0x5b3d62 = 'node', { displayFirst: displayFirst = ![] } = {}) {
  if (_0x5b3d62 === 'image') {
    const _0x185ad8 = getPrimaryListItemIndex(_0x29a4bb['images'], _0x29a4bb['mainImageIndex']),
      _0x44914a = getPrimaryListItem(_0x29a4bb['images'], _0x29a4bb['mainImageIndex']),
      _0x1e8fdc =
        displayFirst &&
        String(_0x29a4bb['type'] || '')
          ['toLowerCase']()
          ['includes']('ai-image')
          ? buildCanvasImageResultIdentityKey(_0x44914a || {}, _0x29a4bb, _0x185ad8)
          : '';
    return uniquePreviewUrls([
      ...getExplicitImagePreviewUrls(_0x29a4bb, { displayFirst: displayFirst, displayVersionKey: _0x1e8fdc }),
      ...getExplicitImagePreviewUrls(_0x44914a, { displayFirst: displayFirst, displayVersionKey: _0x1e8fdc }),
    ]);
  }
  if (_0x5b3d62 === 'video') {
    const _0xeb2ee0 = getPrimaryListItem(_0x29a4bb['videos'], _0x29a4bb['mainVideoIndex']),
      _0x1ab6ee = Array['isArray'](_0x29a4bb['videos']) ? _0x29a4bb['videos']['length'] : 0x0,
      _0x22dea7 =
        String(_0x29a4bb['type'] || '')
          ['trim']()
          ['toLowerCase']() === 'ai-video';
    if (
      _0x22dea7 &&
      (isTaskFailed(_0x29a4bb) ||
        isTaskCancelled(_0x29a4bb) ||
        !!String(_0xeb2ee0?.['error'] || '')['trim']())
    )
      return [];
    return uniquePreviewUrls([
      ...getExplicitVideoPreviewUrls(_0xeb2ee0),
      ...(_0x1ab6ee <= 0x1 ? getExplicitVideoPreviewUrls(_0x29a4bb) : []),
    ]);
  }
  return [];
}
function getNodePresentationMediaUrls(_0x53d0a8 = {}) {
  const _0x93faf = getPreviewKind(_0x53d0a8),
    _0x3fc41b = [
      ...getPreviewMediaUrls(_0x53d0a8, _0x93faf, { displayFirst: ![] }),
      ...getPreviewMediaUrls(_0x53d0a8, _0x93faf, { displayFirst: !![] }),
    ];
  if (_0x93faf === 'image') {
    const _0x2338d2 = getPrimaryListItem(_0x53d0a8['images'], _0x53d0a8['mainImageIndex']);
    for (const _0x5452eb of [_0x2338d2, _0x53d0a8]) {
      const _0x457cf2 = resolveCanvasImageSourceUrl(_0x5452eb || {});
      if (_0x457cf2) _0x3fc41b['push'](_0x457cf2);
    }
  }
  if (_0x93faf === 'video') {
    const _0x3e9ebb = getPrimaryListItem(_0x53d0a8['videos'], _0x53d0a8['mainVideoIndex']),
      _0x55def2 = resolveCanvasVideoDisplayUrl(_0x3e9ebb || {});
    if (_0x55def2) _0x3fc41b['push'](_0x55def2);
    if (!_0x3e9ebb || (Array['isArray'](_0x53d0a8['videos']) && _0x53d0a8['videos']['length'] <= 0x1)) {
      const _0x1d2075 = resolveCanvasVideoDisplayUrl(_0x53d0a8);
      if (_0x1d2075) _0x3fc41b['push'](_0x1d2075);
    }
  }
  return uniquePreviewUrls(_0x3fc41b);
}
function readPresentationMediaSource(_0x5b2706) {
  return String(
    _0x5b2706?.['dataset']?.['desktopMediaSourceUrl'] ||
      _0x5b2706?.['getAttribute']?.('src') ||
      _0x5b2706?.['currentSrc'] ||
      _0x5b2706?.['src'] ||
      '',
  )['trim']();
}
function canonicalizePresentationMediaSource(_0x144dd1) {
  const _0x34ef14 = String(_0x144dd1 || '')['trim']();
  if (!_0x34ef14) return '';
  if (/^(?:blob:|data:|aic-local-preview:)/i['test'](_0x34ef14)) return _0x34ef14;
  if (typeof URL !== 'function') return _0x34ef14;
  const _0x6f2fd = String(
    globalThis['document']?.['baseURI'] ||
      globalThis['location']?.['href'] ||
      globalThis['location']?.['origin'] ||
      'http://localhost/',
  );
  try {
    return new URL(_0x34ef14, _0x6f2fd)['href'];
  } catch {
    return _0x34ef14;
  }
}
function isPresentationMediaSourceForNode(_0x576497, _0x86a113) {
  if (!_0x86a113) return !![];
  const _0x523cfb = readPresentationMediaSource(_0x576497);
  if (!_0x523cfb) return ![];
  const _0x1430b6 = getNodePresentationMediaUrls(_0x86a113);
  if (_0x1430b6['includes'](_0x523cfb)) return !![];
  const _0x279d44 = canonicalizePresentationMediaSource(_0x523cfb);
  return _0x1430b6['some']((_0x45b452) => canonicalizePresentationMediaSource(_0x45b452) === _0x279d44);
}
export function resolveRendererPreviewNodePresentation(
  _0x5650f2 = {},
  { displayFirst: displayFirst = ![] } = {},
) {
  const _0x421a78 = getPreviewKind(_0x5650f2);
  return {
    kind: _0x421a78,
    text: getPreviewText(_0x5650f2, _0x421a78),
    geometry: getPreviewGeometry(_0x5650f2),
    sources: getPreviewMediaUrls(_0x5650f2, _0x421a78, { displayFirst: displayFirst }),
  };
}
function shouldUseFastPreviewLayer(_0x31f982, _0x43826f, _0x2587fe = {}) {
  const _0x572dc1 = Number['isFinite'](_0x2587fe['nodeCount'])
      ? _0x2587fe['nodeCount']
      : Object['keys'](_0x31f982 || {})['length'],
    _0x1453c7 = _0x43826f instanceof Set ? _0x43826f['size'] : 0x0;
  if (_0x2587fe['previewOnly'] === !![]) return _0x1453c7 > 0x0;
  return _0x572dc1 >= FAST_PREVIEW_NODE_COUNT_THRESHOLD || _0x1453c7 >= FAST_PREVIEW_CANDIDATE_THRESHOLD;
}
function createEmptyStats() {
  return {
    fastPreviewCount: 0x0,
    visibleFastPreviewCount: 0x0,
    previewWithMediaCount: 0x0,
    deferredMountedWithPreviewCount: 0x0,
    stagedPreviewCount: 0x0,
    connectedStagedPreviewCount: 0x0,
  };
}
function createPreviewEl(_0x54d717) {
  const _0x15e8c2 = document['createElement']('div');
  ((_0x15e8c2['className'] = 'v2-fast-preview-node'), (_0x15e8c2['dataset']['nodeId'] = _0x54d717));
  const _0x38e6ab = document['createElement']('div');
  return ((_0x38e6ab['className'] = 'v2-fast-preview-label'), _0x15e8c2['appendChild'](_0x38e6ab), _0x15e8c2);
}
function createPreviewSvgElement(_0x4fe7cc) {
  return typeof document['createElementNS'] === 'function'
    ? document['createElementNS']('http://www.w3.org/2000/svg', _0x4fe7cc)
    : document['createElement'](_0x4fe7cc);
}
function setPreviewSvgAttributes(_0x199499, _0x622b6) {
  for (const [_0x3e8144, _0x32ac16] of Object['entries'](_0x622b6)) {
    _0x199499['setAttribute'](_0x3e8144, _0x32ac16);
  }
  return _0x199499;
}
function createAudioPreviewWaveform(_0x18cb24) {
  const _0x43cf3f = document['createElement']('div');
  _0x43cf3f['className'] = 'waveform\x20' + _0x18cb24;
  const _0x22e3a1 = setPreviewSvgAttributes(createPreviewSvgElement('svg'), {
    width: '100%',
    height: '80',
    viewBox: '0 0 200 80',
    preserveAspectRatio: 'none',
  });
  return (
    _0x22e3a1['appendChild'](
      setPreviewSvgAttributes(createPreviewSvgElement('path'), {
        d: FAST_PREVIEW_AUDIO_WAVE_PATH,
        stroke: 'var(--blue)',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        fill: 'none',
      }),
    ),
    _0x22e3a1['appendChild'](
      setPreviewSvgAttributes(createPreviewSvgElement('path'), {
        d: 'M0,40 L200,40',
        stroke: 'var(--blue)',
        'stroke-width': '1',
        'stroke-dasharray': '2 4',
        opacity: '0.4',
        fill: 'none',
      }),
    ),
    _0x43cf3f['appendChild'](_0x22e3a1),
    _0x43cf3f
  );
}
function getAudioPreviewDuration(_0x3bd5e5 = {}) {
  const _0x15f12f = getPrimaryListItem(_0x3bd5e5['audios'], _0x3bd5e5['mainAudioIndex']);
  for (const _0x3229b4 of [
    _0x15f12f?.['audioDuration'],
    _0x15f12f?.['duration'],
    _0x3bd5e5['audioDuration'],
    _0x3bd5e5['duration'],
  ]) {
    const _0x11efd9 = Number(_0x3229b4);
    if (Number['isFinite'](_0x11efd9) && _0x11efd9 > 0x0) return _0x11efd9;
  }
  return 0x0;
}
function formatAudioPreviewTime(_0x21292b) {
  const _0xed8e40 = Math['max'](0x0, Math['floor'](Number(_0x21292b) || 0x0)),
    _0x3fc94c = Math['floor'](_0xed8e40 / 0xe10),
    _0x53d9c8 = Math['floor']((_0xed8e40 % 0xe10) / 0x3c),
    _0xaa1d2b = String(_0xed8e40 % 0x3c)['padStart'](0x2, '0');
  return _0x3fc94c > 0x0
    ? _0x3fc94c + ':' + String(_0x53d9c8)['padStart'](0x2, '0') + ':' + _0xaa1d2b
    : _0x53d9c8 + ':' + _0xaa1d2b;
}
function getAudioPreviewTimeText(_0x536589 = {}) {
  return '0:00 / ' + formatAudioPreviewTime(getAudioPreviewDuration(_0x536589));
}
function ensureAudioPreviewContent(_0x522dc2, _0x1fcdb4, _0x165be1) {
  let _0x11b796 = _0x522dc2['querySelector']('.v2-fast-preview-audio-card');
  if (!_0x11b796) {
    ((_0x11b796 = document['createElement']('div')),
      (_0x11b796['className'] = 'v2-fast-preview-audio-card audio-card'),
      _0x11b796['appendChild'](createAudioPreviewWaveform('waveform-bg')),
      _0x11b796['appendChild'](createAudioPreviewWaveform('waveform-unplayed')));
    const _0x55f181 = document['createElement']('div');
    _0x55f181['className'] = 'audio-controls';
    const _0x23b19a = document['createElement']('button');
    ((_0x23b19a['className'] = 'audio-play-btn'),
      _0x23b19a['setAttribute']('type', 'button'),
      _0x23b19a['setAttribute']('tabindex', '-1'),
      _0x23b19a['setAttribute']('aria-hidden', 'true'));
    const _0x252323 = setPreviewSvgAttributes(createPreviewSvgElement('svg'), {
      width: '12',
      height: '12',
      viewBox: '0 0 24 24',
      fill: 'currentColor',
    });
    (_0x252323['appendChild'](
      setPreviewSvgAttributes(createPreviewSvgElement('polygon'), {
        points: '5\x203\x2019\x2012\x205\x2021\x205\x203',
      }),
    ),
      _0x23b19a['appendChild'](_0x252323),
      _0x55f181['appendChild'](_0x23b19a));
    const _0x5ce838 = document['createElement']('div');
    _0x5ce838['className'] = 'audio-time-wrap';
    const _0xc47eeb = document['createElement']('span');
    ((_0xc47eeb['className'] = 'audio-time-display'),
      _0x5ce838['appendChild'](_0xc47eeb),
      _0x55f181['appendChild'](_0x5ce838),
      _0x11b796['appendChild'](_0x55f181),
      _0x522dc2['prepend'](_0x11b796));
  }
  const _0x453c1a = _0x11b796['querySelector']('.audio-time-display'),
    _0x155bbc = getAudioPreviewTimeText(_0x1fcdb4);
  if (_0x453c1a && _0x453c1a['textContent'] !== _0x155bbc) _0x453c1a['textContent'] = _0x155bbc;
  const _0x424436 = _0x522dc2['querySelector']('.v2-fast-preview-label');
  if (!_0x424436) return;
  _0x424436['className'] = 'v2-fast-preview-label v2-fast-preview-audio-label node-label';
  if (_0x424436['dataset']['audioPreviewLabel'] !== '1') {
    for (const _0x57cd44 of Array['from'](_0x424436['children'] || [])) _0x57cd44['remove']?.();
    _0x424436['textContent'] = '';
    const _0x271a41 = document['createElement']('span');
    ((_0x271a41['className'] = 'node-label-icon'), (_0x271a41['dataset']['labelKind'] = 'audio'));
    const _0x3e58b9 = document['createElement']('span');
    ((_0x3e58b9['className'] = 'node-label-text'),
      _0x424436['appendChild'](_0x271a41),
      _0x424436['appendChild'](_0x3e58b9),
      (_0x424436['dataset']['audioPreviewLabel'] = '1'));
  }
  const _0x38eb73 = _0x424436['querySelector']('.node-label-text');
  if (_0x38eb73 && _0x38eb73['textContent'] !== _0x165be1) _0x38eb73['textContent'] = _0x165be1;
}
function resetAudioPreviewContent(_0x291d63, _0x275437) {
  _0x291d63['querySelector']('.v2-fast-preview-audio-card')?.['remove']?.();
  const _0x399b6f = _0x291d63['querySelector']('.v2-fast-preview-label');
  if (!_0x399b6f) return;
  if (_0x399b6f['dataset']['audioPreviewLabel'] === '1') {
    for (const _0x5b8890 of Array['from'](_0x399b6f['children'] || [])) _0x5b8890['remove']?.();
    delete _0x399b6f['dataset']['audioPreviewLabel'];
  }
  _0x399b6f['className'] = 'v2-fast-preview-label';
  if (_0x399b6f['textContent'] !== _0x275437) _0x399b6f['textContent'] = _0x275437;
}
function syncPreviewStaticContent(_0x55183b, _0x441c5b, _0x224982, _0x1ea0ae) {
  if (_0x224982 === 'audio') ensureAudioPreviewContent(_0x55183b, _0x441c5b, _0x1ea0ae);
  else resetAudioPreviewContent(_0x55183b, _0x1ea0ae);
}
function getPreviewGeometry(_0x5a657e = {}) {
  const _0x2c0dc4 = toNumber(_0x5a657e['x'], 0x0),
    _0x5d3c19 = toNumber(_0x5a657e['y'], 0x0),
    _0x268b33 = Math['max'](0x1, toNumber(_0x5a657e['width'], 0xa0)),
    _0xb3d57d = Math['max'](0x1, toNumber(_0x5a657e['height'], 0x78));
  return { x: _0x2c0dc4, y: _0x5d3c19, width: _0x268b33, height: _0xb3d57d };
}
function setPreviewMediaSrc(_0x4c54a8, _0x1f7115, _0x5f1490) {
  const _0x89802d = _0x1f7115[_0x5f1490] || '';
  if (!_0x89802d) return ![];
  return (
    (_0x4c54a8['dataset']['srcIndex'] = String(_0x5f1490)),
    _0x4c54a8['getAttribute']?.('src') !== _0x89802d &&
      _0x4c54a8['src'] !== _0x89802d &&
      (delete _0x4c54a8['dataset']['previewLoaded'],
      trackCanvasImageDisplayLoad(_0x89802d, _0x4c54a8),
      (_0x4c54a8['src'] = _0x89802d)),
    !![]
  );
}
function getPreviewMediaCurrentSrc(_0x2e8aa5) {
  return String(_0x2e8aa5?.['getAttribute']?.('src') || _0x2e8aa5?.['src'] || '')['trim']();
}
function clearPreviewMediaSrc(_0x3b9f33) {
  if (!_0x3b9f33) return;
  (forgetCanvasImageDisplayLoad(_0x3b9f33), (_0x3b9f33['onload'] = null), (_0x3b9f33['onerror'] = null));
  if (isCanvasImagePreloadSharedImage(_0x3b9f33)) {
    _0x3b9f33['remove']?.();
    return;
  }
  (_0x3b9f33['removeAttribute']?.('src'),
    (_0x3b9f33['src'] = ''),
    (_0x3b9f33['_previewSources'] = []),
    (_0x3b9f33['_previewSrcPreloadUrl'] = ''),
    (_0x3b9f33['_previewMediaQueuePriority'] = null),
    (_0x3b9f33['_previewMediaSrcBatchLimit'] = null),
    (_0x3b9f33['_previewVideoMediaSrcBatchLimit'] = null),
    (_0x3b9f33['_previewDirectWhenBlank'] = ![]),
    (_0x3b9f33['_previewPresentedNotificationKey'] = ''));
  if (_0x3b9f33['style']) _0x3b9f33['style']['visibility'] = '';
  (delete _0x3b9f33['dataset']['srcIndex'],
    delete _0x3b9f33['dataset']['previewLoaded'],
    delete _0x3b9f33['dataset']['previewKind'],
    delete _0x3b9f33['dataset']['previewCritical']);
}
function isPreviewMediaLoaded(_0x44f2bb) {
  if (!getPreviewMediaCurrentSrc(_0x44f2bb)) return ![];
  return (
    _0x44f2bb?.['dataset']?.['previewLoaded'] === '1' ||
    _0x44f2bb?.['complete'] === !![] ||
    Number(_0x44f2bb?.['naturalWidth'] || 0x0) > 0x0 ||
    Number(_0x44f2bb?.['naturalHeight'] || 0x0) > 0x0
  );
}
function getPreviewRasterFrameEl(_0x354deb) {
  return _0x354deb?.['querySelector']?.('.v2-fast-preview-raster-frame') || null;
}
function isPreviewRasterFrameReady(_0x468005) {
  const _0x5a5261 = getPreviewRasterFrameEl(_0x468005);
  return !!_0x5a5261 && _0x5a5261['isConnected'] !== ![];
}
function restorePreviewRasterFrameState(_0x530c7c) {
  if (!getPreviewRasterFrameEl(_0x530c7c)) return ![];
  return (
    (_0x530c7c['dataset']['hasMedia'] = '1'),
    (_0x530c7c['dataset']['rasterFrame'] = '1'),
    delete _0x530c7c['dataset']['placeholderReady'],
    !![]
  );
}
function removePreviewRasterFrame(_0x190e56) {
  const _0x50b0c0 = getPreviewRasterFrameEl(_0x190e56);
  (_0x50b0c0?.['remove']?.(), delete _0x190e56?.['_previewRasterFrame']);
  if (!_0x190e56?.['dataset']) return !!_0x50b0c0;
  delete _0x190e56['dataset']['rasterFrame'];
  const _0x135354 = _0x190e56['querySelector']?.('.v2-fast-preview-media');
  if (!isPreviewMediaLoaded(_0x135354)) delete _0x190e56['dataset']['hasMedia'];
  return !!_0x50b0c0;
}
function attachPreviewRasterFrame(_0x16490d, _0xf7f125) {
  const _0x2432c3 = _0xf7f125?.['canvas'];
  if (!_0x16490d || !_0x2432c3) return ![];
  const _0x495877 = getPreviewRasterFrameEl(_0x16490d);
  if (_0x495877 && _0x495877 !== _0x2432c3) _0x495877['remove']?.();
  ((_0x2432c3['className'] = 'v2-fast-preview-raster-frame'),
    _0x2432c3['classList']?.['add']?.('v2-fast-preview-raster-frame'));
  _0x2432c3['dataset'] &&
    (_0x2432c3['dataset']['nodeId'] = String(_0xf7f125['nodeId'] || _0x16490d['dataset']?.['nodeId'] || ''));
  _0x2432c3['setAttribute']?.('aria-hidden', 'true');
  if (_0x2432c3['parentNode'] !== _0x16490d) _0x16490d['appendChild']?.(_0x2432c3);
  return ((_0x16490d['_previewRasterFrame'] = _0xf7f125), restorePreviewRasterFrameState(_0x16490d));
}
function isPreviewRasterFrameCompatible(_0x4d53b0, _0x1a65d7) {
  const _0x3e0af = _0x4d53b0?.['_previewRasterFrame'];
  if (!_0x3e0af || _0x4d53b0?.['_previewDragActive'] === !![]) return !![];
  if (_0x3e0af['kind'] && _0x1a65d7?.['kind'] && _0x3e0af['kind'] !== _0x1a65d7['kind']) return ![];
  if (
    Number['isFinite'](Number(_0x3e0af['width'])) &&
    Number['isFinite'](Number(_0x1a65d7?.['geometry']?.['width'])) &&
    Number(_0x3e0af['width']) !== Number(_0x1a65d7['geometry']['width'])
  )
    return ![];
  if (
    Number['isFinite'](Number(_0x3e0af['height'])) &&
    Number['isFinite'](Number(_0x1a65d7?.['geometry']?.['height'])) &&
    Number(_0x3e0af['height']) !== Number(_0x1a65d7['geometry']['height'])
  )
    return ![];
  const _0x2f9d0b = uniquePreviewUrls(_0x3e0af['sources'] || []),
    _0x4dcb77 = uniquePreviewUrls(_0x1a65d7?.['sources'] || []);
  if (_0x2f9d0b['length'] === 0x0 || _0x4dcb77['length'] === 0x0) return !![];
  const _0x15d420 = new Set(_0x4dcb77);
  return _0x2f9d0b['some']((_0x250b0b) => _0x15d420['has'](_0x250b0b));
}
function isPreviewMediaRequestInFlight(_0x159170) {
  return (
    !!getPreviewMediaCurrentSrc(_0x159170) &&
    _0x159170?.['dataset']?.['previewLoaded'] !== '1' &&
    _0x159170?.['complete'] !== !![] &&
    Number(_0x159170?.['naturalWidth'] || 0x0) <= 0x0 &&
    Number(_0x159170?.['naturalHeight'] || 0x0) <= 0x0
  );
}
function isPreviewMediaResourceProtected(_0x153c8a) {
  return (
    isCanvasImageDisplayLoadTracked(_0x153c8a) ||
    isPreviewMediaRequestInFlight(_0x153c8a) ||
    isCanvasImagePreloadSharedImage(_0x153c8a)
  );
}
function isPreviewVideoMedia(_0x1fe3ce) {
  return String(_0x1fe3ce?.['dataset']?.['previewKind'] || '')['trim']() === 'video';
}
function isPreviewCriticalMedia(_0x4a822e) {
  return _0x4a822e?.['dataset']?.['previewCritical'] === '1';
}
function getReusableLoadedPreviewMediaSource(_0x501c0e, _0x1ec9f4) {
  const _0x32b3d9 = _0x501c0e?.['querySelector']?.('.v2-fast-preview-media');
  if (!isPreviewMediaLoaded(_0x32b3d9)) return '';
  const _0x50faac = getPreviewMediaCurrentSrc(_0x32b3d9);
  if (!_0x50faac) return '';
  const _0x48c6a2 = uniquePreviewUrls(Array['isArray'](_0x1ec9f4) ? _0x1ec9f4 : [_0x1ec9f4]);
  return _0x48c6a2['includes'](_0x50faac) ? _0x50faac : '';
}
function hasRetainablePaintedPreviewMedia(_0x3579cf, { includeImages: includeImages = ![] } = {}) {
  const _0x45fa02 = _0x3579cf?.['querySelector']?.('.v2-fast-preview-media');
  return isPreviewMediaLoaded(_0x45fa02) && (includeImages || isPreviewVideoMedia(_0x45fa02));
}
function getRetainablePaintedPreviewMediaSource(_0x260dfa, _0xe4ac92) {
  if (!hasRetainablePaintedPreviewMedia(_0x260dfa, { includeImages: !![] })) return '';
  return getReusableLoadedPreviewMediaSource(_0x260dfa, _0xe4ac92);
}
function restorePaintedPreviewMedia(_0x4f7df0) {
  const _0xdd3fa6 = _0x4f7df0?.['querySelector']?.('.v2-fast-preview-media');
  if (!isPreviewMediaLoaded(_0xdd3fa6)) return ![];
  delete _0xdd3fa6['dataset']['previewResourceOnly'];
  if (_0xdd3fa6['style']) _0xdd3fa6['style']['visibility'] = '';
  _0x4f7df0['dataset']['hasMedia'] = '1';
  const _0xd8be2d = Array['isArray'](_0xdd3fa6['_previewSources'])
    ? _0xdd3fa6['_previewSources']['length']
    : 0x0;
  if (_0xd8be2d > 0x0) _0x4f7df0['dataset']['previewSrcCount'] = String(_0xd8be2d);
  return !![];
}
function getReusableCurrentPreviewMediaSource(_0x3651b8, _0x1f86d3) {
  const _0x2baa24 = _0x3651b8?.['querySelector']?.('.v2-fast-preview-media'),
    _0x118b79 =
      getPreviewMediaCurrentSrc(_0x2baa24) || String(_0x2baa24?.['_previewSrcPreloadUrl'] || '')['trim']();
  if (!_0x118b79) return '';
  const _0x1b2d97 = uniquePreviewUrls(Array['isArray'](_0x1f86d3) ? _0x1f86d3 : [_0x1f86d3]);
  return _0x1b2d97['includes'](_0x118b79) ? _0x118b79 : '';
}
function nextPreviewMediaPreloadToken(_0x3687cf) {
  if (!_0x3687cf) return 0x0;
  const _0x39d8c5 = (Number(_0x3687cf['_previewSrcPreloadToken']) || 0x0) + 0x1;
  return ((_0x3687cf['_previewSrcPreloadToken'] = _0x39d8c5), _0x39d8c5);
}
function isPreviewMediaPreloadCurrent(_0x146279, _0x51e73e, _0x3462ee, _0x229534 = 0x0) {
  if (!_0x146279 || _0x146279['isConnected'] === ![]) return ![];
  if (_0x146279['_previewSrcPreloadToken'] !== _0x3462ee) return ![];
  const _0x5c4b25 = _0x146279['_previewSources'] || [];
  return String(_0x5c4b25[_0x229534] || '')['trim']() === String(_0x51e73e || '')['trim']();
}
function resolvePreviewMediaPreloadPriority(_0xaf0900, { viewportBusy: viewportBusy = ![] } = {}) {
  if (viewportBusy) return FAST_PREVIEW_BUSY_MEDIA_PRELOAD_PRIORITY;
  if (_0xaf0900?.['loading'] === 'lazy') return FAST_PREVIEW_LOW_PRIORITY_MEDIA_PRELOAD_PRIORITY;
  return FAST_PREVIEW_MEDIA_PRELOAD_PRIORITY;
}
function applyPreviewMediaSrcAfterPreload(_0x11dd8a, _0x400f03, _0x10e6f6 = 0x0, _0x272618 = {}) {
  const _0x4c74c2 = _0x400f03[_0x10e6f6] || '';
  if (!_0x4c74c2) return ![];
  const _0x3c3112 = _0x11dd8a['getAttribute']?.('src') || _0x11dd8a['src'] || '';
  if (_0x3c3112 === _0x4c74c2) return !![];
  if (String(_0x11dd8a['_previewSrcPreloadUrl'] || '')['trim']() === _0x4c74c2) return !![];
  const _0x1cd01b = !isPreviewVideoMedia(_0x11dd8a) && isCanvasImagePreloadCoolingDown(_0x4c74c2);
  if (_0x1cd01b) return !![];
  if (
    _0x272618['directWhenBlank'] === !![] &&
    !_0x3c3112 &&
    (isPreviewVideoMedia(_0x11dd8a) || !isCanvasImagePreloadPending(_0x4c74c2))
  )
    return setPreviewMediaSrc(_0x11dd8a, _0x400f03, _0x10e6f6);
  if (/^(data:image\/|blob:)/i['test'](_0x4c74c2) || typeof Image !== 'function')
    return setPreviewMediaSrc(_0x11dd8a, _0x400f03, _0x10e6f6);
  const _0x2c43b6 = nextPreviewMediaPreloadToken(_0x11dd8a);
  return (
    (_0x11dd8a['_previewSrcPreloadUrl'] = _0x4c74c2),
    preloadCanvasImage(_0x4c74c2, {
      decode: _0x272618['decode'] === !![],
      requireImage: !![],
      priority: resolvePreviewMediaPreloadPriority(_0x11dd8a, _0x272618),
      fetchPriority: _0x11dd8a?.['fetchPriority'] === 'high' ? 'high' : 'auto',
      scope: FAST_PREVIEW_MEDIA_PRELOAD_SCOPE,
      deferWhenPaused: _0x272618['viewportBusy'] === !![] || _0x11dd8a?.['loading'] === 'lazy',
    })['then'](
      () => {
        if (!isPreviewMediaPreloadCurrent(_0x11dd8a, _0x4c74c2, _0x2c43b6, _0x10e6f6)) return;
        (setPreviewMediaSrc(_0x11dd8a, _0x400f03, _0x10e6f6), (_0x11dd8a['_previewSrcPreloadUrl'] = ''));
      },
      () => {
        if (!isPreviewMediaPreloadCurrent(_0x11dd8a, _0x4c74c2, _0x2c43b6, _0x10e6f6)) return;
        _0x11dd8a['_previewSrcPreloadUrl'] = '';
      },
    ),
    !![]
  );
}
function setPreviewMediaSrcJoiningSharedAcquisition(_0x395873, _0x15260c, _0x79567d = 0x0, _0x6b887e = {}) {
  const _0x12829d = _0x15260c[_0x79567d] || '';
  if (!_0x12829d) return ![];
  if (
    !isPreviewVideoMedia(_0x395873) &&
    !/^(data:image\/|blob:)/i['test'](_0x12829d) &&
    _0x6b887e['directWhenBlank'] !== !![] &&
    (isCanvasImagePreloadPending(_0x12829d) || isCanvasImagePreloadCoolingDown(_0x12829d))
  )
    return applyPreviewMediaSrcAfterPreload(_0x395873, _0x15260c, _0x79567d, {
      ..._0x6b887e,
      directWhenBlank: ![],
    });
  return setPreviewMediaSrc(_0x395873, _0x15260c, _0x79567d);
}
export function cancelRendererFastPreviewMediaPreloads({
  includeActive: includeActive = ![],
  belowPriority: belowPriority = null,
  reason: reason = 'canceled',
} = {}) {
  return cancelQueuedCanvasImagePreloads({
    scope: FAST_PREVIEW_MEDIA_PRELOAD_SCOPE,
    includeActive: includeActive,
    belowPriority: belowPriority,
    reason: reason,
  });
}
function previewMediaNeedsSrc(_0x1815c9, _0x57555a) {
  const _0xa8eb0d = uniquePreviewUrls(Array['isArray'](_0x57555a) ? _0x57555a : [_0x57555a])[0x0] || '';
  if (!_0xa8eb0d) return ![];
  const _0xd75215 = _0x1815c9?.['querySelector']?.('.v2-fast-preview-media');
  if (!_0xd75215) return !![];
  return (_0xd75215['getAttribute']?.('src') || _0xd75215['src'] || '') !== _0xa8eb0d;
}
function syncPreviewMedia(_0x3b9e1e, _0x2d73f9, _0x37f725, _0xe987d8 = {}) {
  let _0x1d99b6 = _0x3b9e1e['querySelector']('.v2-fast-preview-media');
  const _0x486379 = uniquePreviewUrls(Array['isArray'](_0x2d73f9) ? _0x2d73f9 : [_0x2d73f9]),
    _0xaf8281 = getPreviewMediaCurrentSrc(_0x1d99b6);
  _0x486379['length'] > 0x0 &&
    _0xaf8281 &&
    !_0x486379['includes'](_0xaf8281) &&
    isCanvasImagePreloadSharedImage(_0x1d99b6) &&
    ((_0x1d99b6['onload'] = null),
    (_0x1d99b6['onerror'] = null),
    _0x1d99b6['remove']?.(),
    (_0x1d99b6 = null));
  if (_0x486379['length'] === 0x0) {
    if (_0x1d99b6) _0xe987d8['cancelPendingMediaSrc']?.(_0x1d99b6);
    const _0x59a937 =
      _0xe987d8['preserveInFlightResource'] !== ![] &&
      _0xe987d8['placeholderReady'] !== !![] &&
      isPreviewMediaResourceProtected(_0x1d99b6);
    if (_0x59a937) {
      _0x1d99b6['dataset']['previewResourceOnly'] = '1';
      if (_0x1d99b6['style']) _0x1d99b6['style']['visibility'] = 'hidden';
    } else (clearPreviewMediaSrc(_0x1d99b6), _0x1d99b6?.['remove']?.());
    return (
      delete _0x3b9e1e['dataset']['hasMedia'],
      delete _0x3b9e1e['dataset']['previewSrcCount'],
      _0xe987d8['placeholderReady'] === !![]
        ? (_0x3b9e1e['dataset']['placeholderReady'] = '1')
        : delete _0x3b9e1e['dataset']['placeholderReady'],
      { imageCount: 0x0, srcAssignedCount: 0x0 }
    );
  }
  delete _0x3b9e1e['dataset']['placeholderReady'];
  if (!_0x1d99b6) {
    ((_0x1d99b6 = document['createElement']('img')),
      (_0x1d99b6['className'] = 'v2-fast-preview-media'),
      (_0x1d99b6['decoding'] = 'async'),
      (_0x1d99b6['alt'] = ''));
    if (typeof _0x3b9e1e['insertBefore'] === 'function')
      _0x3b9e1e['insertBefore'](_0x1d99b6, _0x3b9e1e['firstChild'] || null);
    else
      typeof _0x3b9e1e['prepend'] === 'function'
        ? _0x3b9e1e['prepend'](_0x1d99b6)
        : _0x3b9e1e['appendChild'](_0x1d99b6);
  }
  const _0x567005 = _0xe987d8['loading'] === 'lazy' ? 'lazy' : 'eager',
    _0x2576a1 = _0xe987d8['fetchPriority'] === 'auto' ? 'auto' : 'high';
  if (_0x1d99b6['loading'] !== _0x567005) _0x1d99b6['loading'] = _0x567005;
  try {
    if (_0x1d99b6['fetchPriority'] !== _0x2576a1) _0x1d99b6['fetchPriority'] = _0x2576a1;
  } catch {}
  _0x1d99b6['dataset']['previewKind'] = String(_0xe987d8['kind'] || '');
  if (_0xe987d8['critical'] === !![]) _0x1d99b6['dataset']['previewCritical'] = '1';
  else delete _0x1d99b6['dataset']['previewCritical'];
  ((_0x1d99b6['_previewSources'] = _0x486379),
    (_0x1d99b6['_previewMediaQueuePriority'] = _0xe987d8['queuePriority'] || null),
    (_0x1d99b6['_previewMediaSrcBatchLimit'] =
      _0xe987d8['mediaSrcBatchLimit'] != null && Number['isFinite'](Number(_0xe987d8['mediaSrcBatchLimit']))
        ? Math['max'](0x0, Math['trunc'](Number(_0xe987d8['mediaSrcBatchLimit'])))
        : null),
    (_0x1d99b6['_previewVideoMediaSrcBatchLimit'] =
      _0xe987d8['videoMediaSrcBatchLimit'] != null &&
      Number['isFinite'](Number(_0xe987d8['videoMediaSrcBatchLimit']))
        ? Math['max'](0x0, Math['trunc'](Number(_0xe987d8['videoMediaSrcBatchLimit'])))
        : null),
    (_0x1d99b6['_previewDirectWhenBlank'] = _0xe987d8['directWhenBlank'] === !![]),
    delete _0x1d99b6['dataset']['previewResourceOnly']);
  if (_0x1d99b6['style']) _0x1d99b6['style']['visibility'] = '';
  const _0x6b68a9 = () => {
    const _0x5bc479 = String(_0x1d99b6['getAttribute']?.('src') || _0x1d99b6['src'] || '')['trim']();
    if (!_0x5bc479 || !isPreviewMediaLoaded(_0x1d99b6)) return;
    if (
      String(_0x1d99b6['tagName'] || '')['toLowerCase']() === 'img' &&
      (_0x1d99b6['complete'] === ![] || Number(_0x1d99b6['naturalWidth'] || 0x0) <= 0x0)
    )
      return;
    const _0x56756f = String(_0xe987d8['nodeId'] || '') + '\x00' + _0x5bc479;
    if (_0x1d99b6['_previewPresentedNotificationKey'] === _0x56756f) return;
    _0x1d99b6['_previewPresentedNotificationKey'] = _0x56756f;
    try {
      _0xe987d8['onMediaPresented']?.(String(_0xe987d8['nodeId'] || ''), _0x1d99b6);
    } catch {}
  };
  ((_0x1d99b6['onload'] = () => {
    forgetCanvasImageDisplayLoad(_0x1d99b6);
    const _0x3565e9 = String(_0x1d99b6['getAttribute']?.('src') || _0x1d99b6['src'] || '')['trim']();
    if (!_0x3565e9) return;
    ((_0x1d99b6['dataset']['previewLoaded'] = '1'),
      rememberCanvasImagePreloadResolved(
        _0x3565e9,
        {
          image: _0x1d99b6,
          naturalWidth: _0x1d99b6['naturalWidth'] || _0x1d99b6['width'] || 0x0,
          naturalHeight: _0x1d99b6['naturalHeight'] || _0x1d99b6['height'] || 0x0,
        },
        { retainImage: !![] },
      ),
      _0x6b68a9());
  }),
    (_0x1d99b6['onerror'] = () => {
      (forgetCanvasImageDisplayLoad(_0x1d99b6), delete _0x1d99b6['dataset']['previewLoaded']);
      const _0x4bd42f = Math['max'](0x0, Number(_0x1d99b6['dataset']?.['srcIndex']) || 0x0),
        _0xf3549c = _0x4bd42f + 0x1;
      !applyPreviewMediaSrcAfterPreload(_0x1d99b6, _0x1d99b6['_previewSources'] || [], _0xf3549c) &&
        (_0x1d99b6['onerror'] = null);
    }));
  if (_0xe987d8['deferSrc'] === !![]) _0xe987d8['scheduleMediaSrc']?.(_0x1d99b6);
  else {
    _0xe987d8['cancelPendingMediaSrc']?.(_0x1d99b6);
    let _0x515349 = ![];
    if (_0xe987d8['fallbackWhileDecoding'] === !![]) {
      const _0x5eba73 = getPreviewMediaCurrentSrc(_0x1d99b6),
        _0x5da99f = !_0x5eba73 && _0x486379['length'] > 0x1;
      (_0x5da99f &&
        (_0x515349 = setPreviewMediaSrcJoiningSharedAcquisition(_0x1d99b6, _0x486379, 0x1, {
          decode: ![],
          viewportBusy: _0xe987d8['viewportBusy'] === !![],
        })),
        _0xe987d8['holdFallbackWhileBusy'] !== !![] &&
          (_0x515349 = applyPreviewMediaSrcAfterPreload(_0x1d99b6, _0x486379, 0x0, {
            decode: !![],
            directWhenBlank: _0xe987d8['directWhenBlank'] === !![] && !_0x5da99f,
            viewportBusy: _0xe987d8['viewportBusy'] === !![],
          })));
    } else
      _0x515349 = setPreviewMediaSrcJoiningSharedAcquisition(_0x1d99b6, _0x486379, 0x0, {
        decode: _0xe987d8['kind'] === 'image',
        directWhenBlank: _0xe987d8['directWhenBlank'] === !![],
        viewportBusy: _0xe987d8['viewportBusy'] === !![],
      });
    return (
      (_0x1d99b6['alt'] = _0x37f725 || ''),
      (_0x3b9e1e['dataset']['hasMedia'] = '1'),
      (_0x3b9e1e['dataset']['previewSrcCount'] = String(_0x486379['length'])),
      _0x6b68a9(),
      { imageCount: 0x1, srcAssignedCount: _0x515349 ? 0x1 : 0x0 }
    );
  }
  return (
    (_0x1d99b6['alt'] = _0x37f725 || ''),
    (_0x3b9e1e['dataset']['hasMedia'] = '1'),
    (_0x3b9e1e['dataset']['previewSrcCount'] = String(_0x486379['length'])),
    _0x6b68a9(),
    { imageCount: 0x1, srcAssignedCount: 0x0 }
  );
}
function syncPreviewEl(
  _0x2bc629,
  _0x423970,
  {
    kind: _0x4a8e94,
    text: _0x44e5ad,
    sources: _0x2f4c6e,
    geometry: _0x7f50c7,
    offsetX: offsetX = 0x0,
    offsetY: offsetY = 0x0,
    mediaLoading: mediaLoading = 'eager',
    mediaFetchPriority: mediaFetchPriority = 'high',
    mediaCritical: mediaCritical = ![],
    mediaDirectWhenBlank: mediaDirectWhenBlank = ![],
    mediaFallbackWhileDecoding: mediaFallbackWhileDecoding = ![],
    mediaHoldFallbackWhileBusy: mediaHoldFallbackWhileBusy = ![],
    viewportBusy: viewportBusy = ![],
    queuePriority: queuePriority = null,
    mediaSrcBatchLimit: mediaSrcBatchLimit = null,
    videoMediaSrcBatchLimit: videoMediaSrcBatchLimit = null,
    deferMediaSrc: deferMediaSrc = ![],
    placeholderReady: placeholderReady = ![],
    preserveInFlightResource: preserveInFlightResource = !![],
    scheduleMediaSrc: scheduleMediaSrc = null,
    cancelPendingMediaSrc: cancelPendingMediaSrc = null,
    onMediaPresented: onMediaPresented = null,
  },
) {
  const {
      x: _0x5d4881,
      y: _0x5cc187,
      width: _0x4ab350,
      height: _0x375d2f,
    } = _0x7f50c7 || getPreviewGeometry(_0x423970),
    _0x1aba6a = _0x5d4881 - offsetX,
    _0x22c030 = _0x5cc187 - offsetY,
    _0x13f8a2 = Array['isArray'](_0x2f4c6e) ? _0x2f4c6e['join']('>') : String(_0x2f4c6e || ''),
    _0x27e3d5 = _0x1aba6a + ',' + _0x22c030 + ',' + _0x4ab350 + ',' + _0x375d2f,
    _0x42f731 = _0x4a8e94 === 'audio' ? getAudioPreviewTimeText(_0x423970) : '',
    _0x4a8563 =
      _0x4a8e94 + '|' + _0x44e5ad + '|' + _0x13f8a2 + '|' + (placeholderReady ? 0x1 : 0x0) + '|' + _0x42f731,
    _0x36204b = _0x2bc629['_previewGeometrySig'] !== _0x27e3d5,
    _0x2d1075 = _0x2bc629['_previewContentSig'] !== _0x4a8563;
  if (!_0x2d1075) {
    const _0x554ff7 = _0x2bc629['querySelector']('.v2-fast-preview-media'),
      _0x32f2d2 = (!Array['isArray'](_0x2f4c6e) || _0x2f4c6e['length'] === 0x0) && !!_0x554ff7,
      _0xb26031 =
        _0x32f2d2 ||
        previewMediaNeedsSrc(_0x2bc629, _0x2f4c6e) ||
        (_0x554ff7 &&
          (_0x554ff7['loading'] !== mediaLoading || _0x554ff7['fetchPriority'] !== mediaFetchPriority));
    if (!_0x36204b && !_0xb26031) return;
  }
  if (_0x36204b) {
    const _0x23a3d7 = _0x4ab350 + 'px',
      _0x41b305 = _0x375d2f + 'px';
    if (_0x2bc629['style']['width'] !== _0x23a3d7) _0x2bc629['style']['width'] = _0x23a3d7;
    if (_0x2bc629['style']['height'] !== _0x41b305) _0x2bc629['style']['height'] = _0x41b305;
    ((_0x2bc629['_previewBaseX'] = _0x1aba6a),
      (_0x2bc629['_previewBaseY'] = _0x22c030),
      (_0x2bc629['_previewGeometrySig'] = _0x27e3d5));
  }
  let _0x2d1370 = ![];
  if (_0x2d1075) {
    const _0x5eb3fc = 'v2-fast-preview-node v2-fast-preview-node--' + _0x4a8e94;
    _0x2bc629['className'] !== _0x5eb3fc && ((_0x2bc629['className'] = _0x5eb3fc), (_0x2d1370 = !![]));
    if (_0x2bc629['dataset']['kind'] !== _0x4a8e94) _0x2bc629['dataset']['kind'] = _0x4a8e94;
    (syncPreviewStaticContent(_0x2bc629, _0x423970, _0x4a8e94, _0x44e5ad),
      (_0x2bc629['_previewContentSig'] = _0x4a8563));
  }
  if (_0x36204b || _0x2d1370) applyPreviewDragTransform(_0x2bc629);
  const _0x508aba = _0x2bc629['querySelector']('.v2-fast-preview-media'),
    _0xa5e6da = (!Array['isArray'](_0x2f4c6e) || _0x2f4c6e['length'] === 0x0) && !!_0x508aba,
    _0x2c8675 =
      _0x2d1075 ||
      _0xa5e6da ||
      previewMediaNeedsSrc(_0x2bc629, _0x2f4c6e) ||
      (_0x508aba &&
        (_0x508aba['loading'] !== mediaLoading || _0x508aba['fetchPriority'] !== mediaFetchPriority));
  if (!_0x2c8675) return;
  return syncPreviewMedia(_0x2bc629, _0x2f4c6e, _0x44e5ad, {
    nodeId: _0x423970?.['id'],
    loading: mediaLoading,
    fetchPriority: mediaFetchPriority,
    kind: _0x4a8e94,
    critical: mediaCritical,
    directWhenBlank: mediaDirectWhenBlank,
    fallbackWhileDecoding: mediaFallbackWhileDecoding,
    holdFallbackWhileBusy: mediaHoldFallbackWhileBusy,
    viewportBusy: viewportBusy,
    queuePriority: queuePriority,
    mediaSrcBatchLimit: mediaSrcBatchLimit,
    videoMediaSrcBatchLimit: videoMediaSrcBatchLimit,
    deferSrc: deferMediaSrc,
    placeholderReady: placeholderReady,
    preserveInFlightResource: preserveInFlightResource,
    scheduleMediaSrc: scheduleMediaSrc,
    cancelPendingMediaSrc: cancelPendingMediaSrc,
    onMediaPresented: onMediaPresented,
  });
}
function applyPreviewDragTransform(_0x506a3c) {
  if (!_0x506a3c) return ![];
  const _0x5b63bf = toNumber(_0x506a3c['_previewBaseX'], 0x0),
    _0x561ee5 = toNumber(_0x506a3c['_previewBaseY'], 0x0),
    _0x347239 = _0x506a3c['_previewDragActive'] === !![],
    _0x152914 = _0x347239 ? toNumber(_0x506a3c['_previewDragDx'], 0x0) : 0x0,
    _0x1973d5 = _0x347239 ? toNumber(_0x506a3c['_previewDragDy'], 0x0) : 0x0;
  ((_0x506a3c['style']['transform'] =
    'translate(' + (_0x5b63bf + _0x152914) + 'px, ' + (_0x561ee5 + _0x1973d5) + 'px)'),
    _0x506a3c['classList']?.['toggle']?.('is-dragging-proxy', _0x347239));
  if (_0x347239) _0x506a3c['dataset']['dragProxy'] = '1';
  else delete _0x506a3c['dataset']['dragProxy'];
  return !![];
}
function resetPreviewDragState(_0x370035) {
  if (!_0x370035) return;
  ((_0x370035['_previewDragActive'] = ![]),
    (_0x370035['_previewDragDx'] = 0x0),
    (_0x370035['_previewDragDy'] = 0x0),
    applyPreviewDragTransform(_0x370035),
    _0x370035['classList']?.['remove']?.('is-dragging-proxy'),
    delete _0x370035['dataset']['dragProxy']);
}
function settlePreviewDragState(_0x2cb882, _0xfb316f = 0x0, _0x49dad2 = 0x0) {
  if (!_0x2cb882) return ![];
  return (
    (_0x2cb882['_previewBaseX'] = toNumber(_0x2cb882['_previewBaseX'], 0x0) + toNumber(_0xfb316f, 0x0)),
    (_0x2cb882['_previewBaseY'] = toNumber(_0x2cb882['_previewBaseY'], 0x0) + toNumber(_0x49dad2, 0x0)),
    (_0x2cb882['_previewDragActive'] = ![]),
    (_0x2cb882['_previewDragDx'] = 0x0),
    (_0x2cb882['_previewDragDy'] = 0x0),
    applyPreviewDragTransform(_0x2cb882)
  );
}
function isStoryboardEditingNode(_0x651881 = {}) {
  return (
    String(_0x651881?.['type'] || '')
      ['trim']()
      ['toLowerCase']() === 'storyboard' && _0x651881['isEditing']
  );
}
function syncPreviewConnectionState(
  _0x10bfc0,
  _0x17ea0b = {},
  { connOverlay: connOverlay = null, pickConnectMode: pickConnectMode = null } = {},
) {
  const _0x958c45 = String(_0x17ea0b?.['id'] || _0x10bfc0?.['dataset']?.['nodeId'] || '')['trim']();
  if (!_0x958c45 || !_0x10bfc0?.['classList']) return;
  const _0x16ae7d = String(connOverlay?.['srcId'] || '')['trim'](),
    _0x148597 = pickConnectMode?.['active'] ? String(pickConnectMode['sourceNodeId'] || '')['trim']() : '',
    _0x110958 = !!_0x148597 && _0x958c45 === _0x148597,
    _0x1b631 = !!_0x16ae7d && _0x958c45 === _0x16ae7d,
    _0x49cb3f = isStoryboardEditingNode(_0x17ea0b),
    _0x181768 = _0x1b631 || _0x110958 || _0x49cb3f,
    _0x45ae59 = Array['isArray'](connOverlay?.['invalidNodeIds']) ? connOverlay['invalidNodeIds'] : [],
    _0x223c4e = !_0x181768 && _0x45ae59['includes'](_0x958c45),
    _0x4b213f = pickConnectMode?.['active'] ? String(pickConnectMode['hoverNodeId'] || '')['trim']() : '',
    _0x314902 = !!_0x4b213f && _0x958c45 === _0x4b213f,
    _0x2d7d0b = connOverlay?.['hoverId'] === _0x958c45 || _0x314902,
    _0x5afb17 =
      _0x2d7d0b &&
      (connOverlay?.['side'] === 'left' || (_0x314902 && pickConnectMode?.['handleDirection'] === 'left'));
  (_0x10bfc0['classList']['toggle']('conn-src', _0x181768),
    _0x10bfc0['classList']['toggle']('conn-invalid', _0x223c4e),
    _0x10bfc0['classList']['toggle']('conn-hoverTarget', _0x2d7d0b),
    _0x10bfc0['classList']['toggle']('conn-hover-output', _0x5afb17),
    _0x10bfc0['classList']['toggle']('conn-hover-input', _0x2d7d0b && !_0x5afb17));
}
function buildPreviewCandidateSyncSignature(_0x317b82, _0x4198ba, _0x5090be = null) {
  const {
      node: _0x2e17df,
      nodeId: _0x11c690,
      kind: _0x273fbf,
      sources: sources = [],
      geometry: geometry = {},
    } = _0x317b82 || {},
    _0x5346eb = _0x4198ba?.['options'] || {},
    _0x2ffb28 = _0x5346eb['connOverlay'] || {},
    _0xcf3d85 = _0x5346eb['pickConnectMode'] || {},
    _0x3a72d5 = _0x4198ba?.['mediaPlan']?.['explicitMediaSourceOwnerIds'],
    _0x505e5b = _0x4198ba?.['requiredImmediateMediaSourceOwnerIds'],
    _0x483506 = Array['isArray'](_0x2ffb28['invalidNodeIds']) ? _0x2ffb28['invalidNodeIds'] : [],
    _0x90db53 = _0x5090be?.['querySelector']?.('.v2-fast-preview-media') || null,
    _0x227d82 = String(sources[0x0] || '')['trim'](),
    _0x44701f =
      (_0x317b82?.['fullEligibleVisible'] === !![] || _0x317b82?.['visible'] === !![]) &&
      (_0x273fbf === 'video' ||
        toNumber(_0x4198ba?.['visibleMediaCandidateCount'], 0x0) <=
          toNumber(_0x4198ba?.['immediateMediaSrcLimit'], 0x0)),
    _0x4137a0 = toNumber(geometry['x'], 0x0) - toNumber(_0x4198ba?.['layerBounds']?.['offsetX'], 0x0),
    _0x10e915 = toNumber(geometry['y'], 0x0) - toNumber(_0x4198ba?.['layerBounds']?.['offsetY'], 0x0);
  return [
    _0x11c690,
    _0x273fbf,
    _0x317b82?.['text'] ?? getPreviewText(_0x2e17df, _0x273fbf),
    sources['join']('>'),
    _0x4137a0,
    _0x10e915,
    toNumber(geometry['width'], 0x0),
    toNumber(geometry['height'], 0x0),
    _0x317b82?.['nearViewport'] === !![] ? 0x1 : 0x0,
    _0x317b82?.['visible'] === !![] ? 0x1 : 0x0,
    _0x317b82?.['fullEligibleVisible'] === !![] ? 0x1 : 0x0,
    _0x317b82?.['fullEligiblePreview'] === !![] ? 0x1 : 0x0,
    _0x317b82?.['fullEligibleMotionAhead'] === !![] ? 0x1 : 0x0,
    _0x317b82?.['motionFront'] === !![] ? 0x1 : 0x0,
    _0x317b82?.['motionAhead'] === !![] ? 0x1 : 0x0,
    _0x317b82?.['selected'] === !![] ? 0x1 : 0x0,
    _0x317b82?.['retained'] === !![] ? 0x1 : 0x0,
    _0x317b82?.['mounted'] === !![] ? 0x1 : 0x0,
    _0x4198ba?.['mediaPlan']?.['nodeIdsWithMedia']?.['has']?.(_0x11c690) === !![] ? 0x1 : 0x0,
    _0x3a72d5 === null ? 'legacy' : _0x3a72d5?.['has']?.(_0x11c690) === !![] ? 0x1 : 0x0,
    _0x505e5b === null ? 'legacy' : _0x505e5b?.['has']?.(_0x11c690) === !![] ? 0x1 : 0x0,
    _0x4198ba?.['mediaPlan']?.['lowPriority'] === !![] ? 0x1 : 0x0,
    _0x4198ba?.['mediaPlan']?.['prefetchAhead'] === !![] ? 0x1 : 0x0,
    _0x4198ba?.['mediaLoading'] || '',
    _0x4198ba?.['mediaFetchPriority'] || '',
    _0x44701f ? 0x1 : 0x0,
    _0x4198ba?.['viewportBusy'] === !![] ? 0x1 : 0x0,
    _0x5346eb['suppressNewMedia'] === !![] ? 0x1 : 0x0,
    _0x5346eb['suspendNewMediaSrc'] === !![] ? 0x1 : 0x0,
    _0x5346eb['previewMotion']?.['zoomChanged'] === !![] ? 0x1 : 0x0,
    String(_0x2ffb28['srcId'] || ''),
    String(_0x2ffb28['hoverId'] || ''),
    String(_0x2ffb28['side'] || ''),
    _0x483506['includes'](_0x11c690) ? 0x1 : 0x0,
    _0xcf3d85['active'] === !![] ? 0x1 : 0x0,
    String(_0xcf3d85['sourceNodeId'] || ''),
    String(_0xcf3d85['hoverNodeId'] || ''),
    String(_0xcf3d85['handleDirection'] || ''),
    isStoryboardEditingNode(_0x2e17df) ? 0x1 : 0x0,
    _0x5090be?.['dataset']?.['mediaSourceOwner'] || '',
    _0x5090be?.['dataset']?.['hasMedia'] || '',
    _0x5090be?.['dataset']?.['placeholderReady'] || '',
    _0x90db53 ? getPreviewMediaCurrentSrc(_0x90db53) : '',
    _0x90db53?.['_previewSrcPreloadUrl'] || '',
    _0x90db53?.['dataset']?.['previewResourceOnly'] || '',
    _0x90db53?.['style']?.['visibility'] || '',
    _0x90db53?.['loading'] || '',
    _0x90db53?.['fetchPriority'] || '',
    _0x227d82 && _0x273fbf !== 'video' && isCanvasImagePreloadCoolingDown(_0x227d82) ? 0x1 : 0x0,
  ]['join']('\x1f');
}
function syncLayerBounds(_0x532c0c, _0x4fd34e, { preserveAnchor: preserveAnchor = ![] } = {}) {
  if (!_0x532c0c || !Array['isArray'](_0x4fd34e) || _0x4fd34e['length'] === 0x0) return null;
  if (
    preserveAnchor &&
    Number['isFinite'](_0x532c0c['_previewOffsetX']) &&
    Number['isFinite'](_0x532c0c['_previewOffsetY'])
  )
    return { offsetX: _0x532c0c['_previewOffsetX'], offsetY: _0x532c0c['_previewOffsetY'] };
  let _0x4dd053 = Infinity,
    _0x4acf86 = Infinity,
    _0x39f865 = -Infinity,
    _0x47a412 = -Infinity;
  for (const _0x36d61e of _0x4fd34e) {
    const _0x36eaec = _0x36d61e?.['geometry'];
    if (!_0x36eaec) continue;
    ((_0x4dd053 = Math['min'](_0x4dd053, _0x36eaec['x'])),
      (_0x4acf86 = Math['min'](_0x4acf86, _0x36eaec['y'])),
      (_0x39f865 = Math['max'](_0x39f865, _0x36eaec['x'] + _0x36eaec['width'])),
      (_0x47a412 = Math['max'](_0x47a412, _0x36eaec['y'] + _0x36eaec['height'])));
  }
  if (![_0x4dd053, _0x4acf86, _0x39f865, _0x47a412]['every'](Number['isFinite'])) return null;
  const _0x4ed80a = _0x4dd053 - FAST_PREVIEW_LAYER_PADDING,
    _0x3903ef = _0x4acf86 - FAST_PREVIEW_LAYER_PADDING,
    _0x544ed0 = 0x1,
    _0xe3f877 = 0x1,
    _0x3dd1ab = _0x4ed80a + ',' + _0x3903ef + ',' + _0x544ed0 + ',' + _0xe3f877;
  return (
    _0x532c0c['_previewBoundsSig'] !== _0x3dd1ab &&
      (Object['assign'](_0x532c0c['style'], {
        left: _0x4ed80a + 'px',
        top: _0x3903ef + 'px',
        width: _0x544ed0 + 'px',
        height: _0xe3f877 + 'px',
      }),
      (_0x532c0c['_previewBoundsSig'] = _0x3dd1ab)),
    (_0x532c0c['_previewOffsetX'] = _0x4ed80a),
    (_0x532c0c['_previewOffsetY'] = _0x3903ef),
    { offsetX: _0x4ed80a, offsetY: _0x3903ef }
  );
}
export function createRendererFastPreviewLayer({
  getWrapper: _0x2e5e2d,
  isMounted: _0xfd24f7,
  resolveMediaPresentationReady: _0x7a4a96,
  onMediaPresented: _0x2d5990,
  onPresentationOwnerChanged: _0x4e706f,
} = {}) {
  const _0xa59588 = new Map(),
    _0x3f32d8 = new Map(),
    _0x636cda = [],
    _0x5a9cc8 = new Map(),
    _0xb96af9 = new Map(),
    _0x5b43c3 = new Map(),
    _0x134f77 = new Set(),
    _0x1c2cac = new Set();
  let _0x46db57 = [],
    _0x944f3e = null,
    _0x502796 = null,
    _0x64e96d = Number['POSITIVE_INFINITY'],
    _0x85d8d3 = Number['POSITIVE_INFINITY'],
    _0xd5a452 = 0x0,
    _0x4b12bb = ![],
    _0x1745f9 = null,
    _0x4c651a = null,
    _0x9f22b8 = null,
    _0x191dc8 = null,
    _0x186f0c = 0x0,
    _0x3db71f = null,
    _0xd569ee = null,
    _0x8ce458 = null,
    _0x48ea8b = createEmptyStats();
  const _0x550eed = new Map();
  function _0x5cdf10(_0x2bd81d, _0x4c4828) {
    const _0x480c7f = String(_0x2bd81d || ''),
      _0x12f7db = _0x2e5e2d?.(_0x480c7f);
    if (!_0x12f7db?.['dataset']) return;
    const _0x195c07 = _0x4c4828 === !![];
    if (_0x195c07) _0x12f7db['dataset']['rendererPresentationOwner'] = 'fast-preview';
    else
      _0x12f7db['dataset']['rendererPresentationOwner'] === 'fast-preview' &&
        delete _0x12f7db['dataset']['rendererPresentationOwner'];
    _0x4e706f?.({ nodeId: _0x480c7f, active: _0x195c07, wrapper: _0x12f7db });
  }
  function _0x4cb423(_0x22c3f9, _0x17022a) {
    const _0x1aa5b6 = String(_0x22c3f9 || '')['trim']();
    if (!_0x1aa5b6 || !_0x17022a?.['canvas']) return ![];
    const _0xb2c757 = _0x3f32d8['get'](_0x1aa5b6);
    if (!_0xb2c757) return (_0x5b43c3['set'](_0x1aa5b6, _0x17022a), !![]);
    return (
      _0x5b43c3['delete'](_0x1aa5b6),
      _0x5cdf10(_0x1aa5b6, !![]),
      attachPreviewRasterFrame(_0xb2c757, _0x17022a)
    );
  }
  function _0x4d8c66(_0x27cae6, _0xae4834, _0x25da92 = _0xd569ee?.[String(_0x27cae6 || '')]) {
    const _0x5dbb48 = _0x7a4a96?.(String(_0x27cae6 || ''), _0xae4834),
      _0x3a1c65 = typeof _0x5dbb48 === 'boolean' ? _0x5dbb48 : isMountedMediaReady(_0xae4834);
    if (!_0x3a1c65) return ![];
    const _0x5f21bd = [
      ...Array['from'](_0xae4834?.['querySelectorAll']?.('img') || [])['filter'](
        (_0x1906cf) => isMountedPresentationMediaElement(_0x1906cf) && isMountedImageReady(_0x1906cf),
      ),
      ...Array['from'](_0xae4834?.['querySelectorAll']?.('video') || [])['filter'](
        (_0xf5626d) => isMountedPresentationMediaElement(_0xf5626d) && isMountedVideoReady(_0xf5626d),
      ),
    ];
    if (
      _0x25da92 &&
      !_0x5f21bd['some']((_0x1347d4) => isPresentationMediaSourceForNode(_0x1347d4, _0x25da92))
    )
      return ![];
    if (_0xae4834?.['dataset']?.['mediaLodMode'] !== 'full') return !![];
    return _0x5f21bd['some'](
      (_0x372435) =>
        String(_0x372435?.['tagName'] || '')['toLowerCase']() === 'img' &&
        String(_0x372435?.['dataset']?.['lodSrc'] || '')['trim']() === 'full' &&
        (!_0x25da92 || isPresentationMediaSourceForNode(_0x372435, _0x25da92)),
    );
  }
  function _0x40bb90(_0xcba2b2, _0x46eb6a = _0x2e5e2d?.(_0xcba2b2)) {
    if (!_0x46eb6a || !_0xfd24f7?.(_0xcba2b2) || _0x46eb6a['isConnected'] === ![]) return ![];
    const _0xba6776 = _0x46eb6a['style'] || {};
    return !!(
      _0x46eb6a['hidden'] !== !![] &&
      _0xba6776['display'] !== 'none' &&
      _0xba6776['visibility'] !== 'hidden' &&
      _0xba6776['opacity'] !== '0'
    );
  }
  function _0xdcb895(_0x4447ac) {
    if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(_0x4447ac);
    if (typeof window !== 'undefined' && typeof window['requestAnimationFrame'] === 'function')
      return window['requestAnimationFrame'](_0x4447ac);
    return (_0x4447ac(), null);
  }
  function _0x1dfb61(_0x1d9465) {
    if (_0x1d9465 == null) return;
    if (typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(_0x1d9465);
      return;
    }
    if (typeof window !== 'undefined' && typeof window['cancelAnimationFrame'] === 'function') {
      window['cancelAnimationFrame'](_0x1d9465);
      return;
    }
  }
  function _0x56d4ba() {
    if (_0x502796 === null) return;
    (typeof clearTimeout === 'function' && clearTimeout(_0x502796), (_0x502796 = null));
  }
  function _0x3f35bf(_0x2fd696) {
    if (_0x2fd696 === !![]) {
      _0xd5a452 = nowPerf() + FAST_PREVIEW_BUSY_HINT_TTL_MS;
      return;
    }
    if (_0x2fd696 === ![]) _0xd5a452 = 0x0;
  }
  function _0x3a0154() {
    return _0xd5a452 > nowPerf();
  }
  function _0x29c552(_0x5ed933) {
    if (_0x5ed933 !== !![]) {
      _0x4b12bb = ![];
      return;
    }
    if (_0x4b12bb) return;
    ((_0x4b12bb = !![]),
      cancelQueuedCanvasImagePreloads({
        scope: FAST_PREVIEW_MEDIA_PRELOAD_SCOPE,
        includeActive: ![],
        belowPriority: FAST_PREVIEW_VIEWPORT_BUSY_PRELOAD_CANCEL_PRIORITY_LIMIT,
        reason: 'fast preview viewport busy',
      }));
  }
  function _0x5e7a2d(_0x90cb91 = {}) {
    const _0x148f72 = getViewportWorldCenter(_0x90cb91),
      _0x3cde17 = _0x1745f9,
      _0x3fd87a = normalizeViewport(_0x90cb91?.['viewport'])['zoom'],
      _0x486bee = _0x4c651a;
    ((_0x1745f9 = _0x148f72), (_0x4c651a = _0x3fd87a));
    if (!_0x3cde17) return { center: _0x148f72, dx: 0x0, dy: 0x0, active: ![], zoomChanged: ![] };
    const _0x4c87c3 = _0x148f72['x'] - _0x3cde17['x'],
      _0x3d7bcf = _0x148f72['y'] - _0x3cde17['y'];
    return {
      center: _0x148f72,
      dx: _0x4c87c3,
      dy: _0x3d7bcf,
      active: _0x4c87c3 * _0x4c87c3 + _0x3d7bcf * _0x3d7bcf >= FAST_PREVIEW_MOTION_MIN_DISTANCE_SQ,
      zoomChanged: Number['isFinite'](_0x486bee) && Math['abs'](_0x3fd87a - _0x486bee) > 0.000001,
    };
  }
  function _0x1d5155(_0x4268c0, _0x4675c4) {
    const _0x55d705 = _0x4268c0?.['_previewMediaQueuePriority'] || {},
      _0x4c4fc7 = _0x4675c4?.['_previewMediaQueuePriority'] || {},
      _0xc77b86 = Number['isFinite'](Number(_0x55d705['userRank'])) ? Number(_0x55d705['userRank']) : 0x3,
      _0x65d0be = Number['isFinite'](Number(_0x4c4fc7['userRank'])) ? Number(_0x4c4fc7['userRank']) : 0x3;
    if (_0xc77b86 !== _0x65d0be) return _0xc77b86 - _0x65d0be;
    const _0x44306f = Number['isFinite'](Number(_0x55d705['distanceSq']))
        ? Number(_0x55d705['distanceSq'])
        : Number['POSITIVE_INFINITY'],
      _0x554517 = Number['isFinite'](Number(_0x4c4fc7['distanceSq']))
        ? Number(_0x4c4fc7['distanceSq'])
        : Number['POSITIVE_INFINITY'];
    if (_0x44306f !== _0x554517) return _0x44306f - _0x554517;
    const _0xdec23f = Number['isFinite'](Number(_0x55d705['order'])) ? Number(_0x55d705['order']) : 0x0,
      _0x50bde7 = Number['isFinite'](Number(_0x4c4fc7['order'])) ? Number(_0x4c4fc7['order']) : 0x0;
    return _0xdec23f - _0x50bde7;
  }
  function _0x3563be(_0x47f4d6) {
    let _0x5b43d8 = _0x46db57['length'];
    for (let _0x372857 = 0x0; _0x372857 < _0x46db57['length']; _0x372857 += 0x1) {
      if (_0x1d5155(_0x47f4d6, _0x46db57[_0x372857]) < 0x0) {
        _0x5b43d8 = _0x372857;
        break;
      }
    }
    _0x46db57['splice'](_0x5b43d8, 0x0, _0x47f4d6);
  }
  function _0x3ce58c() {
    _0x46db57['sort'](_0x1d5155);
  }
  function _0x4bb06c({ retryWhenBusy: retryWhenBusy = ![] } = {}) {
    if (_0x944f3e !== null || _0x502796 !== null) return;
    if (retryWhenBusy && typeof setTimeout === 'function') {
      _0x502796 = setTimeout(() => {
        ((_0x502796 = null), _0x233522());
      }, FAST_PREVIEW_BUSY_MEDIA_SRC_RETRY_MS);
      return;
    }
    _0x944f3e = _0xdcb895(_0x233522);
  }
  function _0x233522() {
    const _0x5d1579 = isPerfProbeEnabled(),
      _0x4ec844 = _0x5d1579 ? nowPerf() : 0x0;
    ((_0x944f3e = null), _0x56d4ba());
    const _0x47419e = _0x3a0154() || isViewportInteractionBusyForPreview(),
      _0x3e03d1 = _0x46db57['reduce'](
        (_0x40300b, _0x307015) =>
          Math['min'](
            _0x40300b,
            _0x307015?.['_previewMediaSrcBatchLimit'] != null &&
              Number['isFinite'](Number(_0x307015['_previewMediaSrcBatchLimit']))
              ? Math['max'](0x0, Math['trunc'](Number(_0x307015['_previewMediaSrcBatchLimit'])))
              : Number['POSITIVE_INFINITY'],
          ),
        Number['POSITIVE_INFINITY'],
      ),
      _0x35c74b = _0x46db57['reduce'](
        (_0x5881ca, _0x322971) =>
          Math['min'](
            _0x5881ca,
            _0x322971?.['_previewVideoMediaSrcBatchLimit'] != null &&
              Number['isFinite'](Number(_0x322971['_previewVideoMediaSrcBatchLimit']))
              ? Math['max'](0x0, Math['trunc'](Number(_0x322971['_previewVideoMediaSrcBatchLimit'])))
              : Number['POSITIVE_INFINITY'],
          ),
        Number['POSITIVE_INFINITY'],
      );
    let _0x4b1468 = resolveMediaSrcBatchSize(_0x46db57['length'], {
        viewportBusy: _0x47419e,
        batchLimit: _0x3e03d1,
      }),
      _0x364507 = resolveVideoMediaSrcBatchSize(_0x46db57['length'], {
        viewportBusy: _0x47419e,
        batchLimit: _0x35c74b,
      }),
      _0x822bd6 = 0x0,
      _0x368541 = 0x0,
      _0x4f765b = 0x0;
    const _0x19952d = [],
      _0x172056 = _0x46db57['length'];
    let _0x6318f2 = 0x0;
    while (_0x4b1468 > 0x0 && _0x46db57['length'] > 0x0 && _0x6318f2 < _0x172056) {
      const _0x373401 = _0x46db57['shift']();
      _0x6318f2 += 0x1;
      if (!_0x373401) continue;
      if (_0x373401['isConnected'] === ![]) {
        _0x1c2cac['delete'](_0x373401);
        continue;
      }
      const _0x241c61 = isPreviewVideoMedia(_0x373401),
        _0x2c4bef = isPreviewCriticalMedia(_0x373401);
      if (_0x241c61 && !_0x2c4bef && _0x364507 <= 0x0) {
        (_0x19952d['push'](_0x373401), (_0x4f765b += 0x1));
        continue;
      }
      _0x1c2cac['delete'](_0x373401);
      if (
        applyPreviewMediaSrcAfterPreload(_0x373401, _0x373401['_previewSources'] || [], 0x0, {
          decode: _0x2c4bef !== !![],
          directWhenBlank: _0x2c4bef === !![] || _0x373401['_previewDirectWhenBlank'] === !![],
          viewportBusy: _0x47419e,
        })
      ) {
        _0x822bd6 += 0x1;
        if (_0x241c61) _0x368541 += 0x1;
      }
      if (_0x241c61 && !_0x2c4bef) _0x364507 -= 0x1;
      _0x4b1468 -= 0x1;
    }
    _0x19952d['length'] > 0x0 && (_0x46db57['push'](..._0x19952d), _0x3ce58c());
    if (_0x5d1579) {
      const _0x5e7a0d = nowPerf();
      recordFastPreviewSample('media-src-batch', _0x5e7a0d - _0x4ec844, {
        endPerf: _0x5e7a0d,
        pendingMediaSrcCount: _0x46db57['length'],
        srcAssignedCount: _0x822bd6,
        startPerf: _0x4ec844,
        videoDeferredCount: _0x4f765b,
        videoSrcAssignedCount: _0x368541,
      });
    }
    if (_0x46db57['length'] > 0x0) _0x4bb06c({ retryWhenBusy: _0x47419e });
  }
  function _0x162fb6(_0x451636) {
    if (!_0x451636) return;
    const _0x17260d = _0x451636['_previewSources']?.[0x0] || '';
    if (!_0x17260d) return;
    const _0x412d7c = _0x451636['getAttribute']?.('src') || _0x451636['src'] || '';
    if (_0x412d7c === _0x17260d) return;
    if (_0x451636['_previewSrcPreloadUrl'] === _0x17260d) return;
    _0x451636['_previewSrcPreloadUrl'] &&
      _0x451636['_previewSrcPreloadUrl'] !== _0x17260d &&
      (nextPreviewMediaPreloadToken(_0x451636), (_0x451636['_previewSrcPreloadUrl'] = ''));
    if (_0x1c2cac['has'](_0x451636)) {
      _0x3ce58c();
      return;
    }
    (_0x1c2cac['add'](_0x451636), _0x3563be(_0x451636), _0x4bb06c());
  }
  function _0x2b51e3(_0x203908) {
    if (!_0x203908) return;
    (_0x1c2cac['has'](_0x203908) &&
      (_0x1c2cac['delete'](_0x203908),
      (_0x46db57 = _0x46db57['filter']((_0x37345d) => _0x37345d !== _0x203908))),
      _0x203908['_previewSrcPreloadUrl'] &&
        (nextPreviewMediaPreloadToken(_0x203908), (_0x203908['_previewSrcPreloadUrl'] = '')));
  }
  function _0x16bbdb() {
    _0x944f3e !== null && (_0x1dfb61(_0x944f3e), (_0x944f3e = null));
    _0x56d4ba();
    for (const _0x16fd1e of _0x1c2cac) {
      _0x16fd1e && (nextPreviewMediaPreloadToken(_0x16fd1e), (_0x16fd1e['_previewSrcPreloadUrl'] = ''));
    }
    (_0x1c2cac['clear'](), (_0x46db57 = []));
  }
  function _0x341954() {
    (_0x191dc8 !== null && (_0x1dfb61(_0x191dc8), (_0x191dc8 = null)), (_0x9f22b8 = null));
  }
  function _0x5634d8(_0x3d02b0, { clearSrc: clearSrc = ![] } = {}) {
    if (!_0x3d02b0) return;
    const _0x4d0ea4 = _0x3d02b0['querySelector']?.('.v2-fast-preview-media');
    if (_0x4d0ea4) {
      _0x2b51e3(_0x4d0ea4);
      if (clearSrc) clearPreviewMediaSrc(_0x4d0ea4);
    }
  }
  function _0x5a695a(_0x40ac34) {
    const _0x42c229 = _0x40ac34?.['querySelector']?.('.v2-fast-preview-media');
    if (!_0x42c229) return ![];
    _0x2b51e3(_0x42c229);
    if (isPreviewMediaResourceProtected(_0x42c229)) {
      _0x42c229['dataset']['previewResourceOnly'] = '1';
      if (_0x42c229['style']) _0x42c229['style']['visibility'] = 'hidden';
      return (delete _0x40ac34['dataset']['hasMedia'], delete _0x40ac34['dataset']['previewSrcCount'], !![]);
    }
    return (
      clearPreviewMediaSrc(_0x42c229),
      _0x42c229['remove']?.(),
      delete _0x40ac34['dataset']['hasMedia'],
      delete _0x40ac34['dataset']['previewSrcCount'],
      !![]
    );
  }
  function _0x16689d(
    _0x3cd3b5,
    {
      preservePaintedMediaOwners: preservePaintedMediaOwners = ![],
      preservePaintedVideoOwners: preservePaintedVideoOwners = ![],
    } = {},
  ) {
    if (_0x3cd3b5 == null || typeof _0x3cd3b5?.[Symbol['iterator']] !== 'function') return 0x0;
    const _0xcbfb85 = new Set(
      Array['from'](_0x3cd3b5, (_0x48b602) => String(_0x48b602 || ''))['filter'](Boolean),
    );
    _0x9f22b8?.['mediaPlan'] &&
      ((_0x9f22b8['mediaPlan']['explicitMediaSourceOwnerIds'] = _0xcbfb85),
      (_0x9f22b8['mediaPlan']['nodeIdsWithMedia'] = new Set(
        [..._0x9f22b8['mediaPlan']['nodeIdsWithMedia']]['filter']((_0x4213fc) => _0xcbfb85['has'](_0x4213fc)),
      )),
      (_0x9f22b8['options'] = { ..._0x9f22b8['options'], mediaSourceOwnerIds: _0xcbfb85 }));
    let _0x505b58 = 0x0;
    for (const [_0x2cf2f8, _0x4a4316] of _0x3f32d8) {
      if (_0xcbfb85['has'](_0x2cf2f8))
        ((_0x4a4316['dataset']['mediaSourceOwner'] = '1'), restorePaintedPreviewMedia(_0x4a4316));
      else {
        if (
          (preservePaintedMediaOwners || preservePaintedVideoOwners) &&
          hasRetainablePaintedPreviewMedia(_0x4a4316, { includeImages: preservePaintedMediaOwners })
        )
          ((_0x4a4316['dataset']['mediaSourceOwner'] = '1'), restorePaintedPreviewMedia(_0x4a4316));
        else {
          delete _0x4a4316['dataset']['mediaSourceOwner'];
          if (_0x5a695a(_0x4a4316)) _0x505b58 += 0x1;
        }
      }
    }
    for (const [_0x4c1643, _0x3909a7] of _0x5a9cc8) {
      if (_0xcbfb85['has'](_0x4c1643))
        ((_0x3909a7['dataset']['mediaSourceOwner'] = '1'), restorePaintedPreviewMedia(_0x3909a7));
      else {
        if (
          _0x3909a7['dataset']['mediaSourceOwner'] === '1' &&
          (preservePaintedMediaOwners || preservePaintedVideoOwners) &&
          hasRetainablePaintedPreviewMedia(_0x3909a7, { includeImages: preservePaintedMediaOwners })
        )
          restorePaintedPreviewMedia(_0x3909a7);
        else {
          delete _0x3909a7['dataset']['mediaSourceOwner'];
          if (_0x5a695a(_0x3909a7)) _0x505b58 += 0x1;
        }
      }
    }
    for (const _0xc5589b of _0xb96af9['values']()) {
      !_0xcbfb85['has'](_0xc5589b['nodeId']) && _0x5a695a(_0xc5589b['el']) && (_0x505b58 += 0x1);
    }
    if (_0x505b58 > 0x0) _0x314b1f();
    return _0x505b58;
  }
  function _0x2e599b(_0x1b92c6) {
    if (!_0x1b92c6) return;
    (_0x5634d8(_0x1b92c6, { clearSrc: !![] }),
      removePreviewRasterFrame(_0x1b92c6),
      resetPreviewDragState(_0x1b92c6),
      delete _0x1b92c6['_previewSig'],
      delete _0x1b92c6['_previewGeometrySig'],
      delete _0x1b92c6['_previewContentSig'],
      delete _0x1b92c6['_previewCandidateSyncSig'],
      delete _0x1b92c6['dataset']['nodeId'],
      delete _0x1b92c6['dataset']['kind'],
      delete _0x1b92c6['dataset']['hasMedia'],
      delete _0x1b92c6['dataset']['placeholderReady'],
      delete _0x1b92c6['dataset']['previewSrcCount'],
      delete _0x1b92c6['dataset']['mediaSourceOwner'],
      delete _0x1b92c6['dataset']['previewReleaseStage'],
      delete _0x1b92c6['dataset']['rasterFrame'],
      Object['assign'](_0x1b92c6['style'], {
        display: 'none',
        height: '',
        opacity: '',
        pointerEvents: '',
        transform: '',
        visibility: '',
        width: '',
      }),
      (_0x1b92c6['className'] = 'v2-fast-preview-node'),
      _0x1b92c6['remove']?.());
  }
  function _0x5ba772(_0x43e736, _0x231dcf) {
    const _0x234ee5 = String(_0x43e736 || '')['trim']();
    if (!_0x234ee5 || !_0x231dcf) return ![];
    const _0x14b95b = _0x231dcf['querySelector']?.('.v2-fast-preview-media');
    if (!isPreviewMediaLoaded(_0x14b95b) && !isPreviewMediaResourceProtected(_0x14b95b)) return ![];
    (_0x5634d8(_0x231dcf), resetPreviewDragState(_0x231dcf));
    if (_0x5a9cc8['has'](_0x234ee5)) _0x2f05f3(_0x5a9cc8['get'](_0x234ee5));
    (_0x5a9cc8['set'](_0x234ee5, _0x231dcf),
      Object['assign'](_0x231dcf['style'], { display: 'none' }),
      _0x231dcf['remove']?.());
    while (_0x5a9cc8['size'] > FAST_PREVIEW_DETACHED_NODE_CACHE_LIMIT) {
      const _0x1eb273 = Array['from'](_0x5a9cc8['entries']())['find'](([_0x54238a, _0x1b944d]) => {
          const _0x33397b = _0x1b944d?.['querySelector']?.('.v2-fast-preview-media');
          return !isPreviewMediaResourceProtected(_0x33397b);
        }),
        _0x289b26 = _0x1eb273?.[0x0];
      if (!_0x289b26) {
        if (_0x5a9cc8['size'] <= FAST_PREVIEW_DETACHED_IN_FLIGHT_CACHE_LIMIT) break;
      }
      const _0x64bb49 = _0x289b26 || _0x5a9cc8['keys']()['next']()['value'],
        _0x22c9cf = _0x5a9cc8['get'](_0x64bb49);
      (_0x5a9cc8['delete'](_0x64bb49), _0x2f05f3(_0x22c9cf));
    }
    return !![];
  }
  function _0x1b657d() {
    const _0x7a5c8b = Array['from'](_0x5a9cc8['entries']())['find'](([_0x31e3be, _0x3ca73d]) => {
        const _0x2b3f04 = _0x3ca73d?.['querySelector']?.('.v2-fast-preview-media');
        return !isPreviewMediaResourceProtected(_0x2b3f04);
      }),
      _0x540ba8 = _0x7a5c8b?.[0x0];
    if (!_0x540ba8) return null;
    const _0x3a643e = _0x5a9cc8['get'](_0x540ba8);
    return (_0x5a9cc8['delete'](_0x540ba8), _0x2e599b(_0x3a643e), _0x3a643e || null);
  }
  function _0x56133c(_0x43a39e) {
    let _0x5c3af9 = ![],
      _0x71acce = ![],
      _0x265573 = _0x5a9cc8['get'](_0x43a39e);
    if (_0x265573) (_0x5a9cc8['delete'](_0x43a39e), (_0x5c3af9 = !![]), (_0x71acce = !![]));
    else {
      ((_0x265573 = _0x636cda['pop']() || _0x1b657d()), (_0x5c3af9 = !!_0x265573));
      if (!_0x265573) _0x265573 = createPreviewEl(_0x43a39e);
    }
    ((_0x265573['dataset']['nodeId'] = _0x43a39e),
      delete _0x265573['dataset']['previewReleaseStage'],
      Object['assign'](_0x265573['style'], { display: '', opacity: '', pointerEvents: '', visibility: '' }));
    !_0x71acce &&
      (delete _0x265573['_previewSig'],
      delete _0x265573['_previewGeometrySig'],
      delete _0x265573['_previewContentSig']);
    _0x265573['_fastPreviewReused'] = _0x5c3af9;
    let _0x588fec = _0x265573['querySelector']?.('.v2-fast-preview-label');
    return (
      !_0x588fec &&
        ((_0x588fec = document['createElement']('div')),
        (_0x588fec['className'] = 'v2-fast-preview-label'),
        _0x265573['appendChild'](_0x588fec)),
      _0x265573
    );
  }
  function _0x2f05f3(_0x19b4c1) {
    if (!_0x19b4c1) return;
    (_0x2e599b(_0x19b4c1),
      _0x636cda['length'] < FAST_PREVIEW_NODE_POOL_LIMIT && _0x636cda['push'](_0x19b4c1));
  }
  function _0x207f94() {
    return typeof document !== 'undefined' && typeof document['createDocumentFragment'] === 'function'
      ? document['createDocumentFragment']()
      : null;
  }
  function _0x98fc4d(_0x1b31fe) {
    const _0x424367 = _0x1b31fe?.['mountFragment'];
    if (!_0x424367 || !_0x1b31fe?.['layer']) return;
    _0x1b31fe['layer']['appendChild'](_0x424367);
  }
  function _0x5585bc(_0x1e21ed, _0x44b5e2) {
    if (_0x1e21ed?.['deferredDescriptorSources'] === !![]) {
      const _0x39895b = _0xa59588['get'](_0x1e21ed['nodeId']),
        _0x206ccb = getPreviewMediaUrls(_0x1e21ed['node'], _0x1e21ed['kind'], { displayFirst: !![] }),
        _0x53741b = getPreviewMediaUrls(_0x1e21ed['node'], _0x1e21ed['kind'], { displayFirst: ![] });
      (_0x39895b &&
        ((_0x39895b['sourcesDisplayFirst'] = _0x206ccb), (_0x39895b['sourcesThumbnailFirst'] = _0x53741b)),
        (_0x1e21ed['sources'] = _0x1e21ed['fullEligiblePreview'] ? _0x206ccb : _0x53741b),
        (_0x1e21ed['hasMediaHint'] = _0x1e21ed['sources']['length'] > 0x0),
        _0x39895b &&
          _0x39895b['text'] == null &&
          (_0x39895b['text'] = getPreviewText(_0x1e21ed['node'], _0x1e21ed['kind'])),
        _0x1e21ed['text'] == null &&
          (_0x1e21ed['text'] = _0x39895b?.['text'] ?? getPreviewText(_0x1e21ed['node'], _0x1e21ed['kind'])),
        (_0x1e21ed['deferredDescriptorSources'] = ![]));
    }
    const {
      node: _0x534620,
      nodeId: _0x422d3a,
      kind: _0x240c04,
      sources: _0x522637,
      geometry: _0x310a2b,
      nearViewport: _0x42981d,
      visible: _0xd5ed12,
    } = _0x1e21ed;
    let _0x4541b7 = _0x3f32d8['get'](_0x422d3a);
    const _0x172a65 = _0x4541b7;
    if (!_0x4541b7) {
      const _0x2054a4 = Array['from'](_0xb96af9['values']())['find'](
        (_0x4663d1) => _0x4663d1['nodeId'] === _0x422d3a,
      );
      _0x2054a4 && (_0x252dc5(_0x2054a4), (_0x4541b7 = _0x3f32d8['get'](_0x422d3a)));
    }
    let _0x3edede = 0x0,
      _0x4c505d = 0x0;
    if (!_0x4541b7) {
      ((_0x4541b7 = _0x56133c(_0x422d3a)),
        _0x3f32d8['set'](_0x422d3a, _0x4541b7),
        (_0x44b5e2['mountFragment'] || _0x44b5e2['layer'])['appendChild'](_0x4541b7));
      if (_0x4541b7['_fastPreviewReused'] === !![]) _0x4c505d = 0x1;
      else _0x3edede = 0x1;
      delete _0x4541b7['_fastPreviewReused'];
    } else _0x4541b7['parentNode'] !== _0x44b5e2['layer'] && _0x44b5e2['layer']['appendChild'](_0x4541b7);
    _0x5cdf10(_0x422d3a, !![]);
    const _0x4511c5 = _0x5b43c3['get'](_0x422d3a);
    _0x4511c5 && (_0x5b43c3['delete'](_0x422d3a), attachPreviewRasterFrame(_0x4541b7, _0x4511c5));
    isPreviewRasterFrameReady(_0x4541b7) &&
      !isPreviewRasterFrameCompatible(_0x4541b7, {
        ..._0x1e21ed,
        sources: _0x522637,
        text: _0x1e21ed['text'] ?? getPreviewText(_0x534620, _0x240c04),
      }) &&
      removePreviewRasterFrame(_0x4541b7);
    const _0x590b44 = buildPreviewCandidateSyncSignature(_0x1e21ed, _0x44b5e2, _0x4541b7);
    if (
      _0x172a65 === _0x4541b7 &&
      _0x4541b7['parentNode'] === _0x44b5e2['layer'] &&
      _0x4541b7['_previewCandidateSyncSig'] === _0x590b44
    ) {
      const _0x277121 = _0x4541b7['querySelector']?.('.v2-fast-preview-media');
      return (
        _0x277121 &&
          _0x1c2cac['has'](_0x277121) &&
          ((_0x277121['_previewMediaQueuePriority'] = resolveRendererFastPreviewMediaQueuePriority(
            _0x1e21ed,
            _0x44b5e2['options'],
          )),
          (_0x44b5e2['pendingMediaPriorityChanged'] = !![])),
        { createdCount: 0x0, imageCount: 0x0, reusedCount: 0x0, srcAssignedCount: 0x0 }
      );
    }
    const _0x491c43 = _0x44b5e2['mediaPlan']['nodeIdsWithMedia']['has'](_0x422d3a),
      _0x464f1c =
        _0x44b5e2['mediaPlan']['explicitMediaSourceOwnerIds'] === null ||
        _0x44b5e2['mediaPlan']['explicitMediaSourceOwnerIds']['has'](_0x422d3a) ||
        _0x1e21ed['fullEligibleVisible'] ||
        _0xd5ed12 ||
        _0x1e21ed['motionFront'],
      _0xcde5a4 =
        _0x464f1c || _0x44b5e2['preservePaintedMediaOwners'] !== !![]
          ? ''
          : getRetainablePaintedPreviewMediaSource(_0x4541b7, _0x522637),
      _0x11c508 = _0x464f1c || !!_0xcde5a4;
    if (_0x11c508) _0x4541b7['dataset']['mediaSourceOwner'] = '1';
    else delete _0x4541b7['dataset']['mediaSourceOwner'];
    const _0x44c65b =
        _0x44b5e2['viewportBusy'] === !![] || _0x44b5e2['options']?.['suppressNewMedia'] === !![],
      _0x66c21e =
        _0x491c43 &&
        _0x240c04 === 'video' &&
        _0x522637['length'] > 0x0 &&
        (_0x1e21ed['motionFront'] ||
          (_0xd5ed12 &&
            (_0x1e21ed['mounted'] ||
              _0x44b5e2['requiredImmediateMediaSourceOwnerIds'] === null ||
              _0x44b5e2['requiredImmediateMediaSourceOwnerIds']['has'](_0x422d3a)))),
      _0x50dc84 =
        _0x491c43 &&
        _0x240c04 === 'image' &&
        _0x522637['length'] > 0x0 &&
        (_0x1e21ed['fullEligibleVisible'] ||
          (isRendererFastPreviewMediaReadable(_0x310a2b, _0x44b5e2['options']) &&
            (_0x1e21ed['motionFront'] || _0xd5ed12)) ||
          (_0xd5ed12 &&
            (_0x1e21ed['mounted'] ||
              _0x44b5e2['requiredImmediateMediaSourceOwnerIds'] === null ||
              _0x44b5e2['requiredImmediateMediaSourceOwnerIds']['has'](_0x422d3a))) ||
          _0x44b5e2['mediaPlan']['explicitMediaSourceOwnerIds']?.['has'](_0x422d3a)),
      _0x3944d3 =
        _0x11c508 && (!_0x491c43 || _0x44b5e2['options']?.['suspendNewMediaSrc'] === !![])
          ? getReusableLoadedPreviewMediaSource(_0x4541b7, _0x522637)
          : '',
      _0x35bd6b =
        _0x11c508 && _0x44c65b && (!_0x491c43 || !_0x3944d3)
          ? getReusableCurrentPreviewMediaSource(_0x4541b7, _0x522637)
          : '';
    let _0x15dcf3 = [];
    if (_0x491c43 && (_0x44b5e2['options']?.['suspendNewMediaSrc'] !== !![] || _0x66c21e || _0x50dc84))
      _0x15dcf3 = _0x522637;
    else {
      if (_0xcde5a4) _0x15dcf3 = [_0xcde5a4];
      else {
        if (_0x3944d3) _0x15dcf3 = [_0x3944d3];
        else _0x35bd6b && (_0x15dcf3 = [_0x35bd6b]);
      }
    }
    const _0x2268f0 = _0x15dcf3['length'] > 0x0,
      _0x298566 =
        _0x491c43 && _0x2268f0 && (_0x1e21ed['selected'] || _0x1e21ed['retained'] || _0x1e21ed['mounted']),
      _0x2b8f60 = _0x2268f0 && previewMediaNeedsSrc(_0x4541b7, _0x15dcf3),
      _0x32bcfc = _0x240c04 === 'video' && _0x2268f0,
      _0xcbaf17 =
        (_0x1e21ed['fullEligibleVisible'] || _0xd5ed12) &&
        _0x44b5e2['options']?.['deferVisibleMediaSrc'] !== !![] &&
        (_0x240c04 === 'video' ||
          _0x44b5e2['visibleMediaCandidateCount'] <= _0x44b5e2['immediateMediaSrcLimit']),
      _0x40ccdf = _0x491c43 && _0x2268f0 && (_0x298566 || _0xcbaf17),
      _0x1dbc4f = _0x32bcfc && _0x40ccdf,
      _0x1e6315 =
        _0x491c43 &&
        _0x2268f0 &&
        (_0x1e21ed['fullEligibleVisible'] ||
          _0x1e21ed['fullEligibleMotionAhead'] ||
          _0xd5ed12 ||
          _0x1e21ed['motionFront'] ||
          _0x1e21ed['motionAhead'] ||
          _0x298566),
      _0x3afa57 =
        _0x491c43 &&
        _0x2268f0 &&
        _0x44b5e2['mediaPlan']['lowPriority'] === !![] &&
        _0x44b5e2['viewportBusy'] !== !![] &&
        _0x42981d,
      _0x3f6647 =
        _0x2b8f60 &&
        !_0x40ccdf &&
        (_0x44b5e2['immediateMediaSrcSlotsRef']['value'] <= 0x0 ||
          (_0x32bcfc && _0x44b5e2['immediateVideoMediaSrcSlotsRef']['value'] <= 0x0));
    if (_0x2b8f60 && !_0x3f6647) {
      if (!_0x40ccdf) _0x44b5e2['immediateMediaSrcSlotsRef']['value'] -= 0x1;
      _0x32bcfc && !_0x40ccdf && (_0x44b5e2['immediateVideoMediaSrcSlotsRef']['value'] -= 0x1);
    }
    const _0x5349cb =
        (_0x491c43 && _0x2268f0 && _0x44b5e2['mediaPlan']['prefetchAhead'] === !![]) || _0x3afa57,
      _0x14962b = syncPreviewEl(_0x4541b7, _0x534620, {
        kind: _0x240c04,
        text: _0x1e21ed['text'] ?? getPreviewText(_0x534620, _0x240c04),
        sources: _0x15dcf3,
        geometry: _0x310a2b,
        offsetX: _0x44b5e2['layerBounds']['offsetX'],
        offsetY: _0x44b5e2['layerBounds']['offsetY'],
        mediaLoading: _0x1e6315 || _0x5349cb ? 'eager' : _0x44b5e2['mediaLoading'],
        mediaFetchPriority: _0x1e6315 || _0x5349cb ? 'high' : _0x44b5e2['mediaFetchPriority'],
        mediaCritical: _0x40ccdf,
        mediaDirectWhenBlank:
          _0x1e21ed['fullEligibleVisible'] ||
          _0xd5ed12 ||
          (_0x491c43 &&
            (_0x1e21ed['motionFront'] ||
              (_0x44b5e2['viewportBusy'] &&
                _0x44b5e2['mediaPlan']['explicitMediaSourceOwnerIds']?.['has'](_0x422d3a)))),
        mediaFallbackWhileDecoding: _0x1e21ed['fullEligiblePreview'],
        mediaHoldFallbackWhileBusy:
          _0x44b5e2['viewportBusy'] && _0x44b5e2['options']?.['suspendNewMediaSrc'] === !![],
        viewportBusy: _0x44b5e2['viewportBusy'],
        placeholderReady: _0x522637['length'] === 0x0,
        preserveInFlightResource: _0x44b5e2['options']?.['suspendNewMediaSrc'] !== !![],
        queuePriority: resolveRendererFastPreviewMediaQueuePriority(_0x1e21ed, _0x44b5e2['options']),
        mediaSrcBatchLimit: _0x44b5e2['mediaSrcBatchLimit'],
        videoMediaSrcBatchLimit: _0x44b5e2['videoMediaSrcBatchLimit'],
        deferMediaSrc: _0x3f6647,
        scheduleMediaSrc: _0x162fb6,
        cancelPendingMediaSrc: _0x2b51e3,
        onMediaPresented: _0x2d5990,
      });
    return (
      restorePreviewRasterFrameState(_0x4541b7),
      _0x11c508 && restorePaintedPreviewMedia(_0x4541b7) && (_0x4541b7['dataset']['mediaSourceOwner'] = '1'),
      syncPreviewConnectionState(_0x4541b7, _0x534620, _0x44b5e2['options']),
      (_0x4541b7['_previewCandidateSyncSig'] = buildPreviewCandidateSyncSignature(
        _0x1e21ed,
        _0x44b5e2,
        _0x4541b7,
      )),
      {
        createdCount: _0x3edede,
        imageCount: Number(_0x14962b?.['imageCount'] || 0x0),
        reusedCount: _0x4c505d,
        srcAssignedCount: Number(_0x14962b?.['srcAssignedCount'] || 0x0),
      }
    );
  }
  function _0x27ef9c() {
    const _0x470ffc = isPerfProbeEnabled(),
      _0x1ff45e = _0x470ffc ? nowPerf() : 0x0;
    _0x191dc8 = null;
    const _0x4acadf = _0x9f22b8;
    if (!_0x4acadf || _0x4acadf['generation'] !== _0x186f0c || _0x4acadf['layer']?.['isConnected'] === ![]) {
      _0x9f22b8 = null;
      return;
    }
    let _0x31ed8c = Number(_0x4acadf['createBatchSize']) || FAST_PREVIEW_FALLBACK_NODE_CREATE_BATCH_SIZE,
      _0x2c0c8c = 0x0,
      _0x194b05 = 0x0,
      _0x2c3e42 = 0x0,
      _0x1d4a2c = 0x0;
    while (_0x31ed8c > 0x0 && _0x4acadf['candidates']['length'] > 0x0) {
      const _0x34b0ed = _0x5585bc(_0x4acadf['candidates']['shift'](), _0x4acadf);
      ((_0x2c0c8c += Number(_0x34b0ed?.['createdCount'] || 0x0)),
        (_0x194b05 += Number(_0x34b0ed?.['imageCount'] || 0x0)),
        (_0x2c3e42 += Number(_0x34b0ed?.['reusedCount'] || 0x0)),
        (_0x1d4a2c += Number(_0x34b0ed?.['srcAssignedCount'] || 0x0)),
        (_0x31ed8c -= 0x1));
    }
    _0x98fc4d(_0x4acadf);
    _0x4acadf['pendingMediaPriorityChanged'] &&
      (_0x3ce58c(), (_0x4acadf['pendingMediaPriorityChanged'] = ![]));
    _0x4acadf['viewportBusy'] === !![] &&
      ((_0x64e96d = Math['min'](
        _0x64e96d,
        Math['max'](0x0, _0x4acadf['immediateMediaSrcSlotsRef']['value']),
      )),
      (_0x85d8d3 = Math['min'](
        _0x85d8d3,
        Math['max'](0x0, _0x4acadf['immediateVideoMediaSrcSlotsRef']['value']),
      )));
    if (_0x470ffc) {
      const _0x41e08a = nowPerf();
      recordFastPreviewSample('create-batch', _0x41e08a - _0x1ff45e, {
        createdCount: _0x2c0c8c,
        endPerf: _0x41e08a,
        imageCount: _0x194b05,
        pendingCreateCount: _0x4acadf['candidates']['length'],
        pendingMediaSrcCount: _0x46db57['length'],
        poolSize: _0x636cda['length'],
        reusedCount: _0x2c3e42,
        srcAssignedCount: _0x1d4a2c,
        startPerf: _0x1ff45e,
        zoom: _0x4acadf['options']?.['viewport']?.['zoom'],
      });
    }
    _0x4acadf['candidates']['length'] > 0x0
      ? (_0x191dc8 = _0xdcb895(_0x27ef9c))
      : ((_0x9f22b8 = null), _0x314b1f());
  }
  function _0x306693(_0x347e8d) {
    if (!_0x347e8d) return null;
    return (
      _0x3db71f && _0x3db71f['parentNode'] !== _0x347e8d && (_0x3db71f['remove']?.(), (_0x3db71f = null)),
      !_0x3db71f &&
        ((_0x3db71f = document['createElement']('div')),
        (_0x3db71f['className'] = 'v2-fast-preview-layer'),
        (_0x3db71f['dataset']['role'] = 'fast-preview-layer')),
      !_0x3db71f['isConnected'] &&
        (typeof _0x347e8d['prepend'] === 'function'
          ? _0x347e8d['prepend'](_0x3db71f)
          : _0x347e8d['appendChild'](_0x3db71f)),
      _0x3db71f
    );
  }
  function _0x215dae(_0x4c169e) {
    if (!_0x3db71f?.['classList']) return;
    const _0x1f1780 = Number(_0x4c169e?.['zoom']);
    _0x3db71f['classList']['toggle'](
      'is-minimal-interaction-detail',
      Number['isFinite'](_0x1f1780) &&
        _0x1f1780 > 0x0 &&
        _0x1f1780 <= FAST_PREVIEW_MINIMAL_INTERACTION_DETAIL_MAX_ZOOM,
    );
  }
  function _0x443b6b({
    preserveStagedReleases: preserveStagedReleases = ![],
    preserveDragPreviewScene: preserveDragPreviewScene = ![],
  } = {}) {
    (_0x341954(), _0x16bbdb());
    for (const _0x45fc8c of _0x550eed['values']()) {
      if (typeof _0x45fc8c === 'function') _0x45fc8c();
    }
    _0x550eed['clear']();
    if (!preserveStagedReleases)
      for (const _0x5052fa of Array['from'](_0xb96af9['values']())) {
        _0x2c1784(_0x5052fa, { cache: ![] });
      }
    (_0x3f32d8['forEach']((_0x44aa79, _0x493297) => {
      (_0x5cdf10(_0x493297, ![]), _0x2e599b(_0x44aa79));
    }),
      _0x3f32d8['clear'](),
      _0x636cda['forEach']((_0x259cb3) => _0x2e599b(_0x259cb3)),
      (_0x636cda['length'] = 0x0),
      _0x5a9cc8['forEach']((_0x45ab7e) => _0x2e599b(_0x45ab7e)),
      _0x5a9cc8['clear'](),
      _0x5b43c3['clear'](),
      _0xa59588['clear'](),
      _0x134f77['clear'](),
      (_0xd569ee = null));
    if (!preserveDragPreviewScene) _0x8ce458 = null;
    ((_0xd5a452 = 0x0),
      (_0x4b12bb = ![]),
      (_0x1745f9 = null),
      (!preserveStagedReleases || _0xb96af9['size'] === 0x0) &&
        (_0x3db71f?.['remove']?.(), (_0x3db71f = null)),
      (_0x48ea8b = createEmptyStats()));
  }
  function _0x314b1f() {
    const _0x512845 = createEmptyStats();
    for (const [_0x209fa0, _0x259dbf] of _0x3f32d8['entries']()) {
      (_0x5cdf10(_0x209fa0, !![]), (_0x512845['fastPreviewCount'] += 0x1));
      if (isElementVisible(_0x259dbf)) _0x512845['visibleFastPreviewCount'] += 0x1;
      if (_0x259dbf?.['dataset']?.['hasMedia'] === '1') _0x512845['previewWithMediaCount'] += 0x1;
      const _0x48e8a1 = _0x2e5e2d?.(_0x209fa0);
      _0xfd24f7?.(_0x209fa0) &&
        _0x48e8a1?.['isConnected'] !== ![] &&
        (_0x48e8a1?.['classList']?.['contains']?.('v2-node-detail-deferred') ||
          _0x48e8a1?.['dataset']?.['detailStage'] === 'deferred') &&
        (_0x512845['deferredMountedWithPreviewCount'] += 0x1);
    }
    for (const { el: _0x4a42ed } of _0xb96af9['values']()) {
      _0x512845['stagedPreviewCount'] += 0x1;
      if (_0x4a42ed?.['isConnected'] === ![]) continue;
      ((_0x512845['connectedStagedPreviewCount'] += 0x1), (_0x512845['fastPreviewCount'] += 0x1));
      if (isElementVisible(_0x4a42ed)) _0x512845['visibleFastPreviewCount'] += 0x1;
      if (_0x4a42ed?.['dataset']?.['hasMedia'] === '1') _0x512845['previewWithMediaCount'] += 0x1;
    }
    return ((_0x48ea8b = _0x512845), _0x512845);
  }
  function _0x82325e(_0x72f3d9) {
    const _0x2020bb = String(_0x72f3d9 || ''),
      _0x45189d = _0x550eed['get'](_0x2020bb);
    if (typeof _0x45189d === 'function') _0x45189d();
    _0x550eed['delete'](_0x2020bb);
  }
  function _0x503d61(_0xe40650, _0x5996c6) {
    const _0x58faf5 = String(_0xe40650 || '');
    if (!_0x58faf5 || !_0x5996c6) return;
    if (_0x4d8c66(_0x58faf5, _0x5996c6)) {
      (_0x82325e(_0x58faf5),
        _0xdcb895(() => {
          const _0x351059 = _0x2e5e2d?.(_0x58faf5);
          if (_0x40bb90(_0x58faf5, _0x351059) && _0x4d8c66(_0x58faf5, _0x351059)) {
            try {
              _0x2d5990?.(_0x58faf5, _0x351059);
            } catch {}
            _0x3d2f34(_0x58faf5);
          }
        }));
      return;
    }
    if (_0x550eed['has'](_0x58faf5)) return;
    const _0x427cee = [
      ...(_0x5996c6['querySelectorAll']?.('img') || []),
      ...(_0x5996c6['querySelectorAll']?.('video') || []),
    ];
    if (_0x427cee['length'] === 0x0) return;
    const _0x4011a7 = () => {
      const _0x39cc83 = _0x2e5e2d?.(_0x58faf5);
      if (!_0x40bb90(_0x58faf5, _0x39cc83) || !_0x4d8c66(_0x58faf5, _0x39cc83)) return;
      try {
        _0x2d5990?.(_0x58faf5, _0x39cc83);
      } catch {}
      _0x3d2f34(_0x58faf5);
    };
    for (const _0x37bec7 of _0x427cee) {
      (_0x37bec7['addEventListener']?.('load', _0x4011a7),
        _0x37bec7['addEventListener']?.('loadeddata', _0x4011a7),
        _0x37bec7['addEventListener']?.('canplay', _0x4011a7));
    }
    _0x550eed['set'](_0x58faf5, () => {
      for (const _0x2e12de of _0x427cee) {
        (_0x2e12de['removeEventListener']?.('load', _0x4011a7),
          _0x2e12de['removeEventListener']?.('loadeddata', _0x4011a7),
          _0x2e12de['removeEventListener']?.('canplay', _0x4011a7));
      }
    });
  }
  function _0x2c1784(_0x3ef97a) {
    if (!_0x3ef97a || _0xb96af9['get'](_0x3ef97a['el']) !== _0x3ef97a) return;
    (_0x1dfb61(_0x3ef97a['finalizeFrameId']),
      (_0x3ef97a['finalizeFrameId'] = null),
      _0xb96af9['delete'](_0x3ef97a['el']));
    if (_0x3f32d8['get'](_0x3ef97a['nodeId']) === _0x3ef97a['el']) return;
    _0x2f05f3(_0x3ef97a['el']);
  }
  function _0x252dc5(_0xe6edf7) {
    if (!_0xe6edf7 || _0xb96af9['get'](_0xe6edf7['el']) !== _0xe6edf7) return ![];
    const { el: _0x5e2368, nodeId: _0x98ffe8 } = _0xe6edf7;
    (_0x1dfb61(_0xe6edf7['finalizeFrameId']),
      (_0xe6edf7['finalizeFrameId'] = null),
      _0xb96af9['delete'](_0x5e2368),
      delete _0x5e2368['dataset']['previewReleaseStage'],
      Object['assign'](_0x5e2368['style'], { display: '', opacity: '', pointerEvents: '', visibility: '' }));
    const _0x7b56cd = _0xe6edf7['layerEl'] || _0x3db71f;
    return (
      _0x7b56cd && _0x5e2368['parentNode'] !== _0x7b56cd && _0x7b56cd['appendChild'](_0x5e2368),
      _0x3f32d8['set'](_0x98ffe8, _0x5e2368),
      !![]
    );
  }
  function _0x3ae3d3(_0x31e144, _0x1295b) {
    for (const _0x4d9bb5 of Array['from'](_0xb96af9['values']())) {
      const _0xb01d78 = _0x31e144?.[_0x4d9bb5['nodeId']];
      if (!_0xb01d78 || !isRendererFastPreviewGeometryVisible(getPreviewGeometry(_0xb01d78), _0x1295b)) {
        _0x2c1784(_0x4d9bb5);
        continue;
      }
      const _0x57cee5 = _0x2e5e2d?.(_0x4d9bb5['nodeId']),
        _0x18e22f = _0x40bb90(_0x4d9bb5['nodeId'], _0x57cee5);
      (!_0x18e22f || !_0x4d8c66(_0x4d9bb5['nodeId'], _0x57cee5)) && _0x252dc5(_0x4d9bb5);
    }
  }
  function _0x3d2f34(_0x7e6eb6, { collect: collect = !![] } = {}) {
    const _0x1a4ac2 = String(_0x7e6eb6 || ''),
      _0x19168e = _0x2e5e2d?.(_0x1a4ac2);
    if (!_0x1a4ac2 || !_0x19168e || !_0x40bb90(_0x1a4ac2, _0x19168e) || !_0x4d8c66(_0x1a4ac2, _0x19168e))
      return ![];
    (_0x134f77['delete'](_0x1a4ac2), _0x5cdf10(_0x1a4ac2, ![]), _0x82325e(_0x1a4ac2));
    const _0x263c96 = _0x3f32d8['get'](_0x1a4ac2);
    _0x9f22b8?.['candidates'] &&
      (_0x9f22b8['candidates'] = _0x9f22b8['candidates']['filter'](
        (_0xdda0d8) => _0xdda0d8['nodeId'] !== _0x1a4ac2,
      ));
    if (!_0x263c96) return !![];
    (_0x3f32d8['delete'](_0x1a4ac2), _0x5634d8(_0x263c96));
    const _0x2d74bf = _0x263c96['parentNode'] || _0x3db71f;
    ((_0x263c96['dataset']['previewReleaseStage'] = 'detached'), _0x263c96['remove']?.());
    const _0xd4e510 = { el: _0x263c96, nodeId: _0x1a4ac2, layerEl: _0x2d74bf, finalizeFrameId: null };
    (_0xb96af9['set'](_0x263c96, _0xd4e510),
      (_0xd4e510['finalizeFrameId'] = _0xdcb895(() => {
        ((_0xd4e510['finalizeFrameId'] = null), _0x2c1784(_0xd4e510), _0x314b1f());
      })));
    if (collect) _0x314b1f();
    return !![];
  }
  function _0x244818(_0x552b1b) {
    const _0x346203 = String(_0x552b1b || '');
    for (const _0x52ced4 of Array['from'](_0xb96af9['values']())) {
      if (_0x52ced4['nodeId'] !== _0x346203) continue;
      _0x2c1784(_0x52ced4);
    }
  }
  function _0x3f9798(_0x1e3e63, { cache: cache = !![], collect: collect = !![] } = {}) {
    const _0x1f44d4 = String(_0x1e3e63 || '');
    (_0x5b43c3['delete'](_0x1f44d4),
      _0x134f77['delete'](_0x1f44d4),
      _0x5cdf10(_0x1f44d4, ![]),
      _0x82325e(_0x1f44d4),
      _0x244818(_0x1f44d4));
    const _0x1cc512 = _0x3f32d8['get'](_0x1f44d4);
    _0x9f22b8?.['candidates'] &&
      (_0x9f22b8['candidates'] = _0x9f22b8['candidates']['filter'](
        (_0x4f55e3) => _0x4f55e3['nodeId'] !== _0x1f44d4,
      ));
    if (!_0x1cc512) return;
    _0x3f32d8['delete'](_0x1f44d4);
    const _0x185ead = _0x1cc512['querySelector']?.('.v2-fast-preview-media'),
      _0x3432a6 = isPreviewMediaResourceProtected(_0x185ead);
    ((!cache && !_0x3432a6) || !_0x5ba772(_0x1f44d4, _0x1cc512)) && _0x2f05f3(_0x1cc512);
    if (collect) _0x314b1f();
  }
  function _0x2ca9d1(_0x4b5ca5, { collect: collect = !![] } = {}) {
    const _0x20c0d4 = String(_0x4b5ca5 || '');
    (_0x5b43c3['delete'](_0x20c0d4),
      _0x134f77['delete'](_0x20c0d4),
      _0x5cdf10(_0x20c0d4, ![]),
      _0x82325e(_0x20c0d4),
      _0x244818(_0x20c0d4));
    _0x9f22b8?.['candidates'] &&
      (_0x9f22b8['candidates'] = _0x9f22b8['candidates']['filter'](
        (_0x3f4ee1) => _0x3f4ee1['nodeId'] !== _0x20c0d4,
      ));
    const _0x5ba7b3 = _0x3f32d8['get'](_0x20c0d4);
    _0x5ba7b3 && (_0x3f32d8['delete'](_0x20c0d4), _0x2f05f3(_0x5ba7b3));
    const _0x33ed35 = _0x5a9cc8['get'](_0x20c0d4);
    _0x33ed35 && (_0x5a9cc8['delete'](_0x20c0d4), _0x2f05f3(_0x33ed35));
    _0xa59588['delete'](_0x20c0d4);
    if (collect && (_0x5ba7b3 || _0x33ed35)) _0x314b1f();
    return !!(_0x5ba7b3 || _0x33ed35);
  }
  function _0x5cfc11(_0xbd79ce) {
    const _0x23c829 =
      _0xbd79ce && typeof _0xbd79ce[Symbol['iterator']] === 'function'
        ? new Set(Array['from'](_0xbd79ce, (_0x4f98c4) => String(_0x4f98c4 || '')))
        : new Set();
    let _0x1e31e0 = 0x0;
    for (const _0x30ce3c of Array['from'](_0x3f32d8['keys']())) {
      if (_0x23c829['has'](_0x30ce3c)) continue;
      (_0x3f9798(_0x30ce3c, { collect: ![] }), (_0x1e31e0 += 0x1));
    }
    for (const _0x2a1c3a of Array['from'](_0xb96af9['values']())) {
      if (_0x23c829['has'](_0x2a1c3a['nodeId'])) continue;
      _0x2c1784(_0x2a1c3a);
    }
    for (const _0xf9a28 of _0x5b43c3['keys']()) {
      if (!_0x23c829['has'](_0xf9a28)) _0x5b43c3['delete'](_0xf9a28);
    }
    if (_0x1e31e0 > 0x0) _0x314b1f();
    return _0x1e31e0;
  }
  function _0x3404e3(_0x1a88b5) {
    if (!_0x1a88b5) return ![];
    if (
      _0x1a88b5['classList']?.['contains']?.('selected') ||
      _0x1a88b5['classList']?.['contains']?.('v2-selected')
    )
      return !![];
    const _0x2884bb = typeof document !== 'undefined' ? document['activeElement'] : null;
    return !!(_0x2884bb && _0x1a88b5['contains']?.(_0x2884bb));
  }
  function _0x8612e(_0x59f74d, _0x223186, _0x2394ab = {}) {
    if (!_0x59f74d || !_0x223186) return ![];
    const _0x4faa83 = _0x2394ab?.['dragTargets'];
    if (!_0x4faa83?.['has']?.(_0x59f74d)) return ![];
    const _0xf389ab = _0x2394ab?.['dragContext'] || {};
    if (_0xf389ab['isDragging'] !== !![] || _0xf389ab['isCommittingDrag'] === !![]) return ![];
    const _0x2b8407 = toNumber(_0xf389ab['pendingDx'], 0x0),
      _0x13c631 = toNumber(_0xf389ab['pendingDy'], 0x0);
    return _0xf389ab['hasMoved'] === !![] || Math['hypot'](_0x2b8407, _0x13c631) > 0x0;
  }
  function _0x2a1281(
    _0x206030,
    _0x4951b9,
    {
      kind: kind = '',
      hasMedia: hasMedia = ![],
      dragTargets: dragTargets = null,
      dragContext: dragContext = null,
      fullEligibleVisible: fullEligibleVisible = ![],
    } = {},
  ) {
    const _0x1ce542 = _0x134f77['has'](String(_0x206030 || '')),
      _0x395ddb = _0x2e5e2d?.(_0x206030),
      _0x10f7ed = _0x40bb90(_0x206030, _0x395ddb),
      _0x45149e = kind === 'image' || kind === 'video',
      _0x2fe698 = _0x10f7ed && _0x45149e && hasMedia ? _0x4d8c66(_0x206030, _0x395ddb) : !![];
    if (kind === 'video' && _0x10f7ed && hasActiveMountedVideoPlayback(_0x395ddb))
      return (_0x134f77['delete'](String(_0x206030 || '')), _0x82325e(_0x206030), ![]);
    if (kind === 'image' && fullEligibleVisible && _0x10f7ed && _0x2fe698)
      return (_0x134f77['delete'](String(_0x206030 || '')), _0x82325e(_0x206030), ![]);
    if (_0x10f7ed && _0x8612e(_0x206030, _0x395ddb, { dragTargets: dragTargets, dragContext: dragContext }))
      return (_0x82325e(_0x206030), ![]);
    if (_0x10f7ed && _0x45149e && hasMedia && _0x2fe698 && isFastPreviewReleasedForPlayback(_0x395ddb))
      return (_0x82325e(_0x206030), ![]);
    if (_0x4951b9?.['has']?.(_0x206030) || _0x3404e3(_0x395ddb)) {
      if (!_0x10f7ed) return !![];
      if (hasMedia && _0x45149e && !_0x2fe698) return (_0x503d61(_0x206030, _0x395ddb), !![]);
      return (_0x134f77['delete'](String(_0x206030 || '')), _0x82325e(_0x206030), ![]);
    }
    if (_0x1ce542) {
      if (!_0x10f7ed) return hasMedia;
      if (hasMedia && _0x45149e && !_0x2fe698) return (_0x503d61(_0x206030, _0x395ddb), !![]);
      return (_0x134f77['delete'](String(_0x206030 || '')), _0x82325e(_0x206030), ![]);
    }
    if (!_0x10f7ed) return !![];
    if ((kind === 'image' || kind === 'video') && !hasMedia) return ![];
    if (hasMedia && _0x45149e && !_0x2fe698) return (_0x503d61(_0x206030, _0x395ddb), !![]);
    _0x82325e(_0x206030);
    if (
      _0x395ddb['classList']?.['contains']?.('v2-node-detail-deferred') ||
      _0x395ddb['dataset']?.['detailStage'] === 'deferred'
    )
      return !![];
    return ![];
  }
  function _0x214e32(_0x3faa25, _0x3fab57, _0x4e1752 = {}) {
    if (
      getPreviewKind(_0x3fab57) !== 'image' ||
      _0x4e1752['fullEligibleVisibleImageNodeIds']?.['has']?.(_0x3faa25) !== !![]
    )
      return ![];
    const _0x260a6e = _0x2e5e2d?.(_0x3faa25);
    return !!(_0x40bb90(_0x3faa25, _0x260a6e) && _0x4d8c66(_0x3faa25, _0x260a6e));
  }
  function _0x22fbca(_0x29dbc6) {
    if (!_0x29dbc6) return;
    _0x134f77['add'](String(_0x29dbc6));
  }
  function _0x2b4893(_0x104655, _0x207a8b = _0xd569ee?.[String(_0x104655 || '')]) {
    const _0x1c1d83 = _0x3f32d8['get'](String(_0x104655 || '')),
      _0xf0a87d = getPreviewRasterFrameEl(_0x1c1d83);
    if (isPreviewRasterFrameReady(_0x1c1d83)) {
      for (const _0x4df914 of [_0x3db71f, _0x1c1d83, _0xf0a87d]) {
        if (!isElementVisible(_0x4df914)) return ![];
      }
      return !![];
    }
    const _0x200cfe = _0x1c1d83?.['querySelector']?.('.v2-fast-preview-media');
    if (!_0x1c1d83 || _0x1c1d83['isConnected'] === ![] || !isPreviewMediaLoaded(_0x200cfe)) return ![];
    if (
      String(_0x200cfe?.['tagName'] || '')['toLowerCase']() === 'img' &&
      typeof _0x200cfe?.['complete'] === 'boolean' &&
      (_0x200cfe['complete'] !== !![] || Number(_0x200cfe['naturalWidth'] || 0x0) <= 0x0)
    )
      return ![];
    for (const _0x32b4a3 of [_0x3db71f, _0x1c1d83, _0x200cfe]) {
      if (!isElementVisible(_0x32b4a3)) return ![];
    }
    return isPresentationMediaSourceForNode(_0x200cfe, _0x207a8b);
  }
  function _0x3752f8(_0x49885a, _0x5f4e9e = _0xd569ee?.[String(_0x49885a || '')]) {
    const _0xfc4267 = String(_0x49885a || '');
    if (_0x2b4893(_0xfc4267, _0x5f4e9e)) return !![];
    const _0x3b1a09 = _0x2e5e2d?.(_0xfc4267);
    return !!(_0x40bb90(_0xfc4267, _0x3b1a09) && _0x4d8c66(_0xfc4267, _0x3b1a09, _0x5f4e9e));
  }
  function _0x2e30b3(_0x5dbc53) {
    return _0x3f32d8['has'](String(_0x5dbc53 || ''));
  }
  function _0x135d2d(_0x2c5a35) {
    if (!_0x2c5a35) return;
    const _0x15fea3 = _0x2e5e2d?.(_0x2c5a35);
    if (!_0x40bb90(_0x2c5a35, _0x15fea3)) return ![];
    return _0x3d2f34(_0x2c5a35);
  }
  function _0xd02e44(
    _0x34d284,
    {
      dx: dx = 0x0,
      dy: dy = 0x0,
      active: active = ![],
      settle: settle = ![],
      remove: remove = ![],
      rasterFrame: rasterFrame = null,
      existingOnly: existingOnly = ![],
      width: _0x17fb73,
      height: _0x51a68b,
    } = {},
  ) {
    const _0x25cd0d = String(_0x34d284 || '')['trim']();
    if (!_0x25cd0d) return ![];
    if (remove === !![]) return (_0x3f9798(_0x25cd0d), !![]);
    let _0x14b16b = _0x3f32d8['get'](_0x25cd0d),
      _0x49d4f6 = ![];
    const _0xea3bc2 = rasterFrame || _0x5b43c3['get'](_0x25cd0d) || null;
    if (!_0x14b16b && existingOnly && !_0xea3bc2) return ![];
    _0x14b16b &&
      _0xea3bc2 &&
      (_0x5b43c3['delete'](_0x25cd0d), attachPreviewRasterFrame(_0x14b16b, _0xea3bc2));
    if (!_0x14b16b && active === !![]) {
      const _0x5de163 = _0x8ce458?.['nodes']?.[_0x25cd0d],
        _0x3b6208 = _0x8ce458?.['canvasEl'] || _0x3db71f?.['parentNode'] || null;
      if (_0x5de163 && _0x3b6208) {
        const _0x1a8247 = _0x306693(_0x3b6208),
          _0x15c66d = resolveRendererPreviewNodePresentation(_0x5de163),
          _0x192bc8 = syncLayerBounds(_0x1a8247, [{ geometry: _0x15c66d['geometry'] }], {
            preserveAnchor: !![],
          }) || { offsetX: 0x0, offsetY: 0x0 };
        (_0x215dae(_0x8ce458?.['options']?.['viewport']),
          (_0x14b16b = _0x56133c(_0x25cd0d)),
          (_0x49d4f6 = !![]),
          _0x3f32d8['set'](_0x25cd0d, _0x14b16b),
          _0x1a8247['appendChild'](_0x14b16b),
          delete _0x14b16b['_fastPreviewReused'],
          _0x5cdf10(_0x25cd0d, !![]),
          syncPreviewEl(_0x14b16b, _0x5de163, {
            ..._0x15c66d,
            offsetX: _0x192bc8['offsetX'],
            offsetY: _0x192bc8['offsetY'],
            mediaLoading: 'eager',
            mediaFetchPriority: 'high',
            mediaCritical: !![],
            mediaDirectWhenBlank: !![],
            mediaFallbackWhileDecoding: !![],
            placeholderReady:
              _0x15c66d['sources']['length'] === 0x0 &&
              _0x15c66d['kind'] !== 'image' &&
              _0x15c66d['kind'] !== 'video',
            preserveInFlightResource: !![],
            scheduleMediaSrc: _0x162fb6,
            cancelPendingMediaSrc: _0x2b51e3,
            onMediaPresented: _0x2d5990,
          }),
          _0xea3bc2 && (_0x5b43c3['delete'](_0x25cd0d), attachPreviewRasterFrame(_0x14b16b, _0xea3bc2)),
          syncPreviewConnectionState(_0x14b16b, _0x5de163, _0x8ce458?.['options']),
          _0x314b1f());
      }
    }
    if (!_0x14b16b) return ![];
    if (Number['isFinite'](_0x17fb73) && _0x17fb73 > 0x0) _0x14b16b['style']['width'] = _0x17fb73 + 'px';
    if (Number['isFinite'](_0x51a68b) && _0x51a68b > 0x0) _0x14b16b['style']['height'] = _0x51a68b + 'px';
    if (active !== !![] && settle === !![]) {
      const _0x3bd28c = _0x2e5e2d?.(_0x25cd0d),
        _0x4faf7e = _0x8ce458?.['nodes']?.[_0x25cd0d],
        _0x44c44d = getPreviewKind(_0x4faf7e),
        _0x4e06e6 =
          _0x40bb90(_0x25cd0d, _0x3bd28c) &&
          ((_0x44c44d !== 'image' && _0x44c44d !== 'video') || _0x4d8c66(_0x25cd0d, _0x3bd28c, _0x4faf7e));
      if (_0x4e06e6) return (_0x3f9798(_0x25cd0d), !![]);
      return settlePreviewDragState(_0x14b16b, dx, dy);
    }
    ((_0x14b16b['_previewDragActive'] = active === !![]),
      (_0x14b16b['_previewDragDx'] = toNumber(dx, 0x0)),
      (_0x14b16b['_previewDragDy'] = toNumber(dy, 0x0)));
    const _0x5e85ab = applyPreviewDragTransform(_0x14b16b);
    if (active !== !![]) return _0x5e85ab;
    const _0x310310 = _0x2b4893(_0x25cd0d) || _0x14b16b['dataset']?.['placeholderReady'] === '1';
    return (!_0x310310 && _0x49d4f6 && _0x3f9798(_0x25cd0d, { cache: ![] }), _0x5e85ab && _0x310310);
  }
  function _0x10fa27(_0xc1ef0c, _0x3dbbfa, _0x5393c7, _0x4b2e86, _0x5e16c6 = {}) {
    const _0x3f5e03 = isRendererRuntimeDiagnosticsEnabled(),
      _0x23ec55 = _0x3f5e03 ? nowPerf() : 0x0,
      _0x16843b = _0x3dbbfa && typeof _0x3dbbfa === 'object' ? _0x3dbbfa : null,
      _0x35f63c = _0xd569ee !== _0x16843b;
    ((_0xd569ee = _0x16843b),
      (_0x8ce458 = {
        canvasEl: _0xc1ef0c || null,
        nodes: _0x16843b,
        options: _0x5e16c6 && typeof _0x5e16c6 === 'object' ? _0x5e16c6 : {},
      }));
    if (_0x35f63c && _0xa59588['size'] > 0x0)
      for (const _0x429899 of _0xa59588['keys']()) {
        if (!_0x3dbbfa?.[_0x429899]) _0xa59588['delete'](_0x429899);
      }
    _0x3f35bf(_0x5e16c6?.['viewportBusy']);
    const _0x39e9b3 = _0x3a0154() || isViewportInteractionBusyForPreview();
    _0x29c552(_0x39e9b3);
    const _0x4837ae = _0x5e7a2d(_0x5e16c6),
      _0x21cb56 = {
        ..._0x5e16c6,
        previewMotion: _0x4837ae,
        viewportBusy: _0x39e9b3,
        availablePreviewNodePoolSize: _0x636cda['length'],
      },
      _0x4729ce = _0x39e9b3 || _0x4837ae['zoomChanged'] === !![];
    _0x3ae3d3(_0x3dbbfa, _0x21cb56);
    if (!shouldUseFastPreviewLayer(_0x3dbbfa, _0x5393c7, _0x5e16c6))
      return _0x443b6b({ preserveStagedReleases: !![], preserveDragPreviewScene: !![] });
    for (const _0x593f83 of Array['from'](_0x3f32d8['keys']())) {
      const _0x42a749 = _0x3dbbfa?.[_0x593f83];
      if (!shouldShowGenerationBusyUi(_0x42a749)) continue;
      const _0x32c738 = _0x2e5e2d?.(_0x593f83);
      if (
        !_0x40bb90(_0x593f83, _0x32c738) &&
        isRendererFastPreviewGeometryVisible(getPreviewGeometry(_0x42a749), _0x21cb56)
      )
        continue;
      _0x3f9798(_0x593f83, { cache: ![], collect: ![] });
    }
    const _0x299cd6 = isPerfProbeEnabled(),
      _0x39cfdc = _0x299cd6 ? nowPerf() : 0x0,
      _0x1c0c8a = new Set(
        Array['from'](_0x9f22b8?.['candidates'] || [], (_0x5a5347) => String(_0x5a5347?.['nodeId'] || ''))[
          'filter'
        ](Boolean),
      ),
      _0x2bdf6e = _0x3f5e03 ? nowPerf() : 0x0,
      _0x2474c2 = [],
      _0x336c66 =
        _0x5393c7 instanceof Set
          ? _0x3f32d8['size'] === 0x0
            ? _0x5393c7
            : new Set(_0x5393c7)
          : _0x5393c7 && typeof _0x5393c7[Symbol['iterator']] === 'function'
            ? new Set(_0x5393c7)
            : Object['keys'](_0x3dbbfa || {});
    if (_0x336c66 instanceof Set)
      for (const _0x511236 of _0x3f32d8['keys']()) {
        if (_0x336c66['has'](_0x511236)) continue;
        const _0x3cdc45 = _0x3dbbfa?.[_0x511236],
          _0x89597f = _0x2e5e2d?.(_0x511236);
        _0x3cdc45 &&
          !_0x40bb90(_0x511236, _0x89597f) &&
          isRendererFastPreviewGeometryVisible(getPreviewGeometry(_0x3cdc45), _0x21cb56) &&
          _0x336c66['add'](_0x511236);
      }
    for (const _0x44efa6 of _0x336c66) {
      const _0x4838b0 = _0x3dbbfa?.[_0x44efa6],
        _0x1bc8ae = String(_0x4838b0?.['id'] || '');
      if (!_0x1bc8ae) continue;
      const _0x5599c4 = shouldShowGenerationBusyUi(_0x4838b0);
      let _0x505b56 = null;
      if (_0x5599c4) {
        const _0x1cf97b = _0x2e5e2d?.(_0x1bc8ae);
        _0x505b56 = getPreviewGeometry(_0x4838b0);
        if (_0x40bb90(_0x1bc8ae, _0x1cf97b) || !isRendererFastPreviewGeometryVisible(_0x505b56, _0x21cb56)) {
          _0x3f9798(_0x1bc8ae, { cache: ![], collect: ![] });
          continue;
        }
      }
      if (isWebPreviewNode(_0x4838b0)) continue;
      const _0x11fd35 = Number['isFinite'](Number(_0x4838b0?.['_bizRev']))
        ? Number(_0x4838b0['_bizRev'])
        : null;
      let _0x43a3dc = _0xa59588['get'](_0x1bc8ae);
      if (_0x11fd35 === null || !_0x43a3dc || _0x43a3dc['nodeBizRev'] !== _0x11fd35) {
        const _0xefc68 = getPreviewKind(_0x4838b0),
          _0x19defd = _0x21cb56['deferVisibleMediaSrc'] === !![];
        _0x43a3dc = {
          kind: _0xefc68,
          nodeBizRev: _0x11fd35,
          hasMediaHint: hasPreviewMediaHint(_0x4838b0, _0xefc68),
          sourcesDisplayFirst: _0x19defd
            ? null
            : getPreviewMediaUrls(_0x4838b0, _0xefc68, { displayFirst: !![] }),
          sourcesThumbnailFirst: _0x19defd
            ? null
            : getPreviewMediaUrls(_0x4838b0, _0xefc68, { displayFirst: ![] }),
          text: _0x19defd ? null : getPreviewText(_0x4838b0, _0xefc68),
        };
        if (_0x11fd35 === null) _0xa59588['delete'](_0x1bc8ae);
        else _0xa59588['set'](_0x1bc8ae, _0x43a3dc);
      }
      const _0x20cc86 = _0x43a3dc['kind'],
        _0x905c11 =
          _0x20cc86 === 'image' &&
          _0x21cb56['fullEligibleVisibleImageNodeIds']?.['has']?.(_0x1bc8ae) === !![],
        _0x496bc3 =
          _0x20cc86 === 'image' &&
          (_0x905c11 || _0x21cb56['fullEligiblePreviewImageNodeIds']?.['has']?.(_0x1bc8ae) === !![]),
        _0x25e5b4 = _0x496bc3 ? _0x43a3dc['sourcesDisplayFirst'] : _0x43a3dc['sourcesThumbnailFirst'],
        _0x373887 = !Array['isArray'](_0x25e5b4),
        _0x40ee2a = _0x373887 ? [] : _0x25e5b4,
        _0x26670a = _0x373887 ? _0x43a3dc['hasMediaHint'] === !![] : _0x40ee2a['length'] > 0x0;
      if (
        !_0x2a1281(_0x1bc8ae, _0x4b2e86, {
          kind: _0x20cc86,
          hasMedia: _0x26670a,
          dragTargets: _0x21cb56['dragTargets'],
          dragContext: _0x21cb56['dragContext'],
          fullEligibleVisible: _0x905c11,
        })
      )
        continue;
      const _0x58ae71 = _0x40bb90(_0x1bc8ae),
        _0x528ad4 = _0x505b56 || getPreviewGeometry(_0x4838b0);
      _0x2474c2['push']({
        node: _0x4838b0,
        nodeId: _0x1bc8ae,
        kind: _0x20cc86,
        sources: _0x40ee2a,
        hasMediaHint: _0x26670a,
        deferredDescriptorSources: _0x373887,
        text: _0x43a3dc['text'],
        geometry: _0x528ad4,
        selected: _0x4b2e86?.['has']?.(_0x1bc8ae) === !![],
        fullEligibleVisible: _0x905c11,
        fullEligiblePreview: _0x496bc3,
        retained: _0x134f77['has'](_0x1bc8ae),
        continuationPending: _0x1c0c8a['has'](_0x1bc8ae),
        mounted: _0x58ae71,
      });
    }
    const _0x55b970 = _0x3f5e03 ? nowPerf() : 0x0,
      _0x35836c = planRendererFastPreviewAdmission({
        candidateSeeds: _0x2474c2,
        existingPreviewNodeIds: _0x3f32d8,
        options: _0x21cb56,
      }),
      _0x1923b9 = _0x3f5e03 ? nowPerf() : 0x0,
      _0x5789d8 = _0x35836c['candidates'];
    if (_0x5789d8['length'] === 0x0) {
      let _0x4b8d34 = ![];
      for (const _0x5db1aa of Array['from'](_0x3f32d8['keys']())) {
        const _0x3be49c = _0x3dbbfa?.[_0x5db1aa];
        if (_0x214e32(_0x5db1aa, _0x3be49c, _0x21cb56)) {
          _0x3f9798(_0x5db1aa, { cache: ![], collect: ![] });
          continue;
        }
        const _0x5ec460 = _0x2e5e2d?.(_0x5db1aa),
          _0x3fa848 = _0x40bb90(_0x5db1aa, _0x5ec460);
        if (
          !_0x3fa848 &&
          _0x3be49c &&
          isRendererFastPreviewGeometryVisible(getPreviewGeometry(_0x3be49c), _0x21cb56)
        ) {
          _0x4b8d34 = !![];
          continue;
        }
        const _0x482330 = _0x3fa848 && _0x3d2f34(_0x5db1aa, { collect: ![] });
        if (!_0x482330) _0x3f9798(_0x5db1aa, { collect: ![] });
      }
      _0x314b1f();
      if (_0x4b8d34) return;
      if (_0xb96af9['size'] > 0x0) return;
      return _0x443b6b({ preserveStagedReleases: !![], preserveDragPreviewScene: !![] });
    }
    const _0x56d82b = _0x306693(_0xc1ef0c);
    if (!_0x56d82b) return;
    _0x215dae(_0x21cb56['viewport']);
    const _0x2e721d = syncLayerBounds(_0x56d82b, _0x5789d8, { preserveAnchor: _0x39e9b3 }) || {
      offsetX: 0x0,
      offsetY: 0x0,
    };
    (_0x341954(), (_0x186f0c += 0x1));
    const _0x40172d = _0x35836c['liveIds'],
      _0x24f28a = _0x35836c['candidates'],
      _0x3d3460 = _0x35836c['mediaPlan'];
    if (_0x3d3460['explicitMediaSourceOwnerIds'] !== null) {
      const _0x2c6e3a = new Set();
      for (const _0x5be8b6 of _0x3f32d8['keys']()) {
        if (_0x40172d['has'](_0x5be8b6)) continue;
        const _0x201529 = _0x3dbbfa?.[_0x5be8b6],
          _0x458449 = _0x2e5e2d?.(_0x5be8b6);
        _0x201529 &&
          !_0x40bb90(_0x5be8b6, _0x458449) &&
          isRendererFastPreviewGeometryVisible(getPreviewGeometry(_0x201529), _0x21cb56) &&
          _0x2c6e3a['add'](_0x5be8b6);
      }
      _0x16689d(
        new Set([
          ..._0x3d3460['explicitMediaSourceOwnerIds'],
          ..._0x3d3460['nodeIdsWithMedia'],
          ..._0x2c6e3a,
        ]),
        { preservePaintedMediaOwners: _0x4729ce },
      );
    }
    const _0x11987b = _0x3d3460['lowPriority'] ? 'lazy' : 'eager',
      _0x3bba35 = _0x3d3460['lowPriority'] ? 'auto' : 'high',
      _0x4cc65e = _0x35836c['immediateMediaSrcLimit'],
      _0x2d03e9 =
        _0x21cb56['requiredImmediateMediaSourceOwnerIds'] != null &&
        typeof _0x21cb56['requiredImmediateMediaSourceOwnerIds']?.[Symbol['iterator']] === 'function'
          ? new Set(
              Array['from'](_0x21cb56['requiredImmediateMediaSourceOwnerIds'], (_0x33cd84) =>
                String(_0x33cd84 || ''),
              )['filter'](Boolean),
            )
          : null;
    if (!_0x39e9b3) {
      ((_0x64e96d = Number['POSITIVE_INFINITY']), (_0x85d8d3 = Number['POSITIVE_INFINITY']));
      if (_0x46db57['length'] > 0x0) _0x4bb06c();
    }
    const _0x537d92 = {
        candidates: [],
        generation: _0x186f0c,
        immediateMediaSrcSlotsRef: { value: _0x39e9b3 ? Math['min'](_0x64e96d, _0x4cc65e) : _0x4cc65e },
        immediateMediaSrcLimit: _0x4cc65e,
        immediateVideoMediaSrcSlotsRef: {
          value: _0x39e9b3
            ? Math['min'](_0x85d8d3, _0x35836c['immediateVideoMediaSrcLimit'])
            : _0x35836c['immediateVideoMediaSrcLimit'],
        },
        mediaSrcBatchLimit: _0x35836c['mediaSrcBatchLimit'],
        videoMediaSrcBatchLimit: _0x35836c['videoMediaSrcBatchLimit'],
        createBatchSize: _0x35836c['createBatchSize'],
        layer: _0x56d82b,
        layerBounds: _0x2e721d,
        mediaFetchPriority: _0x3bba35,
        mediaLoading: _0x11987b,
        mediaPlan: _0x3d3460,
        options: _0x21cb56,
        pendingMediaPriorityChanged: ![],
        preservePaintedMediaOwners: _0x4729ce,
        requiredImmediateMediaSourceOwnerIds: _0x2d03e9,
        visibleMediaCandidateCount: _0x35836c['visibleMediaCandidateCount'],
        viewportBusy: _0x39e9b3,
        mountFragment: _0x207f94(),
      },
      _0x454206 = _0x35836c['deferredCandidates'],
      _0x10ed9b = _0x3f5e03 ? nowPerf() : 0x0;
    let _0x58f033 = 0x0,
      _0x225d96 = 0x0,
      _0x3bb132 = 0x0,
      _0x4a77aa = 0x0;
    for (const _0x4a1632 of _0x35836c['immediateCandidates']) {
      const _0x1ea899 = _0x5585bc(_0x4a1632, _0x537d92);
      ((_0x58f033 += Number(_0x1ea899?.['createdCount'] || 0x0)),
        (_0x225d96 += Number(_0x1ea899?.['imageCount'] || 0x0)),
        (_0x3bb132 += Number(_0x1ea899?.['reusedCount'] || 0x0)),
        (_0x4a77aa += Number(_0x1ea899?.['srcAssignedCount'] || 0x0)));
    }
    _0x98fc4d(_0x537d92);
    const _0x453af8 = _0x3f5e03 ? nowPerf() : 0x0;
    _0x537d92['pendingMediaPriorityChanged'] &&
      (_0x3ce58c(), (_0x537d92['pendingMediaPriorityChanged'] = ![]));
    _0x39e9b3 &&
      ((_0x64e96d = Math['min'](
        _0x64e96d,
        Math['max'](0x0, _0x537d92['immediateMediaSrcSlotsRef']['value']),
      )),
      (_0x85d8d3 = Math['min'](
        _0x85d8d3,
        Math['max'](0x0, _0x537d92['immediateVideoMediaSrcSlotsRef']['value']),
      )));
    let _0x20f4d6 = 0x0;
    for (const _0x5a005e of Array['from'](_0x3f32d8['keys']())) {
      if (!_0x40172d['has'](_0x5a005e)) {
        const _0x78208d = _0x3dbbfa?.[_0x5a005e];
        if (_0x214e32(_0x5a005e, _0x78208d, _0x21cb56)) {
          (_0x3f9798(_0x5a005e, { cache: ![], collect: ![] }), (_0x20f4d6 += 0x1));
          continue;
        }
        const _0x2cae00 = _0x2e5e2d?.(_0x5a005e),
          _0x1e226f = _0x40bb90(_0x5a005e, _0x2cae00);
        if (
          !_0x1e226f &&
          _0x78208d &&
          isRendererFastPreviewGeometryVisible(getPreviewGeometry(_0x78208d), _0x21cb56)
        ) {
          _0x40172d['add'](_0x5a005e);
          continue;
        }
        const _0x3d23d8 = _0x1e226f && _0x3d2f34(_0x5a005e, { collect: ![] });
        if (!_0x3d23d8) _0x3f9798(_0x5a005e, { collect: ![] });
        _0x20f4d6 += 0x1;
      }
    }
    _0x454206['length'] > 0x0 &&
      ((_0x9f22b8 = { ..._0x537d92, candidates: _0x454206 }), (_0x191dc8 = _0xdcb895(_0x27ef9c)));
    _0x314b1f();
    if (_0x3f5e03) {
      const _0x2ba0d5 = nowPerf();
      recordRendererRuntimeDiagnostic({
        kind: 'renderer-fast-preview-stages',
        mode: _0x5e16c6?.['mode'] || 'steady',
        candidateSeedCount: _0x2474c2['length'],
        candidateCount: _0x24f28a['length'],
        immediateCandidateCount: _0x35836c['immediateCandidates']['length'],
        deferredCandidateCount: _0x454206['length'],
        preambleMs: _0x2bdf6e - _0x23ec55,
        candidateSeedMs: _0x55b970 - _0x2bdf6e,
        admissionMs: _0x1923b9 - _0x55b970,
        commitSetupMs: _0x10ed9b - _0x1923b9,
        immediateSyncMs: _0x453af8 - _0x10ed9b,
        cleanupMs: _0x2ba0d5 - _0x453af8,
        durationMs: _0x2ba0d5 - _0x23ec55,
      });
    }
    if (_0x299cd6) {
      const _0x2e4954 = nowPerf();
      recordFastPreviewSample('sync-immediate', _0x2e4954 - _0x39cfdc, {
        candidateCount: _0x24f28a['length'],
        createdCount: _0x58f033,
        endPerf: _0x2e4954,
        imageCount: _0x225d96,
        pendingCreateCount: _0x454206['length'],
        pendingMediaSrcCount: _0x46db57['length'],
        poolSize: _0x636cda['length'],
        removedCount: _0x20f4d6,
        reusedCount: _0x3bb132,
        srcAssignedCount: _0x4a77aa,
        startPerf: _0x39cfdc,
        zoom: _0x5e16c6?.['viewport']?.['zoom'],
      });
    }
  }
  return {
    clear: _0x443b6b,
    discardNode: _0x2ca9d1,
    getStats: () => ({ ..._0x48ea8b }),
    hasNodePreview: _0x2e30b3,
    isNodePresentationReady: _0x3752f8,
    isNodePreviewReady: _0x2b4893,
    releaseNode: _0x135d2d,
    removeNode: _0x3f9798,
    prune: _0x5cfc11,
    reconcileMediaSourceOwners: _0x16689d,
    retainNode: _0x22fbca,
    stageRasterHandoffFrame: _0x4cb423,
    sync: _0x10fa27,
    syncNodeDragPreview: _0xd02e44,
  };
}
