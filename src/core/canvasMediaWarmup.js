import { isNodeInsideViewportPadding } from './rendererVirtualization.js';
import {
  resolveCanvasImageDisplayUrl,
  resolveCanvasImageLowZoomUrl,
  resolveCanvasImageThumbUrl,
  resolveCanvasVideoUrl,
  toCanvasLocalUrl,
} from '../services/canvasMediaLocalService.js';
import { cancelQueuedCanvasImagePreloads, preloadCanvasImage } from '../modules/canvasMediaScheduler.js';
import { statLocalMediaOnServer } from '../../api/projectsV2Api.js';
import {
  clearLocalVideoPlaybackWarmupScope,
  syncLocalVideoPlaybackWarmupSources,
} from '../services/localVideoPlaybackObjectUrlService.js';
import { desktopBridge } from '../services/desktopBridge.js';
import { isTaskFailed } from './generationTaskUiState.js';
const DEFAULT_CONTAINER_WIDTH = 0x640,
  DEFAULT_CONTAINER_HEIGHT = 0x384,
  DEFAULT_WARMUP_PADDING = 0x384,
  DEFAULT_MAX_WARMUP_JOBS = 0xf0,
  LOW_ZOOM_WARMUP_JOB_LIMIT = 0x48,
  VERY_LOW_ZOOM_WARMUP_JOB_LIMIT = 0x28,
  LOW_ZOOM_WARMUP_THRESHOLD = 0.45,
  VERY_LOW_ZOOM_WARMUP_THRESHOLD = 0.28,
  HIGH_ZOOM_STALE_WARMUP_CANCEL_PRIORITY_LIMIT = 0x96,
  CANVAS_MEDIA_WARMUP_SCOPE = 'canvas-visible-media-warmup',
  CANVAS_VIDEO_WARMUP_SCOPE = 'canvas-low-zoom-video-warmup',
  LOW_ZOOM_VIDEO_WARMUP_LIMIT = 0x3,
  LOW_ZOOM_VIDEO_WARMUP_MAX_BYTES = 0x8 * 0x400 * 0x400,
  LOW_ZOOM_VIDEO_STAT_CONCURRENCY = 0x2,
  VIDEO_STAT_TRUE_CACHE_TTL_MS = 0x1e * 0x3e8,
  VIDEO_STAT_FALSE_CACHE_TTL_MS = 0x3 * 0x3e8,
  videoStatCache = new Map(),
  videoStatProbeBySource = new Map();
let videoStatProbeQueue = [],
  activeVideoStatProbeCount = 0x0,
  videoWarmupRevision = 0x0,
  latestVideoWarmupContext = null;
