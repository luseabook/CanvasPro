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
function toNumber(value, item = 0x0) {
  const key = Number(value);
  return Number['isFinite'](key) ? key : item;
}
function nowPerf() {
  return typeof performance !== 'undefined' && performance && typeof performance['now'] === 'function'
    ? performance['now']()
    : Date['now']();
}
function isViewportInteractionBusyForPreview() {
  const index = typeof document !== 'undefined' ? document?.['body']?.['classList'] : null;
  return Boolean(
    index?.['contains']?.('is-panning') ||
    index?.['contains']?.('is-zooming') ||
    index?.['contains']?.('is-viewport-animating'),
  );
}
function isDirectViewportGestureBusyForPreview() {
  const result = typeof document !== 'undefined' ? document?.['body']?.['classList'] : null;
  return Boolean(result?.['contains']?.('is-panning') || result?.['contains']?.('is-zooming'));
}
function isElementVisible(el) {
  if (!el || el['isConnected'] === ![]) return ![];
  if (el['hidden'] === !![] || el['classList']?.['contains']?.('is-hidden')) return ![];
  const data = el['style'] || {};
  return data['display'] !== 'none' && data['visibility'] !== 'hidden' && data['opacity'] !== '0';
}
function isMountedImageReady(options) {
  const enabled = String(
    options?.['currentSrc'] || options?.['src'] || options?.['getAttribute']?.('src') || '',
  )['trim']();
  if (!enabled || !isElementVisible(options)) return ![];
  if (options['complete'] === ![]) return ![];
  return Number(options['naturalWidth'] || 0x0) > 0x0 || options['complete'] === undefined;
}
function isMountedVideoReady(target) {
  const enabled2 = String(
    target?.['currentSrc'] || target?.['src'] || target?.['getAttribute']?.('src') || '',
  )['trim']();
  return (
    !!enabled2 &&
    isElementVisible(target) &&
    (Number(target['readyState'] || 0x0) >= 0x2 || hasPresentedVideoFrame(target))
  );
}
function hasActiveMountedVideoPlayback(el2) {
  return Array['from'](el2?.['querySelectorAll']?.('video') || [])['some'](
    (source) =>
      isMountedPresentationMediaElement(source) &&
      isMountedVideoReady(source) &&
      source['paused'] === ![] &&
      source['ended'] !== !![],
  );
}
function hasMountedMediaElement(el3) {
  return !!(el3?.['querySelector']?.('img') || el3?.['querySelector']?.('video'));
}
function isMountedPresentationMediaElement(el4) {
  const next = String(el4?.['tagName'] || '')['toLowerCase'](),
    current = el4?.['classList'];
  if (next === 'img')
    return !!(
      current?.['contains']?.('node-img') ||
      current?.['contains']?.('v2-media-preview') ||
      current?.['contains']?.('aigen-image-media') ||
      current?.['contains']?.('source-video-poster-frame') ||
      current?.['contains']?.('source-video-capture-preview') ||
      current?.['contains']?.('ai-video-deferred-poster')
    );
  if (next === 'video') return !![];
  return ![];
}
function isMountedMediaReady(el5) {
  if (!hasMountedMediaElement(el5)) return ![];
  const list = Array['from'](el5?.['querySelectorAll']?.('img') || [])['filter'](
      isMountedPresentationMediaElement,
    ),
    list2 = Array['from'](el5?.['querySelectorAll']?.('video') || [])['filter'](
      isMountedPresentationMediaElement,
    );
  if (list['length'] === 0x0 && list2['length'] === 0x0) return ![];
  for (const entry of list) {
    if (isMountedImageReady(entry)) return !![];
  }
  for (const record of list2) {
    if (isMountedVideoReady(record)) return !![];
  }
  return ![];
}
function isFastPreviewReleasedForPlayback(el6) {
  return el6?.['dataset']?.['fastPreviewReleasedForPlayback'] === '1';
}
function getPreviewKind(options2 = {}) {
  const list3 = String(options2['type'] || '')['toLowerCase']();
  if (list3['includes']('group')) return 'group';
  if (list3['includes']('video') || list3['includes']('media-clip')) return 'video';
  if (list3['includes']('image')) return 'image';
  if (list3['includes']('audio')) return 'audio';
  if (list3['includes']('text') || list3['includes']('comment')) return 'text';
  return 'node';
}
function isWebPreviewNode(options3 = {}) {
  return (
    String(options3?.['type'] || '')
      ['trim']()
      ['toLowerCase']() === 'web-preview'
  );
}
function getPreviewText(error = {}, payload = 'node') {
  const handle =
    payload === 'image'
      ? 'Image'
      : payload === 'video'
        ? 'Video'
        : payload === 'audio'
          ? 'Audio'
          : payload === 'text'
            ? 'Text'
            : 'Node';
  return String(error['name'] || error['title'] || error['prompt'] || error['text'] || handle)
    ['replace'](/\s+/g, '\x20')
    ['trim']()
    ['slice'](0x0, payload === 'text' ? 0xa0 : 0x30);
}
function getPrimaryListItem(list4, state = 0x0) {
  if (!Array['isArray'](list4) || list4['length'] === 0x0) return null;
  const config = Math['max'](0x0, Math['trunc'](Number(state) || 0x0));
  return list4[config] || list4[0x0] || null;
}
function getPrimaryListItemIndex(list5, scope = 0x0) {
  if (!Array['isArray'](list5) || list5['length'] === 0x0) return 0x0;
  return Math['max'](0x0, Math['min'](list5['length'] - 0x1, Math['trunc'](Number(scope) || 0x0)));
}
function firstLocalPreviewUrl(list6 = []) {
  for (const input of list6) {
    const toCanvasLocalUrl2 = toCanvasLocalUrl(input);
    if (toCanvasLocalUrl2) return toCanvasLocalUrl2;
  }
  return '';
}
function uniquePreviewUrls(list7 = []) {
  const list8 = [],
    map = new Set();
  for (const output of list7) {
    const enabled3 = String(output || '')['trim']();
    if (!enabled3 || map['has'](enabled3)) continue;
    (map['add'](enabled3), list8['push'](enabled3));
  }
  return list8;
}
function isLikelyImagePreviewUrl(value2) {
  const enabled4 = String(value2 || '')['trim']();
  if (!enabled4) return ![];
  if (/^(data:image\/|blob:)/i['test'](enabled4)) return !![];
  return /\.(?:png|jpe?g|webp|gif|avif|bmp)(?:[?#].*)?$/i['test'](enabled4);
}
function normalizeViewport(box = {}) {
  const count = Number(box?.['zoom']);
  return {
    x: Number['isFinite'](Number(box?.['x'])) ? Number(box['x']) : 0x0,
    y: Number['isFinite'](Number(box?.['y'])) ? Number(box['y']) : 0x0,
    zoom: Number['isFinite'](count) && count > 0x0 ? count : 0x1,
  };
}
function getViewportContainerSize(options4 = {}) {
  return {
    width: Math['max'](
      0x1,
      Number(options4['containerWidth'] ?? options4['containerW']) ||
        (typeof window !== 'undefined' ? Number(window['innerWidth']) : 0x0) ||
        0x640,
    ),
    height: Math['max'](
      0x1,
      Number(options4['containerHeight'] ?? options4['containerH']) ||
        (typeof window !== 'undefined' ? Number(window['innerHeight']) : 0x0) ||
        0x384,
    ),
  };
}
function getViewportWorldCenter(options5 = {}) {
  const box2 = normalizeViewport(options5['viewport']),
    { width: width, height: height } = getViewportContainerSize(options5);
  return {
    x: ((0x0 - box2['x']) / box2['zoom'] + (width - box2['x']) / box2['zoom']) / 0x2,
    y: ((0x0 - box2['y']) / box2['zoom'] + (height - box2['y']) / box2['zoom']) / 0x2,
  };
}
function resolveMediaSrcBatchSize(value3, value4 = {}) {
  const count2 = Number(value4['batchLimit']);
  if (Number['isFinite'](count2) && count2 >= 0x0) return Math['max'](0x0, Math['trunc'](count2));
  if (value4['viewportBusy'] === !![]) return FAST_PREVIEW_BUSY_MEDIA_SRC_BATCH_SIZE;
  if (value3 >= FAST_PREVIEW_HUGE_CANDIDATE_COUNT) return FAST_PREVIEW_HUGE_MEDIA_SRC_BATCH_SIZE;
  if (value3 >= FAST_PREVIEW_LARGE_CANDIDATE_COUNT) return FAST_PREVIEW_LARGE_MEDIA_SRC_BATCH_SIZE;
  return FAST_PREVIEW_MEDIA_SRC_BATCH_SIZE;
}
function resolveVideoMediaSrcBatchSize(value5, value6 = {}) {
  const count3 = Number(value6['batchLimit']);
  if (Number['isFinite'](count3) && count3 >= 0x0) return Math['max'](0x0, Math['trunc'](count3));
  if (value6['viewportBusy'] === !![]) return FAST_PREVIEW_BUSY_VIDEO_MEDIA_SRC_BATCH_SIZE;
  if (value5 >= FAST_PREVIEW_HUGE_CANDIDATE_COUNT) return FAST_PREVIEW_HUGE_VIDEO_MEDIA_SRC_BATCH_SIZE;
  if (value5 >= FAST_PREVIEW_LARGE_CANDIDATE_COUNT) return FAST_PREVIEW_LARGE_VIDEO_MEDIA_SRC_BATCH_SIZE;
  return FAST_PREVIEW_VIDEO_MEDIA_SRC_BATCH_SIZE;
}
function getExplicitImagePreviewUrls(
  options6 = {},
  { displayFirst: displayFirst = ![], displayVersionKey: displayVersionKey = '' } = {},
) {
  options6 = options6 && typeof options6 === 'object' ? options6 : {};
  const localPreviewUrl = firstLocalPreviewUrl([
      options6['thumbLocalPath'],
      options6['previewLocalPath'],
      options6['thumbnailLocalPath'],
      options6['thumbUrl'],
      options6['previewUrl'],
      options6['thumbnailUrl'],
    ]),
    versionCanvasImageDisplayUrl2 = versionCanvasImageDisplayUrl(
      firstLocalPreviewUrl([options6['displayLocalPath'], options6['displayUrl'], options6['imageUrl']]),
      displayVersionKey,
    );
  return displayFirst
    ? [versionCanvasImageDisplayUrl2, localPreviewUrl]
    : [localPreviewUrl, versionCanvasImageDisplayUrl2];
}
function getExplicitVideoPreviewUrls(options7 = {}) {
  return (
    (options7 = options7 && typeof options7 === 'object' ? options7 : {}),
    [
      options7['posterLocalPath'],
      options7['thumbLocalPath'],
      options7['previewLocalPath'],
      options7['thumbnailLocalPath'],
      options7['videoThumbSrc'],
      options7['posterUrl'],
      options7['thumbUrl'],
      options7['previewUrl'],
      options7['thumbnailUrl'],
    ]
      ['map']((value7) => toCanvasLocalUrl(value7))
      ['filter'](isLikelyImagePreviewUrl)
  );
}
function hasExplicitPreviewValue(enabled5 = {}, list9 = []) {
  if (!enabled5 || typeof enabled5 !== 'object') return ![];
  return list9['some']((value8) => !!String(enabled5[value8] || '')['trim']());
}
function hasPreviewMediaHint(options8 = {}, value9 = 'node') {
  if (value9 === 'image') {
    const primaryListItem = getPrimaryListItem(options8['images'], options8['mainImageIndex']);
    return [options8, primaryListItem]['some']((value10) =>
      hasExplicitPreviewValue(value10, [
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
  if (value9 === 'video') {
    const primaryListItem2 = getPrimaryListItem(options8['videos'], options8['mainVideoIndex']);
    if (
      String(options8['type'] || '')
        ['trim']()
        ['toLowerCase']() === 'ai-video' &&
      (isTaskFailed(options8) ||
        isTaskCancelled(options8) ||
        !!String(primaryListItem2?.['error'] || '')['trim']())
    )
      return ![];
    const list10 = [primaryListItem2];
    return (
      (!primaryListItem2 || !Array['isArray'](options8['videos']) || options8['videos']['length'] <= 0x1) &&
        list10['push'](options8),
      list10['some']((value11) =>
        hasExplicitPreviewValue(value11, [
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
function getPreviewMediaUrls(options9 = {}, value12 = 'node', { displayFirst: displayFirst = ![] } = {}) {
  if (value12 === 'image') {
    const primaryListItemIndex = getPrimaryListItemIndex(options9['images'], options9['mainImageIndex']),
      primaryListItem3 = getPrimaryListItem(options9['images'], options9['mainImageIndex']),
      displayVersionKey2 =
        displayFirst &&
        String(options9['type'] || '')
          ['toLowerCase']()
          ['includes']('ai-image')
          ? buildCanvasImageResultIdentityKey(primaryListItem3 || {}, options9, primaryListItemIndex)
          : '';
    return uniquePreviewUrls([
      ...getExplicitImagePreviewUrls(options9, {
        displayFirst: displayFirst,
        displayVersionKey: displayVersionKey2,
      }),
      ...getExplicitImagePreviewUrls(primaryListItem3, {
        displayFirst: displayFirst,
        displayVersionKey: displayVersionKey2,
      }),
    ]);
  }
  if (value12 === 'video') {
    const primaryListItem4 = getPrimaryListItem(options9['videos'], options9['mainVideoIndex']),
      count4 = Array['isArray'](options9['videos']) ? options9['videos']['length'] : 0x0,
      value13 =
        String(options9['type'] || '')
          ['trim']()
          ['toLowerCase']() === 'ai-video';
    if (
      value13 &&
      (isTaskFailed(options9) ||
        isTaskCancelled(options9) ||
        !!String(primaryListItem4?.['error'] || '')['trim']())
    )
      return [];
    return uniquePreviewUrls([
      ...getExplicitVideoPreviewUrls(primaryListItem4),
      ...(count4 <= 0x1 ? getExplicitVideoPreviewUrls(options9) : []),
    ]);
  }
  return [];
}
function getNodePresentationMediaUrls(options10 = {}) {
  const previewKind = getPreviewKind(options10),
    list11 = [
      ...getPreviewMediaUrls(options10, previewKind, { displayFirst: ![] }),
      ...getPreviewMediaUrls(options10, previewKind, { displayFirst: !![] }),
    ];
  if (previewKind === 'image') {
    const primaryListItem5 = getPrimaryListItem(options10['images'], options10['mainImageIndex']);
    for (const value14 of [primaryListItem5, options10]) {
      const canvasImageSourceUrl = resolveCanvasImageSourceUrl(value14 || {});
      if (canvasImageSourceUrl) list11['push'](canvasImageSourceUrl);
    }
  }
  if (previewKind === 'video') {
    const primaryListItem6 = getPrimaryListItem(options10['videos'], options10['mainVideoIndex']),
      canvasVideoDisplayUrl = resolveCanvasVideoDisplayUrl(primaryListItem6 || {});
    if (canvasVideoDisplayUrl) list11['push'](canvasVideoDisplayUrl);
    if (
      !primaryListItem6 ||
      (Array['isArray'](options10['videos']) && options10['videos']['length'] <= 0x1)
    ) {
      const canvasVideoDisplayUrl2 = resolveCanvasVideoDisplayUrl(options10);
      if (canvasVideoDisplayUrl2) list11['push'](canvasVideoDisplayUrl2);
    }
  }
  return uniquePreviewUrls(list11);
}
function readPresentationMediaSource(el7) {
  return String(
    el7?.['dataset']?.['desktopMediaSourceUrl'] ||
      el7?.['getAttribute']?.('src') ||
      el7?.['currentSrc'] ||
      el7?.['src'] ||
      '',
  )['trim']();
}
function canonicalizePresentationMediaSource(value15) {
  const enabled6 = String(value15 || '')['trim']();
  if (!enabled6) return '';
  if (/^(?:blob:|data:|aic-local-preview:)/i['test'](enabled6)) return enabled6;
  if (typeof URL !== 'function') return enabled6;
  const value16 = String(
    globalThis['document']?.['baseURI'] ||
      globalThis['location']?.['href'] ||
      globalThis['location']?.['origin'] ||
      'http://localhost/',
  );
  try {
    return new URL(enabled6, value16)['href'];
  } catch {
    return enabled6;
  }
}
function isPresentationMediaSourceForNode(value17, enabled7) {
  if (!enabled7) return !![];
  const presentationMediaSource = readPresentationMediaSource(value17);
  if (!presentationMediaSource) return ![];
  const list12 = getNodePresentationMediaUrls(enabled7);
  if (list12['includes'](presentationMediaSource)) return !![];
  const canonicalizePresentationMediaSource2 = canonicalizePresentationMediaSource(presentationMediaSource);
  return list12['some'](
    (value18) => canonicalizePresentationMediaSource(value18) === canonicalizePresentationMediaSource2,
  );
}
export function resolveRendererPreviewNodePresentation(
  options11 = {},
  { displayFirst: displayFirst = ![] } = {},
) {
  const kind2 = getPreviewKind(options11);
  return {
    kind: kind2,
    text: getPreviewText(options11, kind2),
    geometry: getPreviewGeometry(options11),
    sources: getPreviewMediaUrls(options11, kind2, { displayFirst: displayFirst }),
  };
}
function shouldUseFastPreviewLayer(value19, value20, value21 = {}) {
  const value22 = Number['isFinite'](value21['nodeCount'])
      ? value21['nodeCount']
      : Object['keys'](value19 || {})['length'],
    count5 = value20 instanceof Set ? value20['size'] : 0x0;
  if (value21['previewOnly'] === !![]) return count5 > 0x0;
  return value22 >= FAST_PREVIEW_NODE_COUNT_THRESHOLD || count5 >= FAST_PREVIEW_CANDIDATE_THRESHOLD;
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
function createPreviewEl(value23) {
  const el8 = document['createElement']('div');
  ((el8['className'] = 'v2-fast-preview-node'), (el8['dataset']['nodeId'] = value23));
  const value24 = document['createElement']('div');
  return ((value24['className'] = 'v2-fast-preview-label'), el8['appendChild'](value24), el8);
}
function createPreviewSvgElement(value25) {
  return typeof document['createElementNS'] === 'function'
    ? document['createElementNS']('http://www.w3.org/2000/svg', value25)
    : document['createElement'](value25);
}
function setPreviewSvgAttributes(el9, value26) {
  for (const [value27, value28] of Object['entries'](value26)) {
    el9['setAttribute'](value27, value28);
  }
  return el9;
}
function createAudioPreviewWaveform(value29) {
  const el10 = document['createElement']('div');
  el10['className'] = 'waveform\x20' + value29;
  const el11 = setPreviewSvgAttributes(createPreviewSvgElement('svg'), {
    width: '100%',
    height: '80',
    viewBox: '0 0 200 80',
    preserveAspectRatio: 'none',
  });
  return (
    el11['appendChild'](
      setPreviewSvgAttributes(createPreviewSvgElement('path'), {
        d: FAST_PREVIEW_AUDIO_WAVE_PATH,
        stroke: 'var(--blue)',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        fill: 'none',
      }),
    ),
    el11['appendChild'](
      setPreviewSvgAttributes(createPreviewSvgElement('path'), {
        d: 'M0,40 L200,40',
        stroke: 'var(--blue)',
        'stroke-width': '1',
        'stroke-dasharray': '2 4',
        opacity: '0.4',
        fill: 'none',
      }),
    ),
    el10['appendChild'](el11),
    el10
  );
}
function getAudioPreviewDuration(options12 = {}) {
  const primaryListItem7 = getPrimaryListItem(options12['audios'], options12['mainAudioIndex']);
  for (const value30 of [
    primaryListItem7?.['audioDuration'],
    primaryListItem7?.['duration'],
    options12['audioDuration'],
    options12['duration'],
  ]) {
    const count6 = Number(value30);
    if (Number['isFinite'](count6) && count6 > 0x0) return count6;
  }
  return 0x0;
}
function formatAudioPreviewTime(value31) {
  const value32 = Math['max'](0x0, Math['floor'](Number(value31) || 0x0)),
    count7 = Math['floor'](value32 / 0xe10),
    value33 = Math['floor']((value32 % 0xe10) / 0x3c),
    value34 = String(value32 % 0x3c)['padStart'](0x2, '0');
  return count7 > 0x0
    ? count7 + ':' + String(value33)['padStart'](0x2, '0') + ':' + value34
    : value33 + ':' + value34;
}
function getAudioPreviewTimeText(options13 = {}) {
  return '0:00 / ' + formatAudioPreviewTime(getAudioPreviewDuration(options13));
}
function ensureAudioPreviewContent(el12, value35, value36) {
  let el13 = el12['querySelector']('.v2-fast-preview-audio-card');
  if (!el13) {
    ((el13 = document['createElement']('div')),
      (el13['className'] = 'v2-fast-preview-audio-card audio-card'),
      el13['appendChild'](createAudioPreviewWaveform('waveform-bg')),
      el13['appendChild'](createAudioPreviewWaveform('waveform-unplayed')));
    const el14 = document['createElement']('div');
    el14['className'] = 'audio-controls';
    const el15 = document['createElement']('button');
    ((el15['className'] = 'audio-play-btn'),
      el15['setAttribute']('type', 'button'),
      el15['setAttribute']('tabindex', '-1'),
      el15['setAttribute']('aria-hidden', 'true'));
    const el16 = setPreviewSvgAttributes(createPreviewSvgElement('svg'), {
      width: '12',
      height: '12',
      viewBox: '0 0 24 24',
      fill: 'currentColor',
    });
    (el16['appendChild'](
      setPreviewSvgAttributes(createPreviewSvgElement('polygon'), {
        points: '5\x203\x2019\x2012\x205\x2021\x205\x203',
      }),
    ),
      el15['appendChild'](el16),
      el14['appendChild'](el15));
    const el17 = document['createElement']('div');
    el17['className'] = 'audio-time-wrap';
    const value37 = document['createElement']('span');
    ((value37['className'] = 'audio-time-display'),
      el17['appendChild'](value37),
      el14['appendChild'](el17),
      el13['appendChild'](el14),
      el12['prepend'](el13));
  }
  const el18 = el13['querySelector']('.audio-time-display'),
    audioPreviewTimeText = getAudioPreviewTimeText(value35);
  if (el18 && el18['textContent'] !== audioPreviewTimeText) el18['textContent'] = audioPreviewTimeText;
  const el19 = el12['querySelector']('.v2-fast-preview-label');
  if (!el19) return;
  el19['className'] = 'v2-fast-preview-label v2-fast-preview-audio-label node-label';
  if (el19['dataset']['audioPreviewLabel'] !== '1') {
    for (const el20 of Array['from'](el19['children'] || [])) el20['remove']?.();
    el19['textContent'] = '';
    const el21 = document['createElement']('span');
    ((el21['className'] = 'node-label-icon'), (el21['dataset']['labelKind'] = 'audio'));
    const value38 = document['createElement']('span');
    ((value38['className'] = 'node-label-text'),
      el19['appendChild'](el21),
      el19['appendChild'](value38),
      (el19['dataset']['audioPreviewLabel'] = '1'));
  }
  const el22 = el19['querySelector']('.node-label-text');
  if (el22 && el22['textContent'] !== value36) el22['textContent'] = value36;
}
function resetAudioPreviewContent(el23, value39) {
  el23['querySelector']('.v2-fast-preview-audio-card')?.['remove']?.();
  const el24 = el23['querySelector']('.v2-fast-preview-label');
  if (!el24) return;
  if (el24['dataset']['audioPreviewLabel'] === '1') {
    for (const el25 of Array['from'](el24['children'] || [])) el25['remove']?.();
    delete el24['dataset']['audioPreviewLabel'];
  }
  el24['className'] = 'v2-fast-preview-label';
  if (el24['textContent'] !== value39) el24['textContent'] = value39;
}
function syncPreviewStaticContent(value40, value41, value42, value43) {
  if (value42 === 'audio') ensureAudioPreviewContent(value40, value41, value43);
  else resetAudioPreviewContent(value40, value43);
}
function getPreviewGeometry(box3 = {}) {
  const x = toNumber(box3['x'], 0x0),
    y = toNumber(box3['y'], 0x0),
    width2 = Math['max'](0x1, toNumber(box3['width'], 0xa0)),
    height2 = Math['max'](0x1, toNumber(box3['height'], 0x78));
  return { x: x, y: y, width: width2, height: height2 };
}
function setPreviewMediaSrc(el26, value44, value45) {
  const enabled8 = value44[value45] || '';
  if (!enabled8) return ![];
  return (
    (el26['dataset']['srcIndex'] = String(value45)),
    el26['getAttribute']?.('src') !== enabled8 &&
      el26['src'] !== enabled8 &&
      (delete el26['dataset']['previewLoaded'],
      trackCanvasImageDisplayLoad(enabled8, el26),
      (el26['src'] = enabled8)),
    !![]
  );
}
function getPreviewMediaCurrentSrc(value46) {
  return String(value46?.['getAttribute']?.('src') || value46?.['src'] || '')['trim']();
}
function clearPreviewMediaSrc(el27) {
  if (!el27) return;
  (forgetCanvasImageDisplayLoad(el27), (el27['onload'] = null), (el27['onerror'] = null));
  if (isCanvasImagePreloadSharedImage(el27)) {
    el27['remove']?.();
    return;
  }
  (el27['removeAttribute']?.('src'),
    (el27['src'] = ''),
    (el27['_previewSources'] = []),
    (el27['_previewSrcPreloadUrl'] = ''),
    (el27['_previewMediaQueuePriority'] = null),
    (el27['_previewMediaSrcBatchLimit'] = null),
    (el27['_previewVideoMediaSrcBatchLimit'] = null),
    (el27['_previewDirectWhenBlank'] = ![]),
    (el27['_previewPresentedNotificationKey'] = ''));
  if (el27['style']) el27['style']['visibility'] = '';
  (delete el27['dataset']['srcIndex'],
    delete el27['dataset']['previewLoaded'],
    delete el27['dataset']['previewKind'],
    delete el27['dataset']['previewCritical']);
}
function isPreviewMediaLoaded(el28) {
  if (!getPreviewMediaCurrentSrc(el28)) return ![];
  return (
    el28?.['dataset']?.['previewLoaded'] === '1' ||
    el28?.['complete'] === !![] ||
    Number(el28?.['naturalWidth'] || 0x0) > 0x0 ||
    Number(el28?.['naturalHeight'] || 0x0) > 0x0
  );
}
function getPreviewRasterFrameEl(el29) {
  return el29?.['querySelector']?.('.v2-fast-preview-raster-frame') || null;
}
function isPreviewRasterFrameReady(value47) {
  const el30 = getPreviewRasterFrameEl(value47);
  return !!el30 && el30['isConnected'] !== ![];
}
function restorePreviewRasterFrameState(el31) {
  if (!getPreviewRasterFrameEl(el31)) return ![];
  return (
    (el31['dataset']['hasMedia'] = '1'),
    (el31['dataset']['rasterFrame'] = '1'),
    delete el31['dataset']['placeholderReady'],
    !![]
  );
}
function removePreviewRasterFrame(el32) {
  const el33 = getPreviewRasterFrameEl(el32);
  (el33?.['remove']?.(), delete el32?.['_previewRasterFrame']);
  if (!el32?.['dataset']) return !!el33;
  delete el32['dataset']['rasterFrame'];
  const value48 = el32['querySelector']?.('.v2-fast-preview-media');
  if (!isPreviewMediaLoaded(value48)) delete el32['dataset']['hasMedia'];
  return !!el33;
}
function attachPreviewRasterFrame(el34, canvas) {
  const el35 = canvas?.['canvas'];
  if (!el34 || !el35) return ![];
  const el36 = getPreviewRasterFrameEl(el34);
  if (el36 && el36 !== el35) el36['remove']?.();
  ((el35['className'] = 'v2-fast-preview-raster-frame'),
    el35['classList']?.['add']?.('v2-fast-preview-raster-frame'));
  el35['dataset'] &&
    (el35['dataset']['nodeId'] = String(canvas['nodeId'] || el34['dataset']?.['nodeId'] || ''));
  el35['setAttribute']?.('aria-hidden', 'true');
  if (el35['parentNode'] !== el34) el34['appendChild']?.(el35);
  return ((el34['_previewRasterFrame'] = canvas), restorePreviewRasterFrameState(el34));
}
function isPreviewRasterFrameCompatible(value49, value50) {
  const box4 = value49?.['_previewRasterFrame'];
  if (!box4 || value49?.['_previewDragActive'] === !![]) return !![];
  if (box4['kind'] && value50?.['kind'] && box4['kind'] !== value50['kind']) return ![];
  if (
    Number['isFinite'](Number(box4['width'])) &&
    Number['isFinite'](Number(value50?.['geometry']?.['width'])) &&
    Number(box4['width']) !== Number(value50['geometry']['width'])
  )
    return ![];
  if (
    Number['isFinite'](Number(box4['height'])) &&
    Number['isFinite'](Number(value50?.['geometry']?.['height'])) &&
    Number(box4['height']) !== Number(value50['geometry']['height'])
  )
    return ![];
  const list13 = uniquePreviewUrls(box4['sources'] || []),
    list14 = uniquePreviewUrls(value50?.['sources'] || []);
  if (list13['length'] === 0x0 || list14['length'] === 0x0) return !![];
  const map2 = new Set(list14);
  return list13['some']((value51) => map2['has'](value51));
}
function isPreviewMediaRequestInFlight(el37) {
  return (
    !!getPreviewMediaCurrentSrc(el37) &&
    el37?.['dataset']?.['previewLoaded'] !== '1' &&
    el37?.['complete'] !== !![] &&
    Number(el37?.['naturalWidth'] || 0x0) <= 0x0 &&
    Number(el37?.['naturalHeight'] || 0x0) <= 0x0
  );
}
function isPreviewMediaResourceProtected(value52) {
  return (
    isCanvasImageDisplayLoadTracked(value52) ||
    isPreviewMediaRequestInFlight(value52) ||
    isCanvasImagePreloadSharedImage(value52)
  );
}
function isPreviewVideoMedia(el38) {
  return String(el38?.['dataset']?.['previewKind'] || '')['trim']() === 'video';
}
function isPreviewCriticalMedia(el39) {
  return el39?.['dataset']?.['previewCritical'] === '1';
}
function getReusableLoadedPreviewMediaSource(el40, value53) {
  const value54 = el40?.['querySelector']?.('.v2-fast-preview-media');
  if (!isPreviewMediaLoaded(value54)) return '';
  const previewMediaCurrentSrc = getPreviewMediaCurrentSrc(value54);
  if (!previewMediaCurrentSrc) return '';
  const list15 = uniquePreviewUrls(Array['isArray'](value53) ? value53 : [value53]);
  return list15['includes'](previewMediaCurrentSrc) ? previewMediaCurrentSrc : '';
}
function hasRetainablePaintedPreviewMedia(el41, { includeImages: includeImages = ![] } = {}) {
  const value55 = el41?.['querySelector']?.('.v2-fast-preview-media');
  return isPreviewMediaLoaded(value55) && (includeImages || isPreviewVideoMedia(value55));
}
function getRetainablePaintedPreviewMediaSource(value56, value57) {
  if (!hasRetainablePaintedPreviewMedia(value56, { includeImages: !![] })) return '';
  return getReusableLoadedPreviewMediaSource(value56, value57);
}
function restorePaintedPreviewMedia(el42) {
  const el43 = el42?.['querySelector']?.('.v2-fast-preview-media');
  if (!isPreviewMediaLoaded(el43)) return ![];
  delete el43['dataset']['previewResourceOnly'];
  if (el43['style']) el43['style']['visibility'] = '';
  el42['dataset']['hasMedia'] = '1';
  const count8 = Array['isArray'](el43['_previewSources']) ? el43['_previewSources']['length'] : 0x0;
  if (count8 > 0x0) el42['dataset']['previewSrcCount'] = String(count8);
  return !![];
}
function getReusableCurrentPreviewMediaSource(el44, value58) {
  const value59 = el44?.['querySelector']?.('.v2-fast-preview-media'),
    previewMediaCurrentSrc2 =
      getPreviewMediaCurrentSrc(value59) || String(value59?.['_previewSrcPreloadUrl'] || '')['trim']();
  if (!previewMediaCurrentSrc2) return '';
  const list16 = uniquePreviewUrls(Array['isArray'](value58) ? value58 : [value58]);
  return list16['includes'](previewMediaCurrentSrc2) ? previewMediaCurrentSrc2 : '';
}
function nextPreviewMediaPreloadToken(enabled9) {
  if (!enabled9) return 0x0;
  const value60 = (Number(enabled9['_previewSrcPreloadToken']) || 0x0) + 0x1;
  return ((enabled9['_previewSrcPreloadToken'] = value60), value60);
}
function isPreviewMediaPreloadCurrent(el45, value61, value62, value63 = 0x0) {
  if (!el45 || el45['isConnected'] === ![]) return ![];
  if (el45['_previewSrcPreloadToken'] !== value62) return ![];
  const value64 = el45['_previewSources'] || [];
  return String(value64[value63] || '')['trim']() === String(value61 || '')['trim']();
}
function resolvePreviewMediaPreloadPriority(value65, { viewportBusy: viewportBusy = ![] } = {}) {
  if (viewportBusy) return FAST_PREVIEW_BUSY_MEDIA_PRELOAD_PRIORITY;
  if (value65?.['loading'] === 'lazy') return FAST_PREVIEW_LOW_PRIORITY_MEDIA_PRELOAD_PRIORITY;
  return FAST_PREVIEW_MEDIA_PRELOAD_PRIORITY;
}
function applyPreviewMediaSrcAfterPreload(fetchPriority, value66, value67 = 0x0, decode = {}) {
  const enabled10 = value66[value67] || '';
  if (!enabled10) return ![];
  const enabled11 = fetchPriority['getAttribute']?.('src') || fetchPriority['src'] || '';
  if (enabled11 === enabled10) return !![];
  if (String(fetchPriority['_previewSrcPreloadUrl'] || '')['trim']() === enabled10) return !![];
  const value68 = !isPreviewVideoMedia(fetchPriority) && isCanvasImagePreloadCoolingDown(enabled10);
  if (value68) return !![];
  if (
    decode['directWhenBlank'] === !![] &&
    !enabled11 &&
    (isPreviewVideoMedia(fetchPriority) || !isCanvasImagePreloadPending(enabled10))
  )
    return setPreviewMediaSrc(fetchPriority, value66, value67);
  if (/^(data:image\/|blob:)/i['test'](enabled10) || typeof Image !== 'function')
    return setPreviewMediaSrc(fetchPriority, value66, value67);
  const nextPreviewMediaPreloadToken2 = nextPreviewMediaPreloadToken(fetchPriority);
  return (
    (fetchPriority['_previewSrcPreloadUrl'] = enabled10),
    preloadCanvasImage(enabled10, {
      decode: decode['decode'] === !![],
      requireImage: !![],
      priority: resolvePreviewMediaPreloadPriority(fetchPriority, decode),
      fetchPriority: fetchPriority?.['fetchPriority'] === 'high' ? 'high' : 'auto',
      scope: FAST_PREVIEW_MEDIA_PRELOAD_SCOPE,
      deferWhenPaused: decode['viewportBusy'] === !![] || fetchPriority?.['loading'] === 'lazy',
    })['then'](
      () => {
        if (!isPreviewMediaPreloadCurrent(fetchPriority, enabled10, nextPreviewMediaPreloadToken2, value67))
          return;
        (setPreviewMediaSrc(fetchPriority, value66, value67), (fetchPriority['_previewSrcPreloadUrl'] = ''));
      },
      () => {
        if (!isPreviewMediaPreloadCurrent(fetchPriority, enabled10, nextPreviewMediaPreloadToken2, value67))
          return;
        fetchPriority['_previewSrcPreloadUrl'] = '';
      },
    ),
    !![]
  );
}
function setPreviewMediaSrcJoiningSharedAcquisition(value69, value70, value71 = 0x0, args = {}) {
  const enabled12 = value70[value71] || '';
  if (!enabled12) return ![];
  if (
    !isPreviewVideoMedia(value69) &&
    !/^(data:image\/|blob:)/i['test'](enabled12) &&
    args['directWhenBlank'] !== !![] &&
    (isCanvasImagePreloadPending(enabled12) || isCanvasImagePreloadCoolingDown(enabled12))
  )
    return applyPreviewMediaSrcAfterPreload(value69, value70, value71, {
      ...args,
      directWhenBlank: ![],
    });
  return setPreviewMediaSrc(value69, value70, value71);
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
function previewMediaNeedsSrc(el46, value72) {
  const uniquePreviewUrls2 = uniquePreviewUrls(Array['isArray'](value72) ? value72 : [value72])[0x0] || '';
  if (!uniquePreviewUrls2) return ![];
  const enabled13 = el46?.['querySelector']?.('.v2-fast-preview-media');
  if (!enabled13) return !![];
  return (enabled13['getAttribute']?.('src') || enabled13['src'] || '') !== uniquePreviewUrls2;
}
function syncPreviewMedia(el47, value73, value74, viewportBusy2 = {}) {
  let image = el47['querySelector']('.v2-fast-preview-media');
  const list17 = uniquePreviewUrls(Array['isArray'](value73) ? value73 : [value73]),
    previewMediaCurrentSrc3 = getPreviewMediaCurrentSrc(image);
  list17['length'] > 0x0 &&
    previewMediaCurrentSrc3 &&
    !list17['includes'](previewMediaCurrentSrc3) &&
    isCanvasImagePreloadSharedImage(image) &&
    ((image['onload'] = null), (image['onerror'] = null), image['remove']?.(), (image = null));
  if (list17['length'] === 0x0) {
    if (image) viewportBusy2['cancelPendingMediaSrc']?.(image);
    const value75 =
      viewportBusy2['preserveInFlightResource'] !== ![] &&
      viewportBusy2['placeholderReady'] !== !![] &&
      isPreviewMediaResourceProtected(image);
    if (value75) {
      image['dataset']['previewResourceOnly'] = '1';
      if (image['style']) image['style']['visibility'] = 'hidden';
    } else (clearPreviewMediaSrc(image), image?.['remove']?.());
    return (
      delete el47['dataset']['hasMedia'],
      delete el47['dataset']['previewSrcCount'],
      viewportBusy2['placeholderReady'] === !![]
        ? (el47['dataset']['placeholderReady'] = '1')
        : delete el47['dataset']['placeholderReady'],
      { imageCount: 0x0, srcAssignedCount: 0x0 }
    );
  }
  delete el47['dataset']['placeholderReady'];
  if (!image) {
    ((image = document['createElement']('img')),
      (image['className'] = 'v2-fast-preview-media'),
      (image['decoding'] = 'async'),
      (image['alt'] = ''));
    if (typeof el47['insertBefore'] === 'function') el47['insertBefore'](image, el47['firstChild'] || null);
    else typeof el47['prepend'] === 'function' ? el47['prepend'](image) : el47['appendChild'](image);
  }
  const value76 = viewportBusy2['loading'] === 'lazy' ? 'lazy' : 'eager',
    value77 = viewportBusy2['fetchPriority'] === 'auto' ? 'auto' : 'high';
  if (image['loading'] !== value76) image['loading'] = value76;
  try {
    if (image['fetchPriority'] !== value77) image['fetchPriority'] = value77;
  } catch {}
  image['dataset']['previewKind'] = String(viewportBusy2['kind'] || '');
  if (viewportBusy2['critical'] === !![]) image['dataset']['previewCritical'] = '1';
  else delete image['dataset']['previewCritical'];
  ((image['_previewSources'] = list17),
    (image['_previewMediaQueuePriority'] = viewportBusy2['queuePriority'] || null),
    (image['_previewMediaSrcBatchLimit'] =
      viewportBusy2['mediaSrcBatchLimit'] != null &&
      Number['isFinite'](Number(viewportBusy2['mediaSrcBatchLimit']))
        ? Math['max'](0x0, Math['trunc'](Number(viewportBusy2['mediaSrcBatchLimit'])))
        : null),
    (image['_previewVideoMediaSrcBatchLimit'] =
      viewportBusy2['videoMediaSrcBatchLimit'] != null &&
      Number['isFinite'](Number(viewportBusy2['videoMediaSrcBatchLimit']))
        ? Math['max'](0x0, Math['trunc'](Number(viewportBusy2['videoMediaSrcBatchLimit'])))
        : null),
    (image['_previewDirectWhenBlank'] = viewportBusy2['directWhenBlank'] === !![]),
    delete image['dataset']['previewResourceOnly']);
  if (image['style']) image['style']['visibility'] = '';
  const run = () => {
    const enabled14 = String(image['getAttribute']?.('src') || image['src'] || '')['trim']();
    if (!enabled14 || !isPreviewMediaLoaded(image)) return;
    if (
      String(image['tagName'] || '')['toLowerCase']() === 'img' &&
      (image['complete'] === ![] || Number(image['naturalWidth'] || 0x0) <= 0x0)
    )
      return;
    const value78 = String(viewportBusy2['nodeId'] || '') + '\x00' + enabled14;
    if (image['_previewPresentedNotificationKey'] === value78) return;
    image['_previewPresentedNotificationKey'] = value78;
    try {
      viewportBusy2['onMediaPresented']?.(String(viewportBusy2['nodeId'] || ''), image);
    } catch {}
  };
  ((image['onload'] = () => {
    forgetCanvasImageDisplayLoad(image);
    const enabled15 = String(image['getAttribute']?.('src') || image['src'] || '')['trim']();
    if (!enabled15) return;
    ((image['dataset']['previewLoaded'] = '1'),
      rememberCanvasImagePreloadResolved(
        enabled15,
        {
          image: image,
          naturalWidth: image['naturalWidth'] || image['width'] || 0x0,
          naturalHeight: image['naturalHeight'] || image['height'] || 0x0,
        },
        { retainImage: !![] },
      ),
      run());
  }),
    (image['onerror'] = () => {
      (forgetCanvasImageDisplayLoad(image), delete image['dataset']['previewLoaded']);
      const value79 = Math['max'](0x0, Number(image['dataset']?.['srcIndex']) || 0x0),
        value80 = value79 + 0x1;
      !applyPreviewMediaSrcAfterPreload(image, image['_previewSources'] || [], value80) &&
        (image['onerror'] = null);
    }));
  if (viewportBusy2['deferSrc'] === !![]) viewportBusy2['scheduleMediaSrc']?.(image);
  else {
    viewportBusy2['cancelPendingMediaSrc']?.(image);
    let srcAssignedCount = ![];
    if (viewportBusy2['fallbackWhileDecoding'] === !![]) {
      const previewMediaCurrentSrc4 = getPreviewMediaCurrentSrc(image),
        enabled16 = !previewMediaCurrentSrc4 && list17['length'] > 0x1;
      (enabled16 &&
        (srcAssignedCount = setPreviewMediaSrcJoiningSharedAcquisition(image, list17, 0x1, {
          decode: ![],
          viewportBusy: viewportBusy2['viewportBusy'] === !![],
        })),
        viewportBusy2['holdFallbackWhileBusy'] !== !![] &&
          (srcAssignedCount = applyPreviewMediaSrcAfterPreload(image, list17, 0x0, {
            decode: !![],
            directWhenBlank: viewportBusy2['directWhenBlank'] === !![] && !enabled16,
            viewportBusy: viewportBusy2['viewportBusy'] === !![],
          })));
    } else
      srcAssignedCount = setPreviewMediaSrcJoiningSharedAcquisition(image, list17, 0x0, {
        decode: viewportBusy2['kind'] === 'image',
        directWhenBlank: viewportBusy2['directWhenBlank'] === !![],
        viewportBusy: viewportBusy2['viewportBusy'] === !![],
      });
    return (
      (image['alt'] = value74 || ''),
      (el47['dataset']['hasMedia'] = '1'),
      (el47['dataset']['previewSrcCount'] = String(list17['length'])),
      run(),
      { imageCount: 0x1, srcAssignedCount: srcAssignedCount ? 0x1 : 0x0 }
    );
  }
  return (
    (image['alt'] = value74 || ''),
    (el47['dataset']['hasMedia'] = '1'),
    (el47['dataset']['previewSrcCount'] = String(list17['length'])),
    run(),
    { imageCount: 0x1, srcAssignedCount: 0x0 }
  );
}
function syncPreviewEl(
  el48,
  nodeId,
  {
    kind: kind3,
    text: text,
    sources: sources2,
    geometry: geometry2,
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
  const { x: x2, y: y2, width: width3, height: height3 } = geometry2 || getPreviewGeometry(nodeId),
    value81 = x2 - offsetX,
    value82 = y2 - offsetY,
    value83 = Array['isArray'](sources2) ? sources2['join']('>') : String(sources2 || ''),
    value84 = value81 + ',' + value82 + ',' + width3 + ',' + height3,
    value85 = kind3 === 'audio' ? getAudioPreviewTimeText(nodeId) : '',
    value86 = kind3 + '|' + text + '|' + value83 + '|' + (placeholderReady ? 0x1 : 0x0) + '|' + value85,
    enabled17 = el48['_previewGeometrySig'] !== value84,
    enabled18 = el48['_previewContentSig'] !== value86;
  if (!enabled18) {
    const enabled19 = el48['querySelector']('.v2-fast-preview-media'),
      value87 = (!Array['isArray'](sources2) || sources2['length'] === 0x0) && !!enabled19,
      enabled20 =
        value87 ||
        previewMediaNeedsSrc(el48, sources2) ||
        (enabled19 &&
          (enabled19['loading'] !== mediaLoading || enabled19['fetchPriority'] !== mediaFetchPriority));
    if (!enabled17 && !enabled20) return;
  }
  if (enabled17) {
    const value88 = width3 + 'px',
      value89 = height3 + 'px';
    if (el48['style']['width'] !== value88) el48['style']['width'] = value88;
    if (el48['style']['height'] !== value89) el48['style']['height'] = value89;
    ((el48['_previewBaseX'] = value81),
      (el48['_previewBaseY'] = value82),
      (el48['_previewGeometrySig'] = value84));
  }
  let value90 = ![];
  if (enabled18) {
    const value91 = 'v2-fast-preview-node v2-fast-preview-node--' + kind3;
    el48['className'] !== value91 && ((el48['className'] = value91), (value90 = !![]));
    if (el48['dataset']['kind'] !== kind3) el48['dataset']['kind'] = kind3;
    (syncPreviewStaticContent(el48, nodeId, kind3, text), (el48['_previewContentSig'] = value86));
  }
  if (enabled17 || value90) applyPreviewDragTransform(el48);
  const enabled21 = el48['querySelector']('.v2-fast-preview-media'),
    value92 = (!Array['isArray'](sources2) || sources2['length'] === 0x0) && !!enabled21,
    enabled22 =
      enabled18 ||
      value92 ||
      previewMediaNeedsSrc(el48, sources2) ||
      (enabled21 &&
        (enabled21['loading'] !== mediaLoading || enabled21['fetchPriority'] !== mediaFetchPriority));
  if (!enabled22) return;
  return syncPreviewMedia(el48, sources2, text, {
    nodeId: nodeId?.['id'],
    loading: mediaLoading,
    fetchPriority: mediaFetchPriority,
    kind: kind3,
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
function applyPreviewDragTransform(el49) {
  if (!el49) return ![];
  const toNumber2 = toNumber(el49['_previewBaseX'], 0x0),
    toNumber3 = toNumber(el49['_previewBaseY'], 0x0),
    value93 = el49['_previewDragActive'] === !![],
    value94 = value93 ? toNumber(el49['_previewDragDx'], 0x0) : 0x0,
    value95 = value93 ? toNumber(el49['_previewDragDy'], 0x0) : 0x0;
  ((el49['style']['transform'] =
    'translate(' + (toNumber2 + value94) + 'px, ' + (toNumber3 + value95) + 'px)'),
    el49['classList']?.['toggle']?.('is-dragging-proxy', value93));
  if (value93) el49['dataset']['dragProxy'] = '1';
  else delete el49['dataset']['dragProxy'];
  return !![];
}
function resetPreviewDragState(el50) {
  if (!el50) return;
  ((el50['_previewDragActive'] = ![]),
    (el50['_previewDragDx'] = 0x0),
    (el50['_previewDragDy'] = 0x0),
    applyPreviewDragTransform(el50),
    el50['classList']?.['remove']?.('is-dragging-proxy'),
    delete el50['dataset']['dragProxy']);
}
function settlePreviewDragState(enabled23, value96 = 0x0, value97 = 0x0) {
  if (!enabled23) return ![];
  return (
    (enabled23['_previewBaseX'] = toNumber(enabled23['_previewBaseX'], 0x0) + toNumber(value96, 0x0)),
    (enabled23['_previewBaseY'] = toNumber(enabled23['_previewBaseY'], 0x0) + toNumber(value97, 0x0)),
    (enabled23['_previewDragActive'] = ![]),
    (enabled23['_previewDragDx'] = 0x0),
    (enabled23['_previewDragDy'] = 0x0),
    applyPreviewDragTransform(enabled23)
  );
}
function isStoryboardEditingNode(options14 = {}) {
  return (
    String(options14?.['type'] || '')
      ['trim']()
      ['toLowerCase']() === 'storyboard' && options14['isEditing']
  );
}
function syncPreviewConnectionState(
  el51,
  value98 = {},
  { connOverlay: connOverlay = null, pickConnectMode: pickConnectMode = null } = {},
) {
  const enabled24 = String(value98?.['id'] || el51?.['dataset']?.['nodeId'] || '')['trim']();
  if (!enabled24 || !el51?.['classList']) return;
  const enabled25 = String(connOverlay?.['srcId'] || '')['trim'](),
    enabled26 = pickConnectMode?.['active'] ? String(pickConnectMode['sourceNodeId'] || '')['trim']() : '',
    value99 = !!enabled26 && enabled24 === enabled26,
    value100 = !!enabled25 && enabled24 === enabled25,
    isStoryboardEditingNode2 = isStoryboardEditingNode(value98),
    enabled27 = value100 || value99 || isStoryboardEditingNode2,
    list18 = Array['isArray'](connOverlay?.['invalidNodeIds']) ? connOverlay['invalidNodeIds'] : [],
    value101 = !enabled27 && list18['includes'](enabled24),
    enabled28 = pickConnectMode?.['active'] ? String(pickConnectMode['hoverNodeId'] || '')['trim']() : '',
    value102 = !!enabled28 && enabled24 === enabled28,
    value103 = connOverlay?.['hoverId'] === enabled24 || value102,
    enabled29 =
      value103 &&
      (connOverlay?.['side'] === 'left' || (value102 && pickConnectMode?.['handleDirection'] === 'left'));
  (el51['classList']['toggle']('conn-src', enabled27),
    el51['classList']['toggle']('conn-invalid', value101),
    el51['classList']['toggle']('conn-hoverTarget', value103),
    el51['classList']['toggle']('conn-hover-output', enabled29),
    el51['classList']['toggle']('conn-hover-input', value103 && !enabled29));
}
function buildPreviewCandidateSyncSignature(response, value104, el52 = null) {
  const {
      node: node,
      nodeId: nodeId2,
      kind: kind4,
      sources: sources = [],
      geometry: geometry = {},
    } = response || {},
    value105 = value104?.['options'] || {},
    value106 = value105['connOverlay'] || {},
    value107 = value105['pickConnectMode'] || {},
    map3 = value104?.['mediaPlan']?.['explicitMediaSourceOwnerIds'],
    map4 = value104?.['requiredImmediateMediaSourceOwnerIds'],
    list19 = Array['isArray'](value106['invalidNodeIds']) ? value106['invalidNodeIds'] : [],
    el53 = el52?.['querySelector']?.('.v2-fast-preview-media') || null,
    value108 = String(sources[0x0] || '')['trim'](),
    value109 =
      (response?.['fullEligibleVisible'] === !![] || response?.['visible'] === !![]) &&
      (kind4 === 'video' ||
        toNumber(value104?.['visibleMediaCandidateCount'], 0x0) <=
          toNumber(value104?.['immediateMediaSrcLimit'], 0x0)),
    toNumber4 = toNumber(geometry['x'], 0x0) - toNumber(value104?.['layerBounds']?.['offsetX'], 0x0),
    toNumber5 = toNumber(geometry['y'], 0x0) - toNumber(value104?.['layerBounds']?.['offsetY'], 0x0);
  return [
    nodeId2,
    kind4,
    response?.['text'] ?? getPreviewText(node, kind4),
    sources['join']('>'),
    toNumber4,
    toNumber5,
    toNumber(geometry['width'], 0x0),
    toNumber(geometry['height'], 0x0),
    response?.['nearViewport'] === !![] ? 0x1 : 0x0,
    response?.['visible'] === !![] ? 0x1 : 0x0,
    response?.['fullEligibleVisible'] === !![] ? 0x1 : 0x0,
    response?.['fullEligiblePreview'] === !![] ? 0x1 : 0x0,
    response?.['fullEligibleMotionAhead'] === !![] ? 0x1 : 0x0,
    response?.['motionFront'] === !![] ? 0x1 : 0x0,
    response?.['motionAhead'] === !![] ? 0x1 : 0x0,
    response?.['selected'] === !![] ? 0x1 : 0x0,
    response?.['retained'] === !![] ? 0x1 : 0x0,
    response?.['mounted'] === !![] ? 0x1 : 0x0,
    value104?.['mediaPlan']?.['nodeIdsWithMedia']?.['has']?.(nodeId2) === !![] ? 0x1 : 0x0,
    map3 === null ? 'legacy' : map3?.['has']?.(nodeId2) === !![] ? 0x1 : 0x0,
    map4 === null ? 'legacy' : map4?.['has']?.(nodeId2) === !![] ? 0x1 : 0x0,
    value104?.['mediaPlan']?.['lowPriority'] === !![] ? 0x1 : 0x0,
    value104?.['mediaPlan']?.['prefetchAhead'] === !![] ? 0x1 : 0x0,
    value104?.['mediaLoading'] || '',
    value104?.['mediaFetchPriority'] || '',
    value109 ? 0x1 : 0x0,
    value104?.['viewportBusy'] === !![] ? 0x1 : 0x0,
    value105['suppressNewMedia'] === !![] ? 0x1 : 0x0,
    value105['suspendNewMediaSrc'] === !![] ? 0x1 : 0x0,
    value105['previewMotion']?.['zoomChanged'] === !![] ? 0x1 : 0x0,
    String(value106['srcId'] || ''),
    String(value106['hoverId'] || ''),
    String(value106['side'] || ''),
    list19['includes'](nodeId2) ? 0x1 : 0x0,
    value107['active'] === !![] ? 0x1 : 0x0,
    String(value107['sourceNodeId'] || ''),
    String(value107['hoverNodeId'] || ''),
    String(value107['handleDirection'] || ''),
    isStoryboardEditingNode(node) ? 0x1 : 0x0,
    el52?.['dataset']?.['mediaSourceOwner'] || '',
    el52?.['dataset']?.['hasMedia'] || '',
    el52?.['dataset']?.['placeholderReady'] || '',
    el53 ? getPreviewMediaCurrentSrc(el53) : '',
    el53?.['_previewSrcPreloadUrl'] || '',
    el53?.['dataset']?.['previewResourceOnly'] || '',
    el53?.['style']?.['visibility'] || '',
    el53?.['loading'] || '',
    el53?.['fetchPriority'] || '',
    value108 && kind4 !== 'video' && isCanvasImagePreloadCoolingDown(value108) ? 0x1 : 0x0,
  ]['join']('\x1f');
}
function syncLayerBounds(offsetX2, list20, { preserveAnchor: preserveAnchor = ![] } = {}) {
  if (!offsetX2 || !Array['isArray'](list20) || list20['length'] === 0x0) return null;
  if (
    preserveAnchor &&
    Number['isFinite'](offsetX2['_previewOffsetX']) &&
    Number['isFinite'](offsetX2['_previewOffsetY'])
  )
    return { offsetX: offsetX2['_previewOffsetX'], offsetY: offsetX2['_previewOffsetY'] };
  let value110 = Infinity,
    value111 = Infinity,
    value112 = -Infinity,
    value113 = -Infinity;
  for (const value114 of list20) {
    const box5 = value114?.['geometry'];
    if (!box5) continue;
    ((value110 = Math['min'](value110, box5['x'])),
      (value111 = Math['min'](value111, box5['y'])),
      (value112 = Math['max'](value112, box5['x'] + box5['width'])),
      (value113 = Math['max'](value113, box5['y'] + box5['height'])));
  }
  if (![value110, value111, value112, value113]['every'](Number['isFinite'])) return null;
  const left = value110 - FAST_PREVIEW_LAYER_PADDING,
    top = value111 - FAST_PREVIEW_LAYER_PADDING,
    width4 = 0x1,
    height4 = 0x1,
    value115 = left + ',' + top + ',' + width4 + ',' + height4;
  return (
    offsetX2['_previewBoundsSig'] !== value115 &&
      (Object['assign'](offsetX2['style'], {
        left: left + 'px',
        top: top + 'px',
        width: width4 + 'px',
        height: height4 + 'px',
      }),
      (offsetX2['_previewBoundsSig'] = value115)),
    (offsetX2['_previewOffsetX'] = left),
    (offsetX2['_previewOffsetY'] = top),
    { offsetX: left, offsetY: top }
  );
}
export function createRendererFastPreviewLayer({
  getWrapper: getWrapper,
  isMounted: isMounted,
  resolveMediaPresentationReady: resolveMediaPresentationReady,
  onMediaPresented: onMediaPresented2,
  onPresentationOwnerChanged: onPresentationOwnerChanged,
} = {}) {
  const map5 = new Map(),
    existingPreviewNodeIds = new Map(),
    poolSize = [],
    map6 = new Map(),
    map7 = new Map(),
    map8 = new Map(),
    retained = new Set(),
    map9 = new Set();
  let pendingMediaSrcCount = [],
    value116 = null,
    setTimeout2 = null,
    value117 = Number['POSITIVE_INFINITY'],
    value118 = Number['POSITIVE_INFINITY'],
    nowPerf2 = 0x0,
    enabled30 = ![],
    value119 = null,
    value120 = null,
    args2 = null,
    value121 = null,
    generation = 0x0,
    el54 = null,
    value122 = null,
    value123 = null,
    args3 = createEmptyStats();
  const map10 = new Map();
  function run2(value124, value125) {
    const nodeId3 = String(value124 || ''),
      wrapper = getWrapper?.(nodeId3);
    if (!wrapper?.['dataset']) return;
    const active2 = value125 === !![];
    if (active2) wrapper['dataset']['rendererPresentationOwner'] = 'fast-preview';
    else
      wrapper['dataset']['rendererPresentationOwner'] === 'fast-preview' &&
        delete wrapper['dataset']['rendererPresentationOwner'];
    onPresentationOwnerChanged?.({ nodeId: nodeId3, active: active2, wrapper: wrapper });
  }
  function stageRasterHandoffFrame(value126, canvas2) {
    const enabled31 = String(value126 || '')['trim']();
    if (!enabled31 || !canvas2?.['canvas']) return ![];
    const enabled32 = existingPreviewNodeIds['get'](enabled31);
    if (!enabled32) return (map8['set'](enabled31, canvas2), !![]);
    return (map8['delete'](enabled31), run2(enabled31, !![]), attachPreviewRasterFrame(enabled32, canvas2));
  }
  function run3(value127, el55, enabled33 = value122?.[String(value127 || '')]) {
    const value128 = resolveMediaPresentationReady?.(String(value127 || ''), el55),
      enabled34 = typeof value128 === 'boolean' ? value128 : isMountedMediaReady(el55);
    if (!enabled34) return ![];
    const list21 = [
      ...Array['from'](el55?.['querySelectorAll']?.('img') || [])['filter'](
        (value129) => isMountedPresentationMediaElement(value129) && isMountedImageReady(value129),
      ),
      ...Array['from'](el55?.['querySelectorAll']?.('video') || [])['filter'](
        (value130) => isMountedPresentationMediaElement(value130) && isMountedVideoReady(value130),
      ),
    ];
    if (enabled33 && !list21['some']((value131) => isPresentationMediaSourceForNode(value131, enabled33)))
      return ![];
    if (el55?.['dataset']?.['mediaLodMode'] !== 'full') return !![];
    return list21['some'](
      (el56) =>
        String(el56?.['tagName'] || '')['toLowerCase']() === 'img' &&
        String(el56?.['dataset']?.['lodSrc'] || '')['trim']() === 'full' &&
        (!enabled33 || isPresentationMediaSourceForNode(el56, enabled33)),
    );
  }
  function run4(value132, el57 = getWrapper?.(value132)) {
    if (!el57 || !isMounted?.(value132) || el57['isConnected'] === ![]) return ![];
    const value133 = el57['style'] || {};
    return !!(
      el57['hidden'] !== !![] &&
      value133['display'] !== 'none' &&
      value133['visibility'] !== 'hidden' &&
      value133['opacity'] !== '0'
    );
  }
  function run5(handler) {
    if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(handler);
    if (typeof window !== 'undefined' && typeof window['requestAnimationFrame'] === 'function')
      return window['requestAnimationFrame'](handler);
    return (handler(), null);
  }
  function run6(value134) {
    if (value134 == null) return;
    if (typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(value134);
      return;
    }
    if (typeof window !== 'undefined' && typeof window['cancelAnimationFrame'] === 'function') {
      window['cancelAnimationFrame'](value134);
      return;
    }
  }
  function run7() {
    if (setTimeout2 === null) return;
    (typeof clearTimeout === 'function' && clearTimeout(setTimeout2), (setTimeout2 = null));
  }
  function run8(value135) {
    if (value135 === !![]) {
      nowPerf2 = nowPerf() + FAST_PREVIEW_BUSY_HINT_TTL_MS;
      return;
    }
    if (value135 === ![]) nowPerf2 = 0x0;
  }
  function run9() {
    return nowPerf2 > nowPerf();
  }
  function run10(value136) {
    if (value136 !== !![]) {
      enabled30 = ![];
      return;
    }
    if (enabled30) return;
    ((enabled30 = !![]),
      cancelQueuedCanvasImagePreloads({
        scope: FAST_PREVIEW_MEDIA_PRELOAD_SCOPE,
        includeActive: ![],
        belowPriority: FAST_PREVIEW_VIEWPORT_BUSY_PRELOAD_CANCEL_PRIORITY_LIMIT,
        reason: 'fast preview viewport busy',
      }));
  }
  function run11(options15 = {}) {
    const center = getViewportWorldCenter(options15),
      box6 = value119,
      viewport = normalizeViewport(options15?.['viewport'])['zoom'],
      value137 = value120;
    ((value119 = center), (value120 = viewport));
    if (!box6) return { center: center, dx: 0x0, dy: 0x0, active: ![], zoomChanged: ![] };
    const dx2 = center['x'] - box6['x'],
      dy2 = center['y'] - box6['y'];
    return {
      center: center,
      dx: dx2,
      dy: dy2,
      active: dx2 * dx2 + dy2 * dy2 >= FAST_PREVIEW_MOTION_MIN_DISTANCE_SQ,
      zoomChanged: Number['isFinite'](value137) && Math['abs'](viewport - value137) > 0.000001,
    };
  }
  function run12(value138, value139) {
    const value140 = value138?.['_previewMediaQueuePriority'] || {},
      value141 = value139?.['_previewMediaQueuePriority'] || {},
      value142 = Number['isFinite'](Number(value140['userRank'])) ? Number(value140['userRank']) : 0x3,
      value143 = Number['isFinite'](Number(value141['userRank'])) ? Number(value141['userRank']) : 0x3;
    if (value142 !== value143) return value142 - value143;
    const value144 = Number['isFinite'](Number(value140['distanceSq']))
        ? Number(value140['distanceSq'])
        : Number['POSITIVE_INFINITY'],
      value145 = Number['isFinite'](Number(value141['distanceSq']))
        ? Number(value141['distanceSq'])
        : Number['POSITIVE_INFINITY'];
    if (value144 !== value145) return value144 - value145;
    const value146 = Number['isFinite'](Number(value140['order'])) ? Number(value140['order']) : 0x0,
      value147 = Number['isFinite'](Number(value141['order'])) ? Number(value141['order']) : 0x0;
    return value146 - value147;
  }
  function run13(value148) {
    let value149 = pendingMediaSrcCount['length'];
    for (let value150 = 0x0; value150 < pendingMediaSrcCount['length']; value150 += 0x1) {
      if (run12(value148, pendingMediaSrcCount[value150]) < 0x0) {
        value149 = value150;
        break;
      }
    }
    pendingMediaSrcCount['splice'](value149, 0x0, value148);
  }
  function run14() {
    pendingMediaSrcCount['sort'](run12);
  }
  function run15({ retryWhenBusy: retryWhenBusy = ![] } = {}) {
    if (value116 !== null || setTimeout2 !== null) return;
    if (retryWhenBusy && typeof setTimeout === 'function') {
      setTimeout2 = setTimeout(() => {
        ((setTimeout2 = null), run16());
      }, FAST_PREVIEW_BUSY_MEDIA_SRC_RETRY_MS);
      return;
    }
    value116 = run5(run16);
  }
  function run16() {
    const isPerfProbeEnabled2 = isPerfProbeEnabled(),
      startPerf = isPerfProbeEnabled2 ? nowPerf() : 0x0;
    ((value116 = null), run7());
    const viewportBusy3 = run9() || isViewportInteractionBusyForPreview(),
      batchLimit = pendingMediaSrcCount['reduce'](
        (value151, value152) =>
          Math['min'](
            value151,
            value152?.['_previewMediaSrcBatchLimit'] != null &&
              Number['isFinite'](Number(value152['_previewMediaSrcBatchLimit']))
              ? Math['max'](0x0, Math['trunc'](Number(value152['_previewMediaSrcBatchLimit'])))
              : Number['POSITIVE_INFINITY'],
          ),
        Number['POSITIVE_INFINITY'],
      ),
      batchLimit2 = pendingMediaSrcCount['reduce'](
        (value153, value154) =>
          Math['min'](
            value153,
            value154?.['_previewVideoMediaSrcBatchLimit'] != null &&
              Number['isFinite'](Number(value154['_previewVideoMediaSrcBatchLimit']))
              ? Math['max'](0x0, Math['trunc'](Number(value154['_previewVideoMediaSrcBatchLimit'])))
              : Number['POSITIVE_INFINITY'],
          ),
        Number['POSITIVE_INFINITY'],
      );
    let mediaSrcBatchSize = resolveMediaSrcBatchSize(pendingMediaSrcCount['length'], {
        viewportBusy: viewportBusy3,
        batchLimit: batchLimit,
      }),
      videoMediaSrcBatchSize = resolveVideoMediaSrcBatchSize(pendingMediaSrcCount['length'], {
        viewportBusy: viewportBusy3,
        batchLimit: batchLimit2,
      }),
      srcAssignedCount2 = 0x0,
      videoSrcAssignedCount = 0x0,
      videoDeferredCount = 0x0;
    const list22 = [],
      value155 = pendingMediaSrcCount['length'];
    let value156 = 0x0;
    while (mediaSrcBatchSize > 0x0 && pendingMediaSrcCount['length'] > 0x0 && value156 < value155) {
      const el58 = pendingMediaSrcCount['shift']();
      value156 += 0x1;
      if (!el58) continue;
      if (el58['isConnected'] === ![]) {
        map9['delete'](el58);
        continue;
      }
      const isPreviewVideoMedia2 = isPreviewVideoMedia(el58),
        decode2 = isPreviewCriticalMedia(el58);
      if (isPreviewVideoMedia2 && !decode2 && videoMediaSrcBatchSize <= 0x0) {
        (list22['push'](el58), (videoDeferredCount += 0x1));
        continue;
      }
      map9['delete'](el58);
      if (
        applyPreviewMediaSrcAfterPreload(el58, el58['_previewSources'] || [], 0x0, {
          decode: decode2 !== !![],
          directWhenBlank: decode2 === !![] || el58['_previewDirectWhenBlank'] === !![],
          viewportBusy: viewportBusy3,
        })
      ) {
        srcAssignedCount2 += 0x1;
        if (isPreviewVideoMedia2) videoSrcAssignedCount += 0x1;
      }
      if (isPreviewVideoMedia2 && !decode2) videoMediaSrcBatchSize -= 0x1;
      mediaSrcBatchSize -= 0x1;
    }
    list22['length'] > 0x0 && (pendingMediaSrcCount['push'](...list22), run14());
    if (isPerfProbeEnabled2) {
      const endPerf = nowPerf();
      recordFastPreviewSample('media-src-batch', endPerf - startPerf, {
        endPerf: endPerf,
        pendingMediaSrcCount: pendingMediaSrcCount['length'],
        srcAssignedCount: srcAssignedCount2,
        startPerf: startPerf,
        videoDeferredCount: videoDeferredCount,
        videoSrcAssignedCount: videoSrcAssignedCount,
      });
    }
    if (pendingMediaSrcCount['length'] > 0x0) run15({ retryWhenBusy: viewportBusy3 });
  }
  function scheduleMediaSrc2(enabled35) {
    if (!enabled35) return;
    const enabled36 = enabled35['_previewSources']?.[0x0] || '';
    if (!enabled36) return;
    const value157 = enabled35['getAttribute']?.('src') || enabled35['src'] || '';
    if (value157 === enabled36) return;
    if (enabled35['_previewSrcPreloadUrl'] === enabled36) return;
    enabled35['_previewSrcPreloadUrl'] &&
      enabled35['_previewSrcPreloadUrl'] !== enabled36 &&
      (nextPreviewMediaPreloadToken(enabled35), (enabled35['_previewSrcPreloadUrl'] = ''));
    if (map9['has'](enabled35)) {
      run14();
      return;
    }
    (map9['add'](enabled35), run13(enabled35), run15());
  }
  function cancelPendingMediaSrc2(enabled37) {
    if (!enabled37) return;
    (map9['has'](enabled37) &&
      (map9['delete'](enabled37),
      (pendingMediaSrcCount = pendingMediaSrcCount['filter']((value158) => value158 !== enabled37))),
      enabled37['_previewSrcPreloadUrl'] &&
        (nextPreviewMediaPreloadToken(enabled37), (enabled37['_previewSrcPreloadUrl'] = '')));
  }
  function run17() {
    value116 !== null && (run6(value116), (value116 = null));
    run7();
    for (const value159 of map9) {
      value159 && (nextPreviewMediaPreloadToken(value159), (value159['_previewSrcPreloadUrl'] = ''));
    }
    (map9['clear'](), (pendingMediaSrcCount = []));
  }
  function run18() {
    (value121 !== null && (run6(value121), (value121 = null)), (args2 = null));
  }
  function run19(el59, { clearSrc: clearSrc = ![] } = {}) {
    if (!el59) return;
    const value160 = el59['querySelector']?.('.v2-fast-preview-media');
    if (value160) {
      cancelPendingMediaSrc2(value160);
      if (clearSrc) clearPreviewMediaSrc(value160);
    }
  }
  function run20(el60) {
    const el61 = el60?.['querySelector']?.('.v2-fast-preview-media');
    if (!el61) return ![];
    cancelPendingMediaSrc2(el61);
    if (isPreviewMediaResourceProtected(el61)) {
      el61['dataset']['previewResourceOnly'] = '1';
      if (el61['style']) el61['style']['visibility'] = 'hidden';
      return (delete el60['dataset']['hasMedia'], delete el60['dataset']['previewSrcCount'], !![]);
    }
    return (
      clearPreviewMediaSrc(el61),
      el61['remove']?.(),
      delete el60['dataset']['hasMedia'],
      delete el60['dataset']['previewSrcCount'],
      !![]
    );
  }
  function reconcileMediaSourceOwners(
    value161,
    {
      preservePaintedMediaOwners: preservePaintedMediaOwners = ![],
      preservePaintedVideoOwners: preservePaintedVideoOwners = ![],
    } = {},
  ) {
    if (value161 == null || typeof value161?.[Symbol['iterator']] !== 'function') return 0x0;
    const mediaSourceOwnerIds = new Set(
      Array['from'](value161, (value162) => String(value162 || ''))['filter'](Boolean),
    );
    args2?.['mediaPlan'] &&
      ((args2['mediaPlan']['explicitMediaSourceOwnerIds'] = mediaSourceOwnerIds),
      (args2['mediaPlan']['nodeIdsWithMedia'] = new Set(
        [...args2['mediaPlan']['nodeIdsWithMedia']]['filter']((value163) =>
          mediaSourceOwnerIds['has'](value163),
        ),
      )),
      (args2['options'] = { ...args2['options'], mediaSourceOwnerIds: mediaSourceOwnerIds }));
    let count9 = 0x0;
    for (const [value164, el62] of existingPreviewNodeIds) {
      if (mediaSourceOwnerIds['has'](value164))
        ((el62['dataset']['mediaSourceOwner'] = '1'), restorePaintedPreviewMedia(el62));
      else {
        if (
          (preservePaintedMediaOwners || preservePaintedVideoOwners) &&
          hasRetainablePaintedPreviewMedia(el62, { includeImages: preservePaintedMediaOwners })
        )
          ((el62['dataset']['mediaSourceOwner'] = '1'), restorePaintedPreviewMedia(el62));
        else {
          delete el62['dataset']['mediaSourceOwner'];
          if (run20(el62)) count9 += 0x1;
        }
      }
    }
    for (const [value165, el63] of map6) {
      if (mediaSourceOwnerIds['has'](value165))
        ((el63['dataset']['mediaSourceOwner'] = '1'), restorePaintedPreviewMedia(el63));
      else {
        if (
          el63['dataset']['mediaSourceOwner'] === '1' &&
          (preservePaintedMediaOwners || preservePaintedVideoOwners) &&
          hasRetainablePaintedPreviewMedia(el63, { includeImages: preservePaintedMediaOwners })
        )
          restorePaintedPreviewMedia(el63);
        else {
          delete el63['dataset']['mediaSourceOwner'];
          if (run20(el63)) count9 += 0x1;
        }
      }
    }
    for (const value166 of map7['values']()) {
      !mediaSourceOwnerIds['has'](value166['nodeId']) && run20(value166['el']) && (count9 += 0x1);
    }
    if (count9 > 0x0) run21();
    return count9;
  }
  function run22(el64) {
    if (!el64) return;
    (run19(el64, { clearSrc: !![] }),
      removePreviewRasterFrame(el64),
      resetPreviewDragState(el64),
      delete el64['_previewSig'],
      delete el64['_previewGeometrySig'],
      delete el64['_previewContentSig'],
      delete el64['_previewCandidateSyncSig'],
      delete el64['dataset']['nodeId'],
      delete el64['dataset']['kind'],
      delete el64['dataset']['hasMedia'],
      delete el64['dataset']['placeholderReady'],
      delete el64['dataset']['previewSrcCount'],
      delete el64['dataset']['mediaSourceOwner'],
      delete el64['dataset']['previewReleaseStage'],
      delete el64['dataset']['rasterFrame'],
      Object['assign'](el64['style'], {
        display: 'none',
        height: '',
        opacity: '',
        pointerEvents: '',
        transform: '',
        visibility: '',
        width: '',
      }),
      (el64['className'] = 'v2-fast-preview-node'),
      el64['remove']?.());
  }
  function run23(value167, el65) {
    const enabled38 = String(value167 || '')['trim']();
    if (!enabled38 || !el65) return ![];
    const value168 = el65['querySelector']?.('.v2-fast-preview-media');
    if (!isPreviewMediaLoaded(value168) && !isPreviewMediaResourceProtected(value168)) return ![];
    (run19(el65), resetPreviewDragState(el65));
    if (map6['has'](enabled38)) run24(map6['get'](enabled38));
    (map6['set'](enabled38, el65), Object['assign'](el65['style'], { display: 'none' }), el65['remove']?.());
    while (map6['size'] > FAST_PREVIEW_DETACHED_NODE_CACHE_LIMIT) {
      const value169 = Array['from'](map6['entries']())['find'](([value170, el66]) => {
          const value171 = el66?.['querySelector']?.('.v2-fast-preview-media');
          return !isPreviewMediaResourceProtected(value171);
        }),
        enabled39 = value169?.[0x0];
      if (!enabled39) {
        if (map6['size'] <= FAST_PREVIEW_DETACHED_IN_FLIGHT_CACHE_LIMIT) break;
      }
      const value172 = enabled39 || map6['keys']()['next']()['value'],
        value173 = map6['get'](value172);
      (map6['delete'](value172), run24(value173));
    }
    return !![];
  }
  function run25() {
    const value174 = Array['from'](map6['entries']())['find'](([value175, el67]) => {
        const value176 = el67?.['querySelector']?.('.v2-fast-preview-media');
        return !isPreviewMediaResourceProtected(value176);
      }),
      enabled40 = value174?.[0x0];
    if (!enabled40) return null;
    const value177 = map6['get'](enabled40);
    return (map6['delete'](enabled40), run22(value177), value177 || null);
  }
  function run26(value178) {
    let value179 = ![],
      enabled41 = ![],
      el68 = map6['get'](value178);
    if (el68) (map6['delete'](value178), (value179 = !![]), (enabled41 = !![]));
    else {
      ((el68 = poolSize['pop']() || run25()), (value179 = !!el68));
      if (!el68) el68 = createPreviewEl(value178);
    }
    ((el68['dataset']['nodeId'] = value178),
      delete el68['dataset']['previewReleaseStage'],
      Object['assign'](el68['style'], { display: '', opacity: '', pointerEvents: '', visibility: '' }));
    !enabled41 &&
      (delete el68['_previewSig'], delete el68['_previewGeometrySig'], delete el68['_previewContentSig']);
    el68['_fastPreviewReused'] = value179;
    let enabled42 = el68['querySelector']?.('.v2-fast-preview-label');
    return (
      !enabled42 &&
        ((enabled42 = document['createElement']('div')),
        (enabled42['className'] = 'v2-fast-preview-label'),
        el68['appendChild'](enabled42)),
      el68
    );
  }
  function run24(enabled43) {
    if (!enabled43) return;
    (run22(enabled43), poolSize['length'] < FAST_PREVIEW_NODE_POOL_LIMIT && poolSize['push'](enabled43));
  }
  function mountFragment() {
    return typeof document !== 'undefined' && typeof document['createDocumentFragment'] === 'function'
      ? document['createDocumentFragment']()
      : null;
  }
  function run27(enabled44) {
    const enabled45 = enabled44?.['mountFragment'];
    if (!enabled45 || !enabled44?.['layer']) return;
    enabled44['layer']['appendChild'](enabled45);
  }
  function run28(text2, offsetX3) {
    if (text2?.['deferredDescriptorSources'] === !![]) {
      const response2 = map5['get'](text2['nodeId']),
        previewMediaUrls = getPreviewMediaUrls(text2['node'], text2['kind'], { displayFirst: !![] }),
        previewMediaUrls2 = getPreviewMediaUrls(text2['node'], text2['kind'], { displayFirst: ![] });
      (response2 &&
        ((response2['sourcesDisplayFirst'] = previewMediaUrls),
        (response2['sourcesThumbnailFirst'] = previewMediaUrls2)),
        (text2['sources'] = text2['fullEligiblePreview'] ? previewMediaUrls : previewMediaUrls2),
        (text2['hasMediaHint'] = text2['sources']['length'] > 0x0),
        response2 &&
          response2['text'] == null &&
          (response2['text'] = getPreviewText(text2['node'], text2['kind'])),
        text2['text'] == null &&
          (text2['text'] = response2?.['text'] ?? getPreviewText(text2['node'], text2['kind'])),
        (text2['deferredDescriptorSources'] = ![]));
    }
    const {
      node: node2,
      nodeId: nodeId4,
      kind: kind5,
      sources: sources3,
      geometry: geometry3,
      nearViewport: nearViewport,
      visible: visible,
    } = text2;
    let el69 = existingPreviewNodeIds['get'](nodeId4);
    const value180 = el69;
    if (!el69) {
      const value181 = Array['from'](map7['values']())['find']((value182) => value182['nodeId'] === nodeId4);
      value181 && (run29(value181), (el69 = existingPreviewNodeIds['get'](nodeId4)));
    }
    let createdCount = 0x0,
      reusedCount = 0x0;
    if (!el69) {
      ((el69 = run26(nodeId4)),
        existingPreviewNodeIds['set'](nodeId4, el69),
        (offsetX3['mountFragment'] || offsetX3['layer'])['appendChild'](el69));
      if (el69['_fastPreviewReused'] === !![]) reusedCount = 0x1;
      else createdCount = 0x1;
      delete el69['_fastPreviewReused'];
    } else el69['parentNode'] !== offsetX3['layer'] && offsetX3['layer']['appendChild'](el69);
    run2(nodeId4, !![]);
    const value183 = map8['get'](nodeId4);
    value183 && (map8['delete'](nodeId4), attachPreviewRasterFrame(el69, value183));
    isPreviewRasterFrameReady(el69) &&
      !isPreviewRasterFrameCompatible(el69, {
        ...text2,
        sources: sources3,
        text: text2['text'] ?? getPreviewText(node2, kind5),
      }) &&
      removePreviewRasterFrame(el69);
    const previewCandidateSyncSignature = buildPreviewCandidateSyncSignature(text2, offsetX3, el69);
    if (
      value180 === el69 &&
      el69['parentNode'] === offsetX3['layer'] &&
      el69['_previewCandidateSyncSig'] === previewCandidateSyncSignature
    ) {
      const value184 = el69['querySelector']?.('.v2-fast-preview-media');
      return (
        value184 &&
          map9['has'](value184) &&
          ((value184['_previewMediaQueuePriority'] = resolveRendererFastPreviewMediaQueuePriority(
            text2,
            offsetX3['options'],
          )),
          (offsetX3['pendingMediaPriorityChanged'] = !![])),
        { createdCount: 0x0, imageCount: 0x0, reusedCount: 0x0, srcAssignedCount: 0x0 }
      );
    }
    const enabled46 = offsetX3['mediaPlan']['nodeIdsWithMedia']['has'](nodeId4),
      value185 =
        offsetX3['mediaPlan']['explicitMediaSourceOwnerIds'] === null ||
        offsetX3['mediaPlan']['explicitMediaSourceOwnerIds']['has'](nodeId4) ||
        text2['fullEligibleVisible'] ||
        visible ||
        text2['motionFront'],
      enabled47 =
        value185 || offsetX3['preservePaintedMediaOwners'] !== !![]
          ? ''
          : getRetainablePaintedPreviewMediaSource(el69, sources3),
      value186 = value185 || !!enabled47;
    if (value186) el69['dataset']['mediaSourceOwner'] = '1';
    else delete el69['dataset']['mediaSourceOwner'];
    const value187 = offsetX3['viewportBusy'] === !![] || offsetX3['options']?.['suppressNewMedia'] === !![],
      value188 =
        enabled46 &&
        kind5 === 'video' &&
        sources3['length'] > 0x0 &&
        (text2['motionFront'] ||
          (visible &&
            (text2['mounted'] ||
              offsetX3['requiredImmediateMediaSourceOwnerIds'] === null ||
              offsetX3['requiredImmediateMediaSourceOwnerIds']['has'](nodeId4)))),
      value189 =
        enabled46 &&
        kind5 === 'image' &&
        sources3['length'] > 0x0 &&
        (text2['fullEligibleVisible'] ||
          (isRendererFastPreviewMediaReadable(geometry3, offsetX3['options']) &&
            (text2['motionFront'] || visible)) ||
          (visible &&
            (text2['mounted'] ||
              offsetX3['requiredImmediateMediaSourceOwnerIds'] === null ||
              offsetX3['requiredImmediateMediaSourceOwnerIds']['has'](nodeId4))) ||
          offsetX3['mediaPlan']['explicitMediaSourceOwnerIds']?.['has'](nodeId4)),
      enabled48 =
        value186 && (!enabled46 || offsetX3['options']?.['suspendNewMediaSrc'] === !![])
          ? getReusableLoadedPreviewMediaSource(el69, sources3)
          : '',
      value190 =
        value186 && value187 && (!enabled46 || !enabled48)
          ? getReusableCurrentPreviewMediaSource(el69, sources3)
          : '';
    let sources4 = [];
    if (enabled46 && (offsetX3['options']?.['suspendNewMediaSrc'] !== !![] || value188 || value189))
      sources4 = sources3;
    else {
      if (enabled47) sources4 = [enabled47];
      else {
        if (enabled48) sources4 = [enabled48];
        else value190 && (sources4 = [value190]);
      }
    }
    const value191 = sources4['length'] > 0x0,
      value192 = enabled46 && value191 && (text2['selected'] || text2['retained'] || text2['mounted']),
      value193 = value191 && previewMediaNeedsSrc(el69, sources4),
      value194 = kind5 === 'video' && value191,
      value195 =
        (text2['fullEligibleVisible'] || visible) &&
        offsetX3['options']?.['deferVisibleMediaSrc'] !== !![] &&
        (kind5 === 'video' || offsetX3['visibleMediaCandidateCount'] <= offsetX3['immediateMediaSrcLimit']),
      mediaCritical2 = enabled46 && value191 && (value192 || value195),
      value196 = value194 && mediaCritical2,
      mediaLoading2 =
        enabled46 &&
        value191 &&
        (text2['fullEligibleVisible'] ||
          text2['fullEligibleMotionAhead'] ||
          visible ||
          text2['motionFront'] ||
          text2['motionAhead'] ||
          value192),
      value197 =
        enabled46 &&
        value191 &&
        offsetX3['mediaPlan']['lowPriority'] === !![] &&
        offsetX3['viewportBusy'] !== !![] &&
        nearViewport,
      deferMediaSrc2 =
        value193 &&
        !mediaCritical2 &&
        (offsetX3['immediateMediaSrcSlotsRef']['value'] <= 0x0 ||
          (value194 && offsetX3['immediateVideoMediaSrcSlotsRef']['value'] <= 0x0));
    if (value193 && !deferMediaSrc2) {
      if (!mediaCritical2) offsetX3['immediateMediaSrcSlotsRef']['value'] -= 0x1;
      value194 && !mediaCritical2 && (offsetX3['immediateVideoMediaSrcSlotsRef']['value'] -= 0x1);
    }
    const value198 = (enabled46 && value191 && offsetX3['mediaPlan']['prefetchAhead'] === !![]) || value197,
      syncPreviewEl2 = syncPreviewEl(el69, node2, {
        kind: kind5,
        text: text2['text'] ?? getPreviewText(node2, kind5),
        sources: sources4,
        geometry: geometry3,
        offsetX: offsetX3['layerBounds']['offsetX'],
        offsetY: offsetX3['layerBounds']['offsetY'],
        mediaLoading: mediaLoading2 || value198 ? 'eager' : offsetX3['mediaLoading'],
        mediaFetchPriority: mediaLoading2 || value198 ? 'high' : offsetX3['mediaFetchPriority'],
        mediaCritical: mediaCritical2,
        mediaDirectWhenBlank:
          text2['fullEligibleVisible'] ||
          visible ||
          (enabled46 &&
            (text2['motionFront'] ||
              (offsetX3['viewportBusy'] &&
                offsetX3['mediaPlan']['explicitMediaSourceOwnerIds']?.['has'](nodeId4)))),
        mediaFallbackWhileDecoding: text2['fullEligiblePreview'],
        mediaHoldFallbackWhileBusy:
          offsetX3['viewportBusy'] && offsetX3['options']?.['suspendNewMediaSrc'] === !![],
        viewportBusy: offsetX3['viewportBusy'],
        placeholderReady: sources3['length'] === 0x0,
        preserveInFlightResource: offsetX3['options']?.['suspendNewMediaSrc'] !== !![],
        queuePriority: resolveRendererFastPreviewMediaQueuePriority(text2, offsetX3['options']),
        mediaSrcBatchLimit: offsetX3['mediaSrcBatchLimit'],
        videoMediaSrcBatchLimit: offsetX3['videoMediaSrcBatchLimit'],
        deferMediaSrc: deferMediaSrc2,
        scheduleMediaSrc: scheduleMediaSrc2,
        cancelPendingMediaSrc: cancelPendingMediaSrc2,
        onMediaPresented: onMediaPresented2,
      });
    return (
      restorePreviewRasterFrameState(el69),
      value186 && restorePaintedPreviewMedia(el69) && (el69['dataset']['mediaSourceOwner'] = '1'),
      syncPreviewConnectionState(el69, node2, offsetX3['options']),
      (el69['_previewCandidateSyncSig'] = buildPreviewCandidateSyncSignature(text2, offsetX3, el69)),
      {
        createdCount: createdCount,
        imageCount: Number(syncPreviewEl2?.['imageCount'] || 0x0),
        reusedCount: reusedCount,
        srcAssignedCount: Number(syncPreviewEl2?.['srcAssignedCount'] || 0x0),
      }
    );
  }
  function run30() {
    const isPerfProbeEnabled3 = isPerfProbeEnabled(),
      startPerf2 = isPerfProbeEnabled3 ? nowPerf() : 0x0;
    value121 = null;
    const pendingCreateCount = args2;
    if (
      !pendingCreateCount ||
      pendingCreateCount['generation'] !== generation ||
      pendingCreateCount['layer']?.['isConnected'] === ![]
    ) {
      args2 = null;
      return;
    }
    let count10 =
        Number(pendingCreateCount['createBatchSize']) || FAST_PREVIEW_FALLBACK_NODE_CREATE_BATCH_SIZE,
      createdCount2 = 0x0,
      imageCount = 0x0,
      reusedCount2 = 0x0,
      srcAssignedCount3 = 0x0;
    while (count10 > 0x0 && pendingCreateCount['candidates']['length'] > 0x0) {
      const value199 = run28(pendingCreateCount['candidates']['shift'](), pendingCreateCount);
      ((createdCount2 += Number(value199?.['createdCount'] || 0x0)),
        (imageCount += Number(value199?.['imageCount'] || 0x0)),
        (reusedCount2 += Number(value199?.['reusedCount'] || 0x0)),
        (srcAssignedCount3 += Number(value199?.['srcAssignedCount'] || 0x0)),
        (count10 -= 0x1));
    }
    run27(pendingCreateCount);
    pendingCreateCount['pendingMediaPriorityChanged'] &&
      (run14(), (pendingCreateCount['pendingMediaPriorityChanged'] = ![]));
    pendingCreateCount['viewportBusy'] === !![] &&
      ((value117 = Math['min'](
        value117,
        Math['max'](0x0, pendingCreateCount['immediateMediaSrcSlotsRef']['value']),
      )),
      (value118 = Math['min'](
        value118,
        Math['max'](0x0, pendingCreateCount['immediateVideoMediaSrcSlotsRef']['value']),
      )));
    if (isPerfProbeEnabled3) {
      const endPerf2 = nowPerf();
      recordFastPreviewSample('create-batch', endPerf2 - startPerf2, {
        createdCount: createdCount2,
        endPerf: endPerf2,
        imageCount: imageCount,
        pendingCreateCount: pendingCreateCount['candidates']['length'],
        pendingMediaSrcCount: pendingMediaSrcCount['length'],
        poolSize: poolSize['length'],
        reusedCount: reusedCount2,
        srcAssignedCount: srcAssignedCount3,
        startPerf: startPerf2,
        zoom: pendingCreateCount['options']?.['viewport']?.['zoom'],
      });
    }
    pendingCreateCount['candidates']['length'] > 0x0 ? (value121 = run5(run30)) : ((args2 = null), run21());
  }
  function run31(el70) {
    if (!el70) return null;
    return (
      el54 && el54['parentNode'] !== el70 && (el54['remove']?.(), (el54 = null)),
      !el54 &&
        ((el54 = document['createElement']('div')),
        (el54['className'] = 'v2-fast-preview-layer'),
        (el54['dataset']['role'] = 'fast-preview-layer')),
      !el54['isConnected'] &&
        (typeof el70['prepend'] === 'function' ? el70['prepend'](el54) : el70['appendChild'](el54)),
      el54
    );
  }
  function run32(box7) {
    if (!el54?.['classList']) return;
    const count11 = Number(box7?.['zoom']);
    el54['classList']['toggle'](
      'is-minimal-interaction-detail',
      Number['isFinite'](count11) &&
        count11 > 0x0 &&
        count11 <= FAST_PREVIEW_MINIMAL_INTERACTION_DETAIL_MAX_ZOOM,
    );
  }
  function clear({
    preserveStagedReleases: preserveStagedReleases = ![],
    preserveDragPreviewScene: preserveDragPreviewScene = ![],
  } = {}) {
    (run18(), run17());
    for (const run33 of map10['values']()) {
      if (typeof run33 === 'function') run33();
    }
    map10['clear']();
    if (!preserveStagedReleases)
      for (const value200 of Array['from'](map7['values']())) {
        run34(value200, { cache: ![] });
      }
    (existingPreviewNodeIds['forEach']((value201, value202) => {
      (run2(value202, ![]), run22(value201));
    }),
      existingPreviewNodeIds['clear'](),
      poolSize['forEach']((value203) => run22(value203)),
      (poolSize['length'] = 0x0),
      map6['forEach']((value204) => run22(value204)),
      map6['clear'](),
      map8['clear'](),
      map5['clear'](),
      retained['clear'](),
      (value122 = null));
    if (!preserveDragPreviewScene) value123 = null;
    ((nowPerf2 = 0x0),
      (enabled30 = ![]),
      (value119 = null),
      (!preserveStagedReleases || map7['size'] === 0x0) && (el54?.['remove']?.(), (el54 = null)),
      (args3 = createEmptyStats()));
  }
  function run21() {
    const emptyStats = createEmptyStats();
    for (const [value205, el71] of existingPreviewNodeIds['entries']()) {
      (run2(value205, !![]), (emptyStats['fastPreviewCount'] += 0x1));
      if (isElementVisible(el71)) emptyStats['visibleFastPreviewCount'] += 0x1;
      if (el71?.['dataset']?.['hasMedia'] === '1') emptyStats['previewWithMediaCount'] += 0x1;
      const el72 = getWrapper?.(value205);
      isMounted?.(value205) &&
        el72?.['isConnected'] !== ![] &&
        (el72?.['classList']?.['contains']?.('v2-node-detail-deferred') ||
          el72?.['dataset']?.['detailStage'] === 'deferred') &&
        (emptyStats['deferredMountedWithPreviewCount'] += 0x1);
    }
    for (const { el: el73 } of map7['values']()) {
      emptyStats['stagedPreviewCount'] += 0x1;
      if (el73?.['isConnected'] === ![]) continue;
      ((emptyStats['connectedStagedPreviewCount'] += 0x1), (emptyStats['fastPreviewCount'] += 0x1));
      if (isElementVisible(el73)) emptyStats['visibleFastPreviewCount'] += 0x1;
      if (el73?.['dataset']?.['hasMedia'] === '1') emptyStats['previewWithMediaCount'] += 0x1;
    }
    return ((args3 = emptyStats), emptyStats);
  }
  function run35(value206) {
    const value207 = String(value206 || ''),
      handler2 = map10['get'](value207);
    if (typeof handler2 === 'function') handler2();
    map10['delete'](value207);
  }
  function run36(value208, el74) {
    const enabled49 = String(value208 || '');
    if (!enabled49 || !el74) return;
    if (run3(enabled49, el74)) {
      (run35(enabled49),
        run5(() => {
          const value209 = getWrapper?.(enabled49);
          if (run4(enabled49, value209) && run3(enabled49, value209)) {
            try {
              onMediaPresented2?.(enabled49, value209);
            } catch {}
            run37(enabled49);
          }
        }));
      return;
    }
    if (map10['has'](enabled49)) return;
    const list23 = [
      ...(el74['querySelectorAll']?.('img') || []),
      ...(el74['querySelectorAll']?.('video') || []),
    ];
    if (list23['length'] === 0x0) return;
    const value210 = () => {
      const value211 = getWrapper?.(enabled49);
      if (!run4(enabled49, value211) || !run3(enabled49, value211)) return;
      try {
        onMediaPresented2?.(enabled49, value211);
      } catch {}
      run37(enabled49);
    };
    for (const el75 of list23) {
      (el75['addEventListener']?.('load', value210),
        el75['addEventListener']?.('loadeddata', value210),
        el75['addEventListener']?.('canplay', value210));
    }
    map10['set'](enabled49, () => {
      for (const el76 of list23) {
        (el76['removeEventListener']?.('load', value210),
          el76['removeEventListener']?.('loadeddata', value210),
          el76['removeEventListener']?.('canplay', value210));
      }
    });
  }
  function run34(enabled50) {
    if (!enabled50 || map7['get'](enabled50['el']) !== enabled50) return;
    (run6(enabled50['finalizeFrameId']),
      (enabled50['finalizeFrameId'] = null),
      map7['delete'](enabled50['el']));
    if (existingPreviewNodeIds['get'](enabled50['nodeId']) === enabled50['el']) return;
    run24(enabled50['el']);
  }
  function run29(enabled51) {
    if (!enabled51 || map7['get'](enabled51['el']) !== enabled51) return ![];
    const { el: el77, nodeId: nodeId5 } = enabled51;
    (run6(enabled51['finalizeFrameId']),
      (enabled51['finalizeFrameId'] = null),
      map7['delete'](el77),
      delete el77['dataset']['previewReleaseStage'],
      Object['assign'](el77['style'], { display: '', opacity: '', pointerEvents: '', visibility: '' }));
    const el78 = enabled51['layerEl'] || el54;
    return (
      el78 && el77['parentNode'] !== el78 && el78['appendChild'](el77),
      existingPreviewNodeIds['set'](nodeId5, el77),
      !![]
    );
  }
  function run38(value212, value213) {
    for (const value214 of Array['from'](map7['values']())) {
      const enabled52 = value212?.[value214['nodeId']];
      if (!enabled52 || !isRendererFastPreviewGeometryVisible(getPreviewGeometry(enabled52), value213)) {
        run34(value214);
        continue;
      }
      const value215 = getWrapper?.(value214['nodeId']),
        enabled53 = run4(value214['nodeId'], value215);
      (!enabled53 || !run3(value214['nodeId'], value215)) && run29(value214);
    }
  }
  function run37(value216, { collect: collect = !![] } = {}) {
    const nodeId6 = String(value216 || ''),
      enabled54 = getWrapper?.(nodeId6);
    if (!nodeId6 || !enabled54 || !run4(nodeId6, enabled54) || !run3(nodeId6, enabled54)) return ![];
    (retained['delete'](nodeId6), run2(nodeId6, ![]), run35(nodeId6));
    const el79 = existingPreviewNodeIds['get'](nodeId6);
    args2?.['candidates'] &&
      (args2['candidates'] = args2['candidates']['filter']((value217) => value217['nodeId'] !== nodeId6));
    if (!el79) return !![];
    (existingPreviewNodeIds['delete'](nodeId6), run19(el79));
    const layerEl = el79['parentNode'] || el54;
    ((el79['dataset']['previewReleaseStage'] = 'detached'), el79['remove']?.());
    const value218 = { el: el79, nodeId: nodeId6, layerEl: layerEl, finalizeFrameId: null };
    (map7['set'](el79, value218),
      (value218['finalizeFrameId'] = run5(() => {
        ((value218['finalizeFrameId'] = null), run34(value218), run21());
      })));
    if (collect) run21();
    return !![];
  }
  function run39(value219) {
    const value220 = String(value219 || '');
    for (const value221 of Array['from'](map7['values']())) {
      if (value221['nodeId'] !== value220) continue;
      run34(value221);
    }
  }
  function removeNode(value222, { cache: cache = !![], collect: collect = !![] } = {}) {
    const value223 = String(value222 || '');
    (map8['delete'](value223),
      retained['delete'](value223),
      run2(value223, ![]),
      run35(value223),
      run39(value223));
    const el80 = existingPreviewNodeIds['get'](value223);
    args2?.['candidates'] &&
      (args2['candidates'] = args2['candidates']['filter']((value224) => value224['nodeId'] !== value223));
    if (!el80) return;
    existingPreviewNodeIds['delete'](value223);
    const value225 = el80['querySelector']?.('.v2-fast-preview-media'),
      isPreviewMediaResourceProtected2 = isPreviewMediaResourceProtected(value225);
    ((!cache && !isPreviewMediaResourceProtected2) || !run23(value223, el80)) && run24(el80);
    if (collect) run21();
  }
  function discardNode(value226, { collect: collect = !![] } = {}) {
    const value227 = String(value226 || '');
    (map8['delete'](value227),
      retained['delete'](value227),
      run2(value227, ![]),
      run35(value227),
      run39(value227));
    args2?.['candidates'] &&
      (args2['candidates'] = args2['candidates']['filter']((value228) => value228['nodeId'] !== value227));
    const value229 = existingPreviewNodeIds['get'](value227);
    value229 && (existingPreviewNodeIds['delete'](value227), run24(value229));
    const value230 = map6['get'](value227);
    value230 && (map6['delete'](value227), run24(value230));
    map5['delete'](value227);
    if (collect && (value229 || value230)) run21();
    return !!(value229 || value230);
  }
  function prune(value231) {
    const map11 =
      value231 && typeof value231[Symbol['iterator']] === 'function'
        ? new Set(Array['from'](value231, (value232) => String(value232 || '')))
        : new Set();
    let count12 = 0x0;
    for (const value233 of Array['from'](existingPreviewNodeIds['keys']())) {
      if (map11['has'](value233)) continue;
      (removeNode(value233, { collect: ![] }), (count12 += 0x1));
    }
    for (const value234 of Array['from'](map7['values']())) {
      if (map11['has'](value234['nodeId'])) continue;
      run34(value234);
    }
    for (const value235 of map8['keys']()) {
      if (!map11['has'](value235)) map8['delete'](value235);
    }
    if (count12 > 0x0) run21();
    return count12;
  }
  function run40(el81) {
    if (!el81) return ![];
    if (el81['classList']?.['contains']?.('selected') || el81['classList']?.['contains']?.('v2-selected'))
      return !![];
    const value236 = typeof document !== 'undefined' ? document['activeElement'] : null;
    return !!(value236 && el81['contains']?.(value236));
  }
  function run41(enabled55, enabled56, value237 = {}) {
    if (!enabled55 || !enabled56) return ![];
    const map12 = value237?.['dragTargets'];
    if (!map12?.['has']?.(enabled55)) return ![];
    const value238 = value237?.['dragContext'] || {};
    if (value238['isDragging'] !== !![] || value238['isCommittingDrag'] === !![]) return ![];
    const toNumber6 = toNumber(value238['pendingDx'], 0x0),
      toNumber7 = toNumber(value238['pendingDy'], 0x0);
    return value238['hasMoved'] === !![] || Math['hypot'](toNumber6, toNumber7) > 0x0;
  }
  function run42(
    value239,
    map13,
    {
      kind: kind = '',
      hasMedia: hasMedia = ![],
      dragTargets: dragTargets = null,
      dragContext: dragContext = null,
      fullEligibleVisible: fullEligibleVisible = ![],
    } = {},
  ) {
    const value240 = retained['has'](String(value239 || '')),
      el82 = getWrapper?.(value239),
      enabled57 = run4(value239, el82),
      value241 = kind === 'image' || kind === 'video',
      enabled58 = enabled57 && value241 && hasMedia ? run3(value239, el82) : !![];
    if (kind === 'video' && enabled57 && hasActiveMountedVideoPlayback(el82))
      return (retained['delete'](String(value239 || '')), run35(value239), ![]);
    if (kind === 'image' && fullEligibleVisible && enabled57 && enabled58)
      return (retained['delete'](String(value239 || '')), run35(value239), ![]);
    if (enabled57 && run41(value239, el82, { dragTargets: dragTargets, dragContext: dragContext }))
      return (run35(value239), ![]);
    if (enabled57 && value241 && hasMedia && enabled58 && isFastPreviewReleasedForPlayback(el82))
      return (run35(value239), ![]);
    if (map13?.['has']?.(value239) || run40(el82)) {
      if (!enabled57) return !![];
      if (hasMedia && value241 && !enabled58) return (run36(value239, el82), !![]);
      return (retained['delete'](String(value239 || '')), run35(value239), ![]);
    }
    if (value240) {
      if (!enabled57) return hasMedia;
      if (hasMedia && value241 && !enabled58) return (run36(value239, el82), !![]);
      return (retained['delete'](String(value239 || '')), run35(value239), ![]);
    }
    if (!enabled57) return !![];
    if ((kind === 'image' || kind === 'video') && !hasMedia) return ![];
    if (hasMedia && value241 && !enabled58) return (run36(value239, el82), !![]);
    run35(value239);
    if (
      el82['classList']?.['contains']?.('v2-node-detail-deferred') ||
      el82['dataset']?.['detailStage'] === 'deferred'
    )
      return !![];
    return ![];
  }
  function run43(value242, value243, value244 = {}) {
    if (
      getPreviewKind(value243) !== 'image' ||
      value244['fullEligibleVisibleImageNodeIds']?.['has']?.(value242) !== !![]
    )
      return ![];
    const value245 = getWrapper?.(value242);
    return !!(run4(value242, value245) && run3(value242, value245));
  }
  function retainNode(enabled59) {
    if (!enabled59) return;
    retained['add'](String(enabled59));
  }
  function isNodePreviewReady(value246, value247 = value122?.[String(value246 || '')]) {
    const el83 = existingPreviewNodeIds['get'](String(value246 || '')),
      previewRasterFrameEl = getPreviewRasterFrameEl(el83);
    if (isPreviewRasterFrameReady(el83)) {
      for (const value248 of [el54, el83, previewRasterFrameEl]) {
        if (!isElementVisible(value248)) return ![];
      }
      return !![];
    }
    const value249 = el83?.['querySelector']?.('.v2-fast-preview-media');
    if (!el83 || el83['isConnected'] === ![] || !isPreviewMediaLoaded(value249)) return ![];
    if (
      String(value249?.['tagName'] || '')['toLowerCase']() === 'img' &&
      typeof value249?.['complete'] === 'boolean' &&
      (value249['complete'] !== !![] || Number(value249['naturalWidth'] || 0x0) <= 0x0)
    )
      return ![];
    for (const value250 of [el54, el83, value249]) {
      if (!isElementVisible(value250)) return ![];
    }
    return isPresentationMediaSourceForNode(value249, value247);
  }
  function isNodePresentationReady(value251, value252 = value122?.[String(value251 || '')]) {
    const value253 = String(value251 || '');
    if (isNodePreviewReady(value253, value252)) return !![];
    const value254 = getWrapper?.(value253);
    return !!(run4(value253, value254) && run3(value253, value254, value252));
  }
  function hasNodePreview(value255) {
    return existingPreviewNodeIds['has'](String(value255 || ''));
  }
  function releaseNode(enabled60) {
    if (!enabled60) return;
    const value256 = getWrapper?.(enabled60);
    if (!run4(enabled60, value256)) return ![];
    return run37(enabled60);
  }
  function syncNodeDragPreview(
    value257,
    {
      dx: dx = 0x0,
      dy: dy = 0x0,
      active: active = ![],
      settle: settle = ![],
      remove: remove = ![],
      rasterFrame: rasterFrame = null,
      existingOnly: existingOnly = ![],
      width: width5,
      height: height5,
    } = {},
  ) {
    const enabled61 = String(value257 || '')['trim']();
    if (!enabled61) return ![];
    if (remove === !![]) return (removeNode(enabled61), !![]);
    let el84 = existingPreviewNodeIds['get'](enabled61),
      value258 = ![];
    const enabled62 = rasterFrame || map8['get'](enabled61) || null;
    if (!el84 && existingOnly && !enabled62) return ![];
    el84 && enabled62 && (map8['delete'](enabled61), attachPreviewRasterFrame(el84, enabled62));
    if (!el84 && active === !![]) {
      const value259 = value123?.['nodes']?.[enabled61],
        value260 = value123?.['canvasEl'] || el54?.['parentNode'] || null;
      if (value259 && value260) {
        const el85 = run31(value260),
          geometry4 = resolveRendererPreviewNodePresentation(value259),
          offsetX4 = syncLayerBounds(el85, [{ geometry: geometry4['geometry'] }], {
            preserveAnchor: !![],
          }) || { offsetX: 0x0, offsetY: 0x0 };
        (run32(value123?.['options']?.['viewport']),
          (el84 = run26(enabled61)),
          (value258 = !![]),
          existingPreviewNodeIds['set'](enabled61, el84),
          el85['appendChild'](el84),
          delete el84['_fastPreviewReused'],
          run2(enabled61, !![]),
          syncPreviewEl(el84, value259, {
            ...geometry4,
            offsetX: offsetX4['offsetX'],
            offsetY: offsetX4['offsetY'],
            mediaLoading: 'eager',
            mediaFetchPriority: 'high',
            mediaCritical: !![],
            mediaDirectWhenBlank: !![],
            mediaFallbackWhileDecoding: !![],
            placeholderReady:
              geometry4['sources']['length'] === 0x0 &&
              geometry4['kind'] !== 'image' &&
              geometry4['kind'] !== 'video',
            preserveInFlightResource: !![],
            scheduleMediaSrc: scheduleMediaSrc2,
            cancelPendingMediaSrc: cancelPendingMediaSrc2,
            onMediaPresented: onMediaPresented2,
          }),
          enabled62 && (map8['delete'](enabled61), attachPreviewRasterFrame(el84, enabled62)),
          syncPreviewConnectionState(el84, value259, value123?.['options']),
          run21());
      }
    }
    if (!el84) return ![];
    if (Number['isFinite'](width5) && width5 > 0x0) el84['style']['width'] = width5 + 'px';
    if (Number['isFinite'](height5) && height5 > 0x0) el84['style']['height'] = height5 + 'px';
    if (active !== !![] && settle === !![]) {
      const value261 = getWrapper?.(enabled61),
        value262 = value123?.['nodes']?.[enabled61],
        previewKind2 = getPreviewKind(value262),
        value263 =
          run4(enabled61, value261) &&
          ((previewKind2 !== 'image' && previewKind2 !== 'video') || run3(enabled61, value261, value262));
      if (value263) return (removeNode(enabled61), !![]);
      return settlePreviewDragState(el84, dx, dy);
    }
    ((el84['_previewDragActive'] = active === !![]),
      (el84['_previewDragDx'] = toNumber(dx, 0x0)),
      (el84['_previewDragDy'] = toNumber(dy, 0x0)));
    const previewDragTransform = applyPreviewDragTransform(el84);
    if (active !== !![]) return previewDragTransform;
    const enabled63 = isNodePreviewReady(enabled61) || el84['dataset']?.['placeholderReady'] === '1';
    return (
      !enabled63 && value258 && removeNode(enabled61, { cache: ![] }),
      previewDragTransform && enabled63
    );
  }
  function sync(canvasEl, enabled64, value264, selected, options16 = {}) {
    const isRendererRuntimeDiagnosticsEnabled2 = isRendererRuntimeDiagnosticsEnabled(),
      value265 = isRendererRuntimeDiagnosticsEnabled2 ? nowPerf() : 0x0,
      nodes = enabled64 && typeof enabled64 === 'object' ? enabled64 : null,
      value266 = value122 !== nodes;
    ((value122 = nodes),
      (value123 = {
        canvasEl: canvasEl || null,
        nodes: nodes,
        options: options16 && typeof options16 === 'object' ? options16 : {},
      }));
    if (value266 && map5['size'] > 0x0)
      for (const value267 of map5['keys']()) {
        if (!enabled64?.[value267]) map5['delete'](value267);
      }
    run8(options16?.['viewportBusy']);
    const viewportBusy4 = run9() || isViewportInteractionBusyForPreview();
    run10(viewportBusy4);
    const previewMotion = run11(options16),
      dragTargets2 = {
        ...options16,
        previewMotion: previewMotion,
        viewportBusy: viewportBusy4,
        availablePreviewNodePoolSize: poolSize['length'],
      },
      preservePaintedMediaOwners2 = viewportBusy4 || previewMotion['zoomChanged'] === !![];
    run38(enabled64, dragTargets2);
    if (!shouldUseFastPreviewLayer(enabled64, value264, options16))
      return clear({ preserveStagedReleases: !![], preserveDragPreviewScene: !![] });
    for (const value268 of Array['from'](existingPreviewNodeIds['keys']())) {
      const value269 = enabled64?.[value268];
      if (!shouldShowGenerationBusyUi(value269)) continue;
      const value270 = getWrapper?.(value268);
      if (
        !run4(value268, value270) &&
        isRendererFastPreviewGeometryVisible(getPreviewGeometry(value269), dragTargets2)
      )
        continue;
      removeNode(value268, { cache: ![], collect: ![] });
    }
    const isPerfProbeEnabled4 = isPerfProbeEnabled(),
      startPerf3 = isPerfProbeEnabled4 ? nowPerf() : 0x0,
      continuationPending = new Set(
        Array['from'](args2?.['candidates'] || [], (value271) => String(value271?.['nodeId'] || ''))[
          'filter'
        ](Boolean),
      ),
      preambleMs = isRendererRuntimeDiagnosticsEnabled2 ? nowPerf() : 0x0,
      candidateSeeds = [],
      map14 =
        value264 instanceof Set
          ? existingPreviewNodeIds['size'] === 0x0
            ? value264
            : new Set(value264)
          : value264 && typeof value264[Symbol['iterator']] === 'function'
            ? new Set(value264)
            : Object['keys'](enabled64 || {});
    if (map14 instanceof Set)
      for (const value272 of existingPreviewNodeIds['keys']()) {
        if (map14['has'](value272)) continue;
        const value273 = enabled64?.[value272],
          value274 = getWrapper?.(value272);
        value273 &&
          !run4(value272, value274) &&
          isRendererFastPreviewGeometryVisible(getPreviewGeometry(value273), dragTargets2) &&
          map14['add'](value272);
      }
    for (const value275 of map14) {
      const node3 = enabled64?.[value275],
        nodeId7 = String(node3?.['id'] || '');
      if (!nodeId7) continue;
      const shouldShowGenerationBusyUi2 = shouldShowGenerationBusyUi(node3);
      let previewGeometry = null;
      if (shouldShowGenerationBusyUi2) {
        const value276 = getWrapper?.(nodeId7);
        previewGeometry = getPreviewGeometry(node3);
        if (run4(nodeId7, value276) || !isRendererFastPreviewGeometryVisible(previewGeometry, dragTargets2)) {
          removeNode(nodeId7, { cache: ![], collect: ![] });
          continue;
        }
      }
      if (isWebPreviewNode(node3)) continue;
      const nodeBizRev = Number['isFinite'](Number(node3?.['_bizRev'])) ? Number(node3['_bizRev']) : null;
      let text3 = map5['get'](nodeId7);
      if (nodeBizRev === null || !text3 || text3['nodeBizRev'] !== nodeBizRev) {
        const kind6 = getPreviewKind(node3),
          sourcesDisplayFirst = dragTargets2['deferVisibleMediaSrc'] === !![];
        text3 = {
          kind: kind6,
          nodeBizRev: nodeBizRev,
          hasMediaHint: hasPreviewMediaHint(node3, kind6),
          sourcesDisplayFirst: sourcesDisplayFirst
            ? null
            : getPreviewMediaUrls(node3, kind6, { displayFirst: !![] }),
          sourcesThumbnailFirst: sourcesDisplayFirst
            ? null
            : getPreviewMediaUrls(node3, kind6, { displayFirst: ![] }),
          text: sourcesDisplayFirst ? null : getPreviewText(node3, kind6),
        };
        if (nodeBizRev === null) map5['delete'](nodeId7);
        else map5['set'](nodeId7, text3);
      }
      const kind7 = text3['kind'],
        fullEligibleVisible2 =
          kind7 === 'image' && dragTargets2['fullEligibleVisibleImageNodeIds']?.['has']?.(nodeId7) === !![],
        fullEligiblePreview =
          kind7 === 'image' &&
          (fullEligibleVisible2 ||
            dragTargets2['fullEligiblePreviewImageNodeIds']?.['has']?.(nodeId7) === !![]),
        value277 = fullEligiblePreview ? text3['sourcesDisplayFirst'] : text3['sourcesThumbnailFirst'],
        deferredDescriptorSources = !Array['isArray'](value277),
        sources5 = deferredDescriptorSources ? [] : value277,
        hasMedia2 = deferredDescriptorSources ? text3['hasMediaHint'] === !![] : sources5['length'] > 0x0;
      if (
        !run42(nodeId7, selected, {
          kind: kind7,
          hasMedia: hasMedia2,
          dragTargets: dragTargets2['dragTargets'],
          dragContext: dragTargets2['dragContext'],
          fullEligibleVisible: fullEligibleVisible2,
        })
      )
        continue;
      const mounted = run4(nodeId7),
        geometry5 = previewGeometry || getPreviewGeometry(node3);
      candidateSeeds['push']({
        node: node3,
        nodeId: nodeId7,
        kind: kind7,
        sources: sources5,
        hasMediaHint: hasMedia2,
        deferredDescriptorSources: deferredDescriptorSources,
        text: text3['text'],
        geometry: geometry5,
        selected: selected?.['has']?.(nodeId7) === !![],
        fullEligibleVisible: fullEligibleVisible2,
        fullEligiblePreview: fullEligiblePreview,
        retained: retained['has'](nodeId7),
        continuationPending: continuationPending['has'](nodeId7),
        mounted: mounted,
      });
    }
    const candidateSeedMs = isRendererRuntimeDiagnosticsEnabled2 ? nowPerf() : 0x0,
      mediaSrcBatchLimit2 = planRendererFastPreviewAdmission({
        candidateSeeds: candidateSeeds,
        existingPreviewNodeIds: existingPreviewNodeIds,
        options: dragTargets2,
      }),
      admissionMs = isRendererRuntimeDiagnosticsEnabled2 ? nowPerf() : 0x0,
      list24 = mediaSrcBatchLimit2['candidates'];
    if (list24['length'] === 0x0) {
      let value278 = ![];
      for (const value279 of Array['from'](existingPreviewNodeIds['keys']())) {
        const value280 = enabled64?.[value279];
        if (run43(value279, value280, dragTargets2)) {
          removeNode(value279, { cache: ![], collect: ![] });
          continue;
        }
        const value281 = getWrapper?.(value279),
          enabled65 = run4(value279, value281);
        if (
          !enabled65 &&
          value280 &&
          isRendererFastPreviewGeometryVisible(getPreviewGeometry(value280), dragTargets2)
        ) {
          value278 = !![];
          continue;
        }
        const enabled66 = enabled65 && run37(value279, { collect: ![] });
        if (!enabled66) removeNode(value279, { collect: ![] });
      }
      run21();
      if (value278) return;
      if (map7['size'] > 0x0) return;
      return clear({ preserveStagedReleases: !![], preserveDragPreviewScene: !![] });
    }
    const layer = run31(canvasEl);
    if (!layer) return;
    run32(dragTargets2['viewport']);
    const layerBounds = syncLayerBounds(layer, list24, { preserveAnchor: viewportBusy4 }) || {
      offsetX: 0x0,
      offsetY: 0x0,
    };
    (run18(), (generation += 0x1));
    const map15 = mediaSrcBatchLimit2['liveIds'],
      candidateCount = mediaSrcBatchLimit2['candidates'],
      mediaPlan = mediaSrcBatchLimit2['mediaPlan'];
    if (mediaPlan['explicitMediaSourceOwnerIds'] !== null) {
      const args4 = new Set();
      for (const value282 of existingPreviewNodeIds['keys']()) {
        if (map15['has'](value282)) continue;
        const value283 = enabled64?.[value282],
          value284 = getWrapper?.(value282);
        value283 &&
          !run4(value282, value284) &&
          isRendererFastPreviewGeometryVisible(getPreviewGeometry(value283), dragTargets2) &&
          args4['add'](value282);
      }
      reconcileMediaSourceOwners(
        new Set([...mediaPlan['explicitMediaSourceOwnerIds'], ...mediaPlan['nodeIdsWithMedia'], ...args4]),
        { preservePaintedMediaOwners: preservePaintedMediaOwners2 },
      );
    }
    const mediaLoading3 = mediaPlan['lowPriority'] ? 'lazy' : 'eager',
      mediaFetchPriority2 = mediaPlan['lowPriority'] ? 'auto' : 'high',
      immediateMediaSrcLimit = mediaSrcBatchLimit2['immediateMediaSrcLimit'],
      requiredImmediateMediaSourceOwnerIds =
        dragTargets2['requiredImmediateMediaSourceOwnerIds'] != null &&
        typeof dragTargets2['requiredImmediateMediaSourceOwnerIds']?.[Symbol['iterator']] === 'function'
          ? new Set(
              Array['from'](dragTargets2['requiredImmediateMediaSourceOwnerIds'], (value285) =>
                String(value285 || ''),
              )['filter'](Boolean),
            )
          : null;
    if (!viewportBusy4) {
      ((value117 = Number['POSITIVE_INFINITY']), (value118 = Number['POSITIVE_INFINITY']));
      if (pendingMediaSrcCount['length'] > 0x0) run15();
    }
    const args5 = {
        candidates: [],
        generation: generation,
        immediateMediaSrcSlotsRef: {
          value: viewportBusy4 ? Math['min'](value117, immediateMediaSrcLimit) : immediateMediaSrcLimit,
        },
        immediateMediaSrcLimit: immediateMediaSrcLimit,
        immediateVideoMediaSrcSlotsRef: {
          value: viewportBusy4
            ? Math['min'](value118, mediaSrcBatchLimit2['immediateVideoMediaSrcLimit'])
            : mediaSrcBatchLimit2['immediateVideoMediaSrcLimit'],
        },
        mediaSrcBatchLimit: mediaSrcBatchLimit2['mediaSrcBatchLimit'],
        videoMediaSrcBatchLimit: mediaSrcBatchLimit2['videoMediaSrcBatchLimit'],
        createBatchSize: mediaSrcBatchLimit2['createBatchSize'],
        layer: layer,
        layerBounds: layerBounds,
        mediaFetchPriority: mediaFetchPriority2,
        mediaLoading: mediaLoading3,
        mediaPlan: mediaPlan,
        options: dragTargets2,
        pendingMediaPriorityChanged: ![],
        preservePaintedMediaOwners: preservePaintedMediaOwners2,
        requiredImmediateMediaSourceOwnerIds: requiredImmediateMediaSourceOwnerIds,
        visibleMediaCandidateCount: mediaSrcBatchLimit2['visibleMediaCandidateCount'],
        viewportBusy: viewportBusy4,
        mountFragment: mountFragment(),
      },
      candidates = mediaSrcBatchLimit2['deferredCandidates'],
      commitSetupMs = isRendererRuntimeDiagnosticsEnabled2 ? nowPerf() : 0x0;
    let createdCount3 = 0x0,
      imageCount2 = 0x0,
      reusedCount3 = 0x0,
      srcAssignedCount4 = 0x0;
    for (const value286 of mediaSrcBatchLimit2['immediateCandidates']) {
      const value287 = run28(value286, args5);
      ((createdCount3 += Number(value287?.['createdCount'] || 0x0)),
        (imageCount2 += Number(value287?.['imageCount'] || 0x0)),
        (reusedCount3 += Number(value287?.['reusedCount'] || 0x0)),
        (srcAssignedCount4 += Number(value287?.['srcAssignedCount'] || 0x0)));
    }
    run27(args5);
    const immediateSyncMs = isRendererRuntimeDiagnosticsEnabled2 ? nowPerf() : 0x0;
    args5['pendingMediaPriorityChanged'] && (run14(), (args5['pendingMediaPriorityChanged'] = ![]));
    viewportBusy4 &&
      ((value117 = Math['min'](value117, Math['max'](0x0, args5['immediateMediaSrcSlotsRef']['value']))),
      (value118 = Math['min'](value118, Math['max'](0x0, args5['immediateVideoMediaSrcSlotsRef']['value']))));
    let removedCount = 0x0;
    for (const value288 of Array['from'](existingPreviewNodeIds['keys']())) {
      if (!map15['has'](value288)) {
        const value289 = enabled64?.[value288];
        if (run43(value288, value289, dragTargets2)) {
          (removeNode(value288, { cache: ![], collect: ![] }), (removedCount += 0x1));
          continue;
        }
        const value290 = getWrapper?.(value288),
          enabled67 = run4(value288, value290);
        if (
          !enabled67 &&
          value289 &&
          isRendererFastPreviewGeometryVisible(getPreviewGeometry(value289), dragTargets2)
        ) {
          map15['add'](value288);
          continue;
        }
        const enabled68 = enabled67 && run37(value288, { collect: ![] });
        if (!enabled68) removeNode(value288, { collect: ![] });
        removedCount += 0x1;
      }
    }
    candidates['length'] > 0x0 && ((args2 = { ...args5, candidates: candidates }), (value121 = run5(run30)));
    run21();
    if (isRendererRuntimeDiagnosticsEnabled2) {
      const cleanupMs = nowPerf();
      recordRendererRuntimeDiagnostic({
        kind: 'renderer-fast-preview-stages',
        mode: options16?.['mode'] || 'steady',
        candidateSeedCount: candidateSeeds['length'],
        candidateCount: candidateCount['length'],
        immediateCandidateCount: mediaSrcBatchLimit2['immediateCandidates']['length'],
        deferredCandidateCount: candidates['length'],
        preambleMs: preambleMs - value265,
        candidateSeedMs: candidateSeedMs - preambleMs,
        admissionMs: admissionMs - candidateSeedMs,
        commitSetupMs: commitSetupMs - admissionMs,
        immediateSyncMs: immediateSyncMs - commitSetupMs,
        cleanupMs: cleanupMs - immediateSyncMs,
        durationMs: cleanupMs - value265,
      });
    }
    if (isPerfProbeEnabled4) {
      const endPerf3 = nowPerf();
      recordFastPreviewSample('sync-immediate', endPerf3 - startPerf3, {
        candidateCount: candidateCount['length'],
        createdCount: createdCount3,
        endPerf: endPerf3,
        imageCount: imageCount2,
        pendingCreateCount: candidates['length'],
        pendingMediaSrcCount: pendingMediaSrcCount['length'],
        poolSize: poolSize['length'],
        removedCount: removedCount,
        reusedCount: reusedCount3,
        srcAssignedCount: srcAssignedCount4,
        startPerf: startPerf3,
        zoom: options16?.['viewport']?.['zoom'],
      });
    }
  }
  return {
    clear: clear,
    discardNode: discardNode,
    getStats: () => ({ ...args3 }),
    hasNodePreview: hasNodePreview,
    isNodePresentationReady: isNodePresentationReady,
    isNodePreviewReady: isNodePreviewReady,
    releaseNode: releaseNode,
    removeNode: removeNode,
    prune: prune,
    reconcileMediaSourceOwners: reconcileMediaSourceOwners,
    retainNode: retainNode,
    stageRasterHandoffFrame: stageRasterHandoffFrame,
    sync: sync,
    syncNodeDragPreview: syncNodeDragPreview,
  };
}