function normalizeNodes(_0x252ea8) {
  if (Array['isArray'](_0x252ea8)) return _0x252ea8;
  if (_0x252ea8 && typeof _0x252ea8 === 'object') return Object['values'](_0x252ea8);
  return [];
}
function normalizeViewport(_0x5b04ea) {
  return {
    x: Number['isFinite'](Number(_0x5b04ea?.['x'])) ? Number(_0x5b04ea['x']) : 0x0,
    y: Number['isFinite'](Number(_0x5b04ea?.['y'])) ? Number(_0x5b04ea['y']) : 0x0,
    zoom:
      Number['isFinite'](Number(_0x5b04ea?.['zoom'])) && Number(_0x5b04ea['zoom']) > 0x0
        ? Number(_0x5b04ea['zoom'])
        : 0x1,
  };
}
function shouldUseSharedVideoBlobWarmup() {
  const _0xce500c = String(
    globalThis['location']?.['search'] || globalThis['window']?.['location']?.['search'] || '',
  );
  if (new URLSearchParams(_0xce500c)['get']('aicRuntime') === 'chrome-shell') return !![];
  return !desktopBridge['mediaPreview']['isAvailable']();
}
function getElementSize(_0x20bf2f) {
  return {
    width: Math['max'](0x1, Math['round'](Number(_0x20bf2f?.['clientWidth']) || DEFAULT_CONTAINER_WIDTH)),
    height: Math['max'](0x1, Math['round'](Number(_0x20bf2f?.['clientHeight']) || DEFAULT_CONTAINER_HEIGHT)),
  };
}
function getViewportWorldCenter(_0xbf12e9, _0x77a5da, _0x5a7583) {
  const _0x597398 = Math['max'](0.0001, Number(_0xbf12e9?.['zoom']) || 0x1),
    _0x12d38d = Number['isFinite'](Number(_0xbf12e9?.['x'])) ? Number(_0xbf12e9['x']) : 0x0,
    _0xec0a9b = Number['isFinite'](Number(_0xbf12e9?.['y'])) ? Number(_0xbf12e9['y']) : 0x0;
  return {
    x: ((0x0 - _0x12d38d) / _0x597398 + (_0x77a5da - _0x12d38d) / _0x597398) / 0x2,
    y: ((0x0 - _0xec0a9b) / _0x597398 + (_0x5a7583 - _0xec0a9b) / _0x597398) / 0x2,
  };
}
function getNodeCenterDistanceSq(_0x3c350d, _0x296fb1) {
  const _0x51809e = Number['isFinite'](Number(_0x3c350d?.['x'])) ? Number(_0x3c350d['x']) : 0x0,
    _0x2e78c0 = Number['isFinite'](Number(_0x3c350d?.['y'])) ? Number(_0x3c350d['y']) : 0x0,
    _0x197286 = Math['max'](0x1, Number(_0x3c350d?.['width']) || 0xa0),
    _0x1f73d4 = Math['max'](0x1, Number(_0x3c350d?.['height']) || 0x78),
    _0x2868e7 = _0x51809e + _0x197286 / 0x2 - _0x296fb1['x'],
    _0x3c25fb = _0x2e78c0 + _0x1f73d4 / 0x2 - _0x296fb1['y'];
  return _0x2868e7 * _0x2868e7 + _0x3c25fb * _0x3c25fb;
}
function normalizeSelectedNodeIds(_0xd5d4bb, _0x24721b) {
  const _0xbd3ec8 =
    _0x24721b instanceof Set || Array['isArray'](_0x24721b) ? _0x24721b : _0xd5d4bb?.['selectedNodeIds'];
  return new Set(
    Array['from'](_0xbd3ec8 || [])
      ['map']((_0x1b60e9) => String(_0x1b60e9 || ''))
      ['filter'](Boolean),
  );
}
function getDistancePriorityBoost(_0x23ddfb, _0x2d88da, _0xaead2e, _0x589f72) {
  const _0x5cdb9b = Math['max'](0.0001, Number(_0x2d88da?.['zoom']) || 0x1),
    _0x559a01 = Math['max'](_0xaead2e / _0x5cdb9b, _0x589f72 / _0x5cdb9b, 0x1),
    _0x548dd0 = Math['sqrt'](Math['max'](0x0, _0x23ddfb)) / _0x559a01;
  return Math['max'](0x0, Math['round'](0x12 - _0x548dd0 * 0x12));
}
function getEffectiveWarmupMaxJobs(_0x4a85aa, _0x44bcb5) {
  const _0xe964b5 = Math['max'](0x0, Math['round'](Number(_0x4a85aa) || 0x0)),
    _0x411515 = Number(_0x44bcb5?.['zoom']);
  if (!Number['isFinite'](_0x411515) || _0x411515 <= 0x0) return _0xe964b5;
  if (_0x411515 <= VERY_LOW_ZOOM_WARMUP_THRESHOLD)
    return Math['min'](_0xe964b5, VERY_LOW_ZOOM_WARMUP_JOB_LIMIT);
  if (_0x411515 <= LOW_ZOOM_WARMUP_THRESHOLD) return Math['min'](_0xe964b5, LOW_ZOOM_WARMUP_JOB_LIMIT);
  return _0xe964b5;
}
function isWarmupUrl(_0x13895f) {
  const _0xd3923 = String(_0x13895f || '')['trim']();
  if (!_0xd3923) return ![];
  if (/^https?:\/\//i['test'](_0xd3923)) return ![];
  return (
    _0xd3923['startsWith']('/') ||
    _0xd3923['startsWith']('data:image/') ||
    _0xd3923['startsWith']('blob:') ||
    _0xd3923['startsWith']('aic-local-preview:')
  );
}
function isLikelyVideoUrl(_0x350ba4) {
  return /\.(?:mp4|mov|webm|m4v|avi|mkv)(?:[?#].*)?$/i['test'](String(_0x350ba4 || '')['trim']());
}
function toWarmupUrl(_0x5b42fa) {
  const _0x5b5544 = String(_0x5b42fa || '')['trim']();
  if (!_0x5b5544) return '';
  if (isWarmupUrl(_0x5b5544)) return _0x5b5544;
  return toCanvasLocalUrl(_0x5b5544);
}
function pushWarmupJob(_0x48718b, _0x1d4e7b, _0x1a5d51, _0x27aa27, _0x1093ae, _0x1107a9, _0x1977af = {}) {
  const _0x3bc1fe = toWarmupUrl(_0x1a5d51);
  if (!isWarmupUrl(_0x3bc1fe) || _0x1d4e7b['has'](_0x3bc1fe)) return;
  if (isLikelyVideoUrl(_0x3bc1fe)) return;
  (_0x1d4e7b['add'](_0x3bc1fe),
    _0x48718b['push']({
      url: _0x3bc1fe,
      priority: _0x27aa27,
      nodeId: String(_0x1093ae || ''),
      reason: _0x1107a9,
      distanceSq: Number['isFinite'](Number(_0x1977af['distanceSq'])) ? Number(_0x1977af['distanceSq']) : 0x0,
      visible: _0x1977af['visible'] === !![],
      selected: _0x1977af['selected'] === !![],
      fetchPriority: _0x1977af['fetchPriority'] === 'high' ? 'high' : 'auto',
      allowWhenPaused: _0x1977af['allowWhenPaused'] === !![],
      deferWhenPaused: _0x1977af['deferWhenPaused'] === ![] ? ![] : !![],
      order: _0x48718b['length'],
    }));
}
function getPrimaryListItem(_0x5ff170, _0xcef297 = 0x0) {
  if (!Array['isArray'](_0x5ff170) || _0x5ff170['length'] === 0x0) return null;
  const _0x2e05e7 = Number['isFinite'](Number(_0xcef297))
    ? Math['max'](0x0, Math['trunc'](Number(_0xcef297)))
    : 0x0;
  return _0x5ff170[_0x2e05e7] || _0x5ff170[0x0] || null;
}
function getKnownMediaSizeBytes(..._0x2e83f5) {
  for (const _0x97620c of _0x2e83f5) {
    for (const _0x2c2c7f of [
      _0x97620c?.['fileSize'],
      _0x97620c?.['sizeBytes'],
      _0x97620c?.['byteSize'],
      _0x97620c?.['contentLength'],
    ]) {
      const _0x5156e5 = Number(_0x2c2c7f || 0x0);
      if (Number['isFinite'](_0x5156e5) && _0x5156e5 > 0x0) return _0x5156e5;
    }
  }
  return 0x0;
}
function addImageWarmupJobs(
  _0x487a4f,
  _0x2fa280,
  _0x945b0f,
  {
    primary: primary = !![],
    priorityOffset: priorityOffset = 0x0,
    includeFull: includeFull = ![],
    meta: meta = {},
  } = {},
) {
  const _0x3cf12a = primary ? 0x14 : 0x0,
    _0x50089d = resolveCanvasImageDisplayUrl(_0x945b0f),
    _0x3e2724 = resolveCanvasImageThumbUrl(_0x945b0f);
  (includeFull &&
    _0x50089d &&
    _0x50089d !== _0x3e2724 &&
    pushWarmupJob(
      _0x487a4f,
      _0x2fa280,
      _0x50089d,
      0x82 + _0x3cf12a + priorityOffset,
      _0x945b0f?.['id'],
      primary ? 'image-display-primary' : 'image-display-nearby',
      { ...meta, fetchPriority: 'high', allowWhenPaused: !![], deferWhenPaused: ![] },
    ),
    pushWarmupJob(
      _0x487a4f,
      _0x2fa280,
      _0x3e2724 || resolveCanvasImageLowZoomUrl(_0x945b0f),
      0x5a + _0x3cf12a + priorityOffset,
      _0x945b0f?.['id'],
      primary ? 'image-thumb-primary' : 'image-thumb-nearby',
      meta,
    ),
    pushWarmupJob(
      _0x487a4f,
      _0x2fa280,
      _0x3e2724,
      0x46 + _0x3cf12a + priorityOffset,
      _0x945b0f?.['id'],
      primary ? 'image-thumb-dedupe-primary' : 'image-thumb-dedupe-nearby',
      meta,
    ));
}
function addVideoPosterWarmupJobs(
  _0x1223b3,
  _0x3ffe7f,
  _0xd98391,
  { primary: primary = !![], priorityOffset: priorityOffset = 0x0, meta: meta = {} } = {},
) {
  const _0x2b1081 = (primary ? 0x5f : 0x46) + priorityOffset;
  for (const _0x417681 of [
    _0xd98391?.['posterLocalPath'],
    _0xd98391?.['thumbLocalPath'],
    _0xd98391?.['posterUrl'],
    _0xd98391?.['thumbUrl'],
    _0xd98391?.['videoThumbSrc'],
    _0xd98391?.['capturePreviewUrl'],
  ]) {
    pushWarmupJob(_0x1223b3, _0x3ffe7f, _0x417681, _0x2b1081, _0xd98391?.['id'], 'video-poster', meta);
  }
}
function shouldWarmupVideoPosterAtViewport(_0x431939, _0x1fff19) {
  const _0x59a5dd = Number(_0x1fff19?.['zoom']);
  if (!Number['isFinite'](_0x59a5dd) || _0x59a5dd > LOW_ZOOM_WARMUP_THRESHOLD) return !![];
  return _0x431939?.['visible'] === !![] || _0x431939?.['selected'] === !![];
}
function collectCanvasNearbyVideoWarmupCandidates({
  canvas: canvas = null,
  nodes: nodes = canvas?.['nodes'],
  viewport: viewport = canvas?.['viewport'],
  containerWidth: containerWidth = DEFAULT_CONTAINER_WIDTH,
  containerHeight: containerHeight = DEFAULT_CONTAINER_HEIGHT,
  padding: padding = DEFAULT_WARMUP_PADDING,
  selectedNodeIds: selectedNodeIds = canvas?.['selectedNodeIds'],
  maxVideos: maxVideos = LOW_ZOOM_VIDEO_WARMUP_LIMIT,
} = {}) {
  const _0x3721a4 = normalizeViewport(viewport);
  if (_0x3721a4['zoom'] > LOW_ZOOM_WARMUP_THRESHOLD || !shouldUseSharedVideoBlobWarmup()) return [];
  const _0x47e94a = normalizeSelectedNodeIds(canvas, selectedNodeIds),
    _0x29bc9e = getViewportWorldCenter(_0x3721a4, containerWidth, containerHeight),
    _0x529b6f = [];
  for (const _0x366a32 of normalizeNodes(nodes)) {
    if (!_0x366a32?.['id'] || String(_0x366a32['type'] || '')['toLowerCase']() !== 'ai-video') continue;
    if (isTaskFailed(_0x366a32)) continue;
    if (!isNodeInsideViewportPadding(_0x366a32, _0x3721a4, containerWidth, containerHeight, padding))
      continue;
    const _0x26b39a = Array['isArray'](_0x366a32['videos']) ? _0x366a32['videos'] : [],
      _0x3c9ef9 = getPrimaryListItem(_0x26b39a, _0x366a32['mainVideoIndex']),
      _0x481e43 = resolveCanvasVideoUrl(_0x3c9ef9 || {}) || resolveCanvasVideoUrl(_0x366a32);
    if (!_0x481e43) continue;
    _0x529b6f['push']({
      nodeId: String(_0x366a32['id']),
      sourceUrl: _0x481e43,
      knownSizeBytes: getKnownMediaSizeBytes(_0x3c9ef9, _0x366a32),
      selected: _0x47e94a['has'](String(_0x366a32['id'])),
      visible: isNodeInsideViewportPadding(_0x366a32, _0x3721a4, containerWidth, containerHeight, 0x0),
      distanceSq: getNodeCenterDistanceSq(_0x366a32, _0x29bc9e),
      order: _0x529b6f['length'],
    });
  }
  _0x529b6f['sort']((_0x439872, _0x2168b9) => {
    if (_0x439872['selected'] !== _0x2168b9['selected']) return _0x439872['selected'] ? -0x1 : 0x1;
    if (_0x439872['visible'] !== _0x2168b9['visible']) return _0x439872['visible'] ? -0x1 : 0x1;
    if (_0x439872['distanceSq'] !== _0x2168b9['distanceSq'])
      return _0x439872['distanceSq'] - _0x2168b9['distanceSq'];
    return _0x439872['order'] - _0x2168b9['order'];
  });
  const _0x19cae8 = Math['max'](
      0x0,
      Math['min'](LOW_ZOOM_VIDEO_WARMUP_LIMIT, Math['trunc'](Number(maxVideos) || 0x0)),
    ),
    _0x3c6f0a = [],
    _0x273e16 = new Set();
  for (const _0x1934ee of _0x529b6f) {
    if (_0x273e16['has'](_0x1934ee['sourceUrl'])) continue;
    (_0x273e16['add'](_0x1934ee['sourceUrl']), _0x3c6f0a['push'](_0x1934ee));
    if (_0x3c6f0a['length'] >= _0x19cae8) break;
  }
  return _0x3c6f0a;
}
function readCachedVideoStat(_0x5e8b91) {
  const _0x1f5e5a = videoStatCache['get'](_0x5e8b91);
  if (!_0x1f5e5a) return null;
  if (Number(_0x1f5e5a['expiresAt'] || 0x0) <= Date['now']())
    return (videoStatCache['delete'](_0x5e8b91), null);
  return _0x1f5e5a['stat'];
}
function rememberVideoStat(_0xfa0a0d, _0x35ac1a) {
  const _0x3f4144 = {
    exists: _0x35ac1a?.['exists'] === !![],
    sizeBytes:
      Number['isSafeInteger'](Number(_0x35ac1a?.['sizeBytes'])) && Number(_0x35ac1a['sizeBytes']) >= 0x0
        ? Number(_0x35ac1a['sizeBytes'])
        : 0x0,
  };
  return (
    videoStatCache['set'](_0xfa0a0d, {
      stat: _0x3f4144,
      expiresAt:
        Date['now']() + (_0x3f4144['exists'] ? VIDEO_STAT_TRUE_CACHE_TTL_MS : VIDEO_STAT_FALSE_CACHE_TTL_MS),
    }),
    _0x3f4144
  );
}
function drainVideoStatProbeQueue() {
  while (activeVideoStatProbeCount < LOW_ZOOM_VIDEO_STAT_CONCURRENCY && videoStatProbeQueue['length'] > 0x0) {
    const _0x12b4bc = videoStatProbeQueue['shift']();
    if (!_0x12b4bc || videoStatProbeBySource['get'](_0x12b4bc['sourceUrl']) !== _0x12b4bc) continue;
    ((_0x12b4bc['active'] = !![]),
      (activeVideoStatProbeCount += 0x1),
      void statLocalMediaOnServer(_0x12b4bc['sourceUrl'])
        ['then']((_0x4d95bb) => rememberVideoStat(_0x12b4bc['sourceUrl'], _0x4d95bb))
        ['catch'](() => rememberVideoStat(_0x12b4bc['sourceUrl'], { exists: ![], sizeBytes: 0x0 }))
        ['then'](_0x12b4bc['resolve'])
        ['finally'](() => {
          ((_0x12b4bc['active'] = ![]),
            (activeVideoStatProbeCount = Math['max'](0x0, activeVideoStatProbeCount - 0x1)),
            videoStatProbeBySource['get'](_0x12b4bc['sourceUrl']) === _0x12b4bc &&
              videoStatProbeBySource['delete'](_0x12b4bc['sourceUrl']),
            drainVideoStatProbeQueue());
        }));
  }
}
function probeVideoStat(_0x1d53e1) {
  const _0x18ee0b = readCachedVideoStat(_0x1d53e1);
  if (_0x18ee0b) return Promise['resolve'](_0x18ee0b);
  const _0x565bbc = videoStatProbeBySource['get'](_0x1d53e1);
  if (_0x565bbc) return _0x565bbc['promise'];
  let _0x23ae87;
  const _0x4cd491 = new Promise((_0x3c97a1) => {
      _0x23ae87 = _0x3c97a1;
    }),
    _0x2f9db1 = { sourceUrl: _0x1d53e1, promise: _0x4cd491, resolve: _0x23ae87, active: ![] };
  return (
    videoStatProbeBySource['set'](_0x1d53e1, _0x2f9db1),
    videoStatProbeQueue['push'](_0x2f9db1),
    drainVideoStatProbeQueue(),
    _0x4cd491
  );
}
function resolveEligibleVideoWarmupSources(_0x159ddc) {
  const _0x32a39d = [];
  for (const _0x5c6032 of _0x159ddc) {
    const _0x493e8e = readCachedVideoStat(_0x5c6032['sourceUrl']),
      _0x4b1a13 =
        _0x5c6032['knownSizeBytes'] > 0x0
          ? _0x5c6032['knownSizeBytes']
          : _0x493e8e?.['exists'] === !![]
            ? Number(_0x493e8e['sizeBytes'] || 0x0)
            : 0x0;
    _0x4b1a13 > 0x0 &&
      _0x4b1a13 <= LOW_ZOOM_VIDEO_WARMUP_MAX_BYTES &&
      _0x32a39d['push'](_0x5c6032['sourceUrl']);
  }
  return _0x32a39d;
}
function applyLatestVideoWarmup(_0x405ee6) {
  if (_0x405ee6 !== videoWarmupRevision || !latestVideoWarmupContext) return null;
  const _0xbe5580 = collectCanvasNearbyVideoWarmupCandidates(latestVideoWarmupContext);
  return syncLocalVideoPlaybackWarmupSources(resolveEligibleVideoWarmupSources(_0xbe5580), {
    scope: CANVAS_VIDEO_WARMUP_SCOPE,
    maxSources: LOW_ZOOM_VIDEO_WARMUP_LIMIT,
  });
}
export function collectCanvasNearbyVideoWarmupSources(_0x17971b = {}) {
  return resolveEligibleVideoWarmupSources(collectCanvasNearbyVideoWarmupCandidates(_0x17971b));
}
export function syncCanvasNearbyVideoWarmup({ canvas: canvas = null, containerEl: containerEl = null } = {}) {
  const _0x313bc8 = getElementSize(containerEl),
    _0xa709d8 = ++videoWarmupRevision;
  latestVideoWarmupContext = {
    canvas: canvas,
    containerWidth: _0x313bc8['width'],
    containerHeight: _0x313bc8['height'],
  };
  const _0x41389c = collectCanvasNearbyVideoWarmupCandidates(latestVideoWarmupContext),
    _0x95d082 = applyLatestVideoWarmup(_0xa709d8) || { sources: [], scheduledCount: 0x0 },
    _0x268380 = _0x41389c['filter'](
      (_0x2bd45f) => !(_0x2bd45f['knownSizeBytes'] > 0x0) && !readCachedVideoStat(_0x2bd45f['sourceUrl']),
    );
  return (
    _0x268380['length'] > 0x0 &&
      void Promise['all'](_0x268380['map']((_0x5ef14b) => probeVideoStat(_0x5ef14b['sourceUrl'])))['then'](
        () => {
          applyLatestVideoWarmup(_0xa709d8);
        },
      ),
    { ..._0x95d082, pendingProbeCount: _0x268380['length'] }
  );
}
export function clearCanvasNearbyVideoWarmup() {
  return (
    (videoWarmupRevision += 0x1),
    (latestVideoWarmupContext = null),
    clearLocalVideoPlaybackWarmupScope(CANVAS_VIDEO_WARMUP_SCOPE)
  );
}
export const __canvasMediaWarmupForTest = {
  snapshot() {
    return {
      activeVideoStatProbeCount: activeVideoStatProbeCount,
      queuedVideoStatProbeCount: videoStatProbeQueue['length'],
      probedSources: Array['from'](videoStatCache['keys']()),
      revision: videoWarmupRevision,
    };
  },
  clearVideoStatState() {
    ((videoWarmupRevision += 0x1), (latestVideoWarmupContext = null), videoStatCache['clear']());
    const _0x2c4347 = videoStatProbeQueue;
    videoStatProbeQueue = [];
    for (const _0x159671 of _0x2c4347) {
      !_0x159671['active'] &&
        videoStatProbeBySource['get'](_0x159671['sourceUrl']) === _0x159671 &&
        (videoStatProbeBySource['delete'](_0x159671['sourceUrl']),
        _0x159671['resolve']({ exists: ![], sizeBytes: 0x0 }));
    }
  },
};
export function collectCanvasVisibleMediaWarmupJobs({
  canvas: canvas = null,
  nodes: nodes = canvas?.['nodes'],
  viewport: viewport = canvas?.['viewport'],
  containerWidth: containerWidth = DEFAULT_CONTAINER_WIDTH,
  containerHeight: containerHeight = DEFAULT_CONTAINER_HEIGHT,
  padding: padding = DEFAULT_WARMUP_PADDING,
  maxJobs: maxJobs = DEFAULT_MAX_WARMUP_JOBS,
  selectedNodeIds: selectedNodeIds = canvas?.['selectedNodeIds'],
} = {}) {
  const _0x48a15 = normalizeNodes(nodes),
    _0x569cd1 = normalizeViewport(viewport),
    _0x1db240 = getEffectiveWarmupMaxJobs(maxJobs, _0x569cd1),
    _0x3ae439 = normalizeSelectedNodeIds(canvas, selectedNodeIds),
    _0x4b5d31 = getViewportWorldCenter(_0x569cd1, containerWidth, containerHeight),
    _0x27e133 = [],
    _0x9965dc = [],
    _0x23fd1b = new Set();
  for (const _0x549426 of _0x48a15) {
    if (!_0x549426?.['id']) continue;
    if (!isNodeInsideViewportPadding(_0x549426, _0x569cd1, containerWidth, containerHeight, padding))
      continue;
    const _0x129e8a = isNodeInsideViewportPadding(_0x549426, _0x569cd1, containerWidth, containerHeight, 0x0),
      _0x297ef4 = getNodeCenterDistanceSq(_0x549426, _0x4b5d31);
    _0x27e133['push']({
      node: _0x549426,
      selected: _0x3ae439['has'](String(_0x549426['id'] || '')),
      visible: _0x129e8a,
      distanceSq: _0x297ef4,
      order: _0x27e133['length'],
    });
  }
  _0x27e133['sort']((_0x1f9483, _0x2063e2) => {
    if (_0x1f9483['selected'] !== _0x2063e2['selected']) return _0x1f9483['selected'] ? -0x1 : 0x1;
    if (_0x1f9483['visible'] !== _0x2063e2['visible']) return _0x1f9483['visible'] ? -0x1 : 0x1;
    if (_0x1f9483['distanceSq'] !== _0x2063e2['distanceSq'])
      return _0x1f9483['distanceSq'] - _0x2063e2['distanceSq'];
    return _0x1f9483['order'] - _0x2063e2['order'];
  });
  for (const _0x4635de of _0x27e133) {
    const _0x284ad5 = _0x4635de['node'],
      _0x1bec7f = String(_0x284ad5['type'] || '')['toLowerCase']();
    if (_0x1bec7f === 'ai-video' && isTaskFailed(_0x284ad5)) continue;
    const _0x4f0753 =
        (_0x4635de['selected'] ? 0x28 : 0x0) +
        (_0x4635de['visible'] ? 0x12 : 0x0) +
        getDistancePriorityBoost(_0x4635de['distanceSq'], _0x569cd1, containerWidth, containerHeight),
      _0x512023 = {
        selected: _0x4635de['selected'],
        visible: _0x4635de['visible'],
        distanceSq: _0x4635de['distanceSq'],
      },
      _0x9c71ce =
        _0x569cd1['zoom'] > LOW_ZOOM_WARMUP_THRESHOLD && (_0x4635de['visible'] || _0x4635de['selected']);
    if (_0x1bec7f['includes']('image')) {
      addImageWarmupJobs(_0x9965dc, _0x23fd1b, _0x284ad5, {
        primary: !![],
        priorityOffset: _0x4f0753,
        includeFull: _0x9c71ce,
        meta: _0x512023,
      });
      const _0x3135d5 = getPrimaryListItem(_0x284ad5['images'], _0x284ad5['mainImageIndex']);
      _0x3135d5 &&
        addImageWarmupJobs(_0x9965dc, _0x23fd1b, _0x3135d5, {
          primary: ![],
          priorityOffset: _0x4f0753,
          includeFull: _0x9c71ce,
          meta: _0x512023,
        });
    } else {
      if (_0x1bec7f['includes']('video')) {
        if (shouldWarmupVideoPosterAtViewport(_0x4635de, _0x569cd1)) {
          const _0x48c4b2 = getPrimaryListItem(_0x284ad5['videos'], _0x284ad5['mainVideoIndex']);
          if (_0x48c4b2)
            addVideoPosterWarmupJobs(_0x9965dc, _0x23fd1b, _0x48c4b2, {
              primary: !![],
              priorityOffset: _0x4f0753,
              meta: _0x512023,
            });
          addVideoPosterWarmupJobs(_0x9965dc, _0x23fd1b, _0x284ad5, {
            primary: !_0x48c4b2,
            priorityOffset: _0x4f0753,
            meta: _0x512023,
          });
        }
      }
    }
    if (_0x9965dc['length'] >= _0x1db240) break;
  }
  return _0x9965dc['sort'](
    (_0x2b7954, _0x307db6) =>
      _0x307db6['priority'] - _0x2b7954['priority'] ||
      _0x2b7954['distanceSq'] - _0x307db6['distanceSq'] ||
      _0x2b7954['order'] - _0x307db6['order'],
  )['slice'](0x0, _0x1db240);
}
export function cancelCanvasVisibleMediaWarmupPreloads({
  includeActive: includeActive = ![],
  belowPriority: belowPriority = null,
  reason: reason = 'canceled',
} = {}) {
  return cancelQueuedCanvasImagePreloads({
    scope: CANVAS_MEDIA_WARMUP_SCOPE,
    includeActive: includeActive,
    belowPriority: belowPriority,
    reason: reason,
  });
}
export function warmupCanvasVisibleMedia({
  canvas: canvas = null,
  containerEl: containerEl = null,
  maxJobs: maxJobs = DEFAULT_MAX_WARMUP_JOBS,
  cancelStaleQueued: cancelStaleQueued = !![],
} = {}) {
  const _0x26f121 = normalizeViewport(canvas?.['viewport']),
    _0x2cdb69 = _0x26f121['zoom'] > LOW_ZOOM_WARMUP_THRESHOLD,
    _0x5b9b33 =
      cancelStaleQueued === ![]
        ? 0x0
        : cancelCanvasVisibleMediaWarmupPreloads({
            includeActive: ![],
            belowPriority: _0x2cdb69 ? HIGH_ZOOM_STALE_WARMUP_CANCEL_PRIORITY_LIMIT : null,
            reason: 'replaced\x20by\x20newer\x20viewport',
          }),
    _0x43cbcd = getElementSize(containerEl),
    _0x8b212b = collectCanvasVisibleMediaWarmupJobs({
      canvas: canvas,
      containerWidth: _0x43cbcd['width'],
      containerHeight: _0x43cbcd['height'],
      maxJobs: maxJobs,
    }),
    _0x11a98e = syncCanvasNearbyVideoWarmup({ canvas: canvas, containerEl: containerEl });
  for (const _0xef5862 of _0x8b212b) {
    preloadCanvasImage(_0xef5862['url'], {
      priority: _0xef5862['priority'],
      fetchPriority: _0xef5862['fetchPriority'],
      scope: CANVAS_MEDIA_WARMUP_SCOPE,
      allowWhenPaused: _0xef5862['allowWhenPaused'],
      deferWhenPaused: _0xef5862['deferWhenPaused'],
    })['catch'](() => {});
  }
  return {
    scheduledCount: _0x8b212b['length'],
    canceledStaleCount: _0x5b9b33,
    jobs: _0x8b212b,
    videoWarmupCount: _0x11a98e['scheduledCount'],
    videoWarmupSources: _0x11a98e['sources'],
    videoWarmupProbeCount: _0x11a98e['pendingProbeCount'] || 0x0,
  };
}
