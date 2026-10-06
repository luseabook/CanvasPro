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
const DEFAULT_CONTAINER_WIDTH = 1600,
  DEFAULT_CONTAINER_HEIGHT = 900,
  DEFAULT_WARMUP_PADDING = 900,
  DEFAULT_MAX_WARMUP_JOBS = 240,
  LOW_ZOOM_WARMUP_JOB_LIMIT = 72,
  VERY_LOW_ZOOM_WARMUP_JOB_LIMIT = 40,
  LOW_ZOOM_WARMUP_THRESHOLD = 0.45,
  VERY_LOW_ZOOM_WARMUP_THRESHOLD = 0.28,
  HIGH_ZOOM_STALE_WARMUP_CANCEL_PRIORITY_LIMIT = 150,
  CANVAS_MEDIA_WARMUP_SCOPE = 'canvas-visible-media-warmup',
  CANVAS_VIDEO_WARMUP_SCOPE = 'canvas-low-zoom-video-warmup',
  LOW_ZOOM_VIDEO_WARMUP_LIMIT = 3,
  LOW_ZOOM_VIDEO_WARMUP_MAX_BYTES = 8 * 1024 * 1024,
  LOW_ZOOM_VIDEO_STAT_CONCURRENCY = 2,
  VIDEO_STAT_TRUE_CACHE_TTL_MS = 30 * 1000,
  VIDEO_STAT_FALSE_CACHE_TTL_MS = 3 * 1000,
  videoStatCache = new Map(),
  videoStatProbeBySource = new Map();
let videoStatProbeQueue = [],
  activeVideoStatProbeCount = 0,
  videoWarmupRevision = 0,
  latestVideoWarmupContext = null;
function normalizeNodes(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
}
function normalizeViewport(box) {
  return {
    x: Number.isFinite(Number(box?.x)) ? Number(box.x) : 0,
    y: Number.isFinite(Number(box?.y)) ? Number(box.y) : 0,
    zoom: Number.isFinite(Number(box?.zoom)) && Number(box.zoom) > 0 ? Number(box.zoom) : 1,
  };
}
function shouldUseSharedVideoBlobWarmup() {
  const item = String(
    globalThis.location?.search || globalThis.window?.location?.search || '',
  );
  if (new URLSearchParams(item).get('aicRuntime') === 'chrome-shell') return true;
  return !desktopBridge.mediaPreview.isAvailable();
}
function getElementSize(el) {
  return {
    width: Math.max(1, Math.round(Number(el?.clientWidth) || DEFAULT_CONTAINER_WIDTH)),
    height: Math.max(1, Math.round(Number(el?.clientHeight) || DEFAULT_CONTAINER_HEIGHT)),
  };
}
function getViewportWorldCenter(box2, key, index) {
  const result = Math.max(0.0001, Number(box2?.zoom) || 1),
    data = Number.isFinite(Number(box2?.x)) ? Number(box2.x) : 0,
    options = Number.isFinite(Number(box2?.y)) ? Number(box2.y) : 0;
  return {
    x: ((0 - data) / result + (key - data) / result) / 2,
    y: ((0 - options) / result + (index - options) / result) / 2,
  };
}
function getNodeCenterDistanceSq(box3, box4) {
  const target = Number.isFinite(Number(box3?.x)) ? Number(box3.x) : 0,
    source = Number.isFinite(Number(box3?.y)) ? Number(box3.y) : 0,
    next = Math.max(1, Number(box3?.width) || 160),
    current = Math.max(1, Number(box3?.height) || 120),
    entry = target + next / 2 - box4.x,
    record = source + current / 2 - box4.y;
  return entry * entry + record * record;
}
function normalizeSelectedNodeIds(payload, handle) {
  const state = handle instanceof Set || Array.isArray(handle) ? handle : payload?.selectedNodeIds;
  return new Set(
    Array.from(state || [])
      .map((config) => String(config || ''))
      .filter(Boolean),
  );
}
function getDistancePriorityBoost(scope, box5, input, output) {
  const value2 = Math.max(0.0001, Number(box5?.zoom) || 1),
    value3 = Math.max(input / value2, output / value2, 1),
    value4 = Math.sqrt(Math.max(0, scope)) / value3;
  return Math.max(0, Math.round(18 - value4 * 18));
}
function getEffectiveWarmupMaxJobs(value5, box6) {
  const value6 = Math.max(0, Math.round(Number(value5) || 0)),
    count = Number(box6?.zoom);
  if (!Number.isFinite(count) || count <= 0) return value6;
  if (count <= VERY_LOW_ZOOM_WARMUP_THRESHOLD) return Math.min(value6, VERY_LOW_ZOOM_WARMUP_JOB_LIMIT);
  if (count <= LOW_ZOOM_WARMUP_THRESHOLD) return Math.min(value6, LOW_ZOOM_WARMUP_JOB_LIMIT);
  return value6;
}
function isWarmupUrl(value7) {
  const enabled = String(value7 || '').trim();
  if (!enabled) return false;
  if (/^https?:\/\//i.test(enabled)) return false;
  return (
    enabled.startsWith('/') ||
    enabled.startsWith('data:image/') ||
    enabled.startsWith('blob:') ||
    enabled.startsWith('aic-local-preview:')
  );
}
function isLikelyVideoUrl(value8) {
  return /\.(?:mp4|mov|webm|m4v|avi|mkv)(?:[?#].*)?$/i.test(String(value8 || '').trim());
}
function toWarmupUrl(value9) {
  const enabled2 = String(value9 || '').trim();
  if (!enabled2) return '';
  if (isWarmupUrl(enabled2)) return enabled2;
  return toCanvasLocalUrl(enabled2);
}
function pushWarmupJob(order, map, value10, priority, value11, reason2, visible = {}) {
  const url = toWarmupUrl(value10);
  if (!isWarmupUrl(url) || map.has(url)) return;
  if (isLikelyVideoUrl(url)) return;
  (map.add(url),
    order.push({
      url: url,
      priority: priority,
      nodeId: String(value11 || ''),
      reason: reason2,
      distanceSq: Number.isFinite(Number(visible.distanceSq)) ? Number(visible.distanceSq) : 0,
      visible: visible.visible === true,
      selected: visible.selected === true,
      fetchPriority: visible.fetchPriority === 'high' ? 'high' : 'auto',
      allowWhenPaused: visible.allowWhenPaused === true,
      deferWhenPaused: visible.deferWhenPaused === false ? false : true,
      order: order.length,
    }));
}
function getPrimaryListItem(list, value12 = 0) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const value13 = Number.isFinite(Number(value12))
    ? Math.max(0, Math.trunc(Number(value12)))
    : 0;
  return list[value13] || list[0] || null;
}
function getKnownMediaSizeBytes(...args) {
  for (const value14 of args) {
    for (const value15 of [
      value14?.fileSize,
      value14?.sizeBytes,
      value14?.byteSize,
      value14?.contentLength,
    ]) {
      const count2 = Number(value15 || 0);
      if (Number.isFinite(count2) && count2 > 0) return count2;
    }
  }
  return 0;
}
function addImageWarmupJobs(
  value16,
  value17,
  value18,
  {
    primary: primary = true,
    priorityOffset: priorityOffset = 0,
    includeFull: includeFull = false,
    meta: meta = {},
  } = {},
) {
  const value19 = primary ? 20 : 0,
    canvasImageDisplayUrl = resolveCanvasImageDisplayUrl(value18),
    canvasImageThumbUrl = resolveCanvasImageThumbUrl(value18);
  (includeFull &&
    canvasImageDisplayUrl &&
    canvasImageDisplayUrl !== canvasImageThumbUrl &&
    pushWarmupJob(
      value16,
      value17,
      canvasImageDisplayUrl,
      130 + value19 + priorityOffset,
      value18?.id,
      primary ? 'image-display-primary' : 'image-display-nearby',
      { ...meta, fetchPriority: 'high', allowWhenPaused: true, deferWhenPaused: false },
    ),
    pushWarmupJob(
      value16,
      value17,
      canvasImageThumbUrl || resolveCanvasImageLowZoomUrl(value18),
      90 + value19 + priorityOffset,
      value18?.id,
      primary ? 'image-thumb-primary' : 'image-thumb-nearby',
      meta,
    ),
    pushWarmupJob(
      value16,
      value17,
      canvasImageThumbUrl,
      70 + value19 + priorityOffset,
      value18?.id,
      primary ? 'image-thumb-dedupe-primary' : 'image-thumb-dedupe-nearby',
      meta,
    ));
}
function addVideoPosterWarmupJobs(
  value20,
  value21,
  value22,
  { primary: primary = true, priorityOffset: priorityOffset = 0, meta: meta = {} } = {},
) {
  const value23 = (primary ? 95 : 70) + priorityOffset;
  for (const value24 of [
    value22?.posterLocalPath,
    value22?.thumbLocalPath,
    value22?.posterUrl,
    value22?.thumbUrl,
    value22?.videoThumbSrc,
    value22?.capturePreviewUrl,
  ]) {
    pushWarmupJob(value20, value21, value24, value23, value22?.id, 'video-poster', meta);
  }
}
function shouldWarmupVideoPosterAtViewport(value25, box7) {
  const value26 = Number(box7?.zoom);
  if (!Number.isFinite(value26) || value26 > LOW_ZOOM_WARMUP_THRESHOLD) return true;
  return value25?.visible === true || value25?.selected === true;
}
function collectCanvasNearbyVideoWarmupCandidates({
  canvas: canvas = null,
  nodes: nodes = canvas?.nodes,
  viewport: viewport = canvas?.viewport,
  containerWidth: containerWidth = DEFAULT_CONTAINER_WIDTH,
  containerHeight: containerHeight = DEFAULT_CONTAINER_HEIGHT,
  padding: padding = DEFAULT_WARMUP_PADDING,
  selectedNodeIds: selectedNodeIds = canvas?.selectedNodeIds,
  maxVideos: maxVideos = LOW_ZOOM_VIDEO_WARMUP_LIMIT,
} = {}) {
  const box8 = normalizeViewport(viewport);
  if (box8.zoom > LOW_ZOOM_WARMUP_THRESHOLD || !shouldUseSharedVideoBlobWarmup()) return [];
  const selected = normalizeSelectedNodeIds(canvas, selectedNodeIds),
    viewportWorldCenter = getViewportWorldCenter(box8, containerWidth, containerHeight),
    order2 = [];
  for (const enabled3 of normalizeNodes(nodes)) {
    if (!enabled3?.id || String(enabled3.type || '').toLowerCase() !== 'ai-video') continue;
    if (isTaskFailed(enabled3)) continue;
    if (!isNodeInsideViewportPadding(enabled3, box8, containerWidth, containerHeight, padding)) continue;
    const value27 = Array.isArray(enabled3.videos) ? enabled3.videos : [],
      primaryListItem = getPrimaryListItem(value27, enabled3.mainVideoIndex),
      sourceUrl = resolveCanvasVideoUrl(primaryListItem || {}) || resolveCanvasVideoUrl(enabled3);
    if (!sourceUrl) continue;
    order2.push({
      nodeId: String(enabled3.id),
      sourceUrl: sourceUrl,
      knownSizeBytes: getKnownMediaSizeBytes(primaryListItem, enabled3),
      selected: selected.has(String(enabled3.id)),
      visible: isNodeInsideViewportPadding(enabled3, box8, containerWidth, containerHeight, 0),
      distanceSq: getNodeCenterDistanceSq(enabled3, viewportWorldCenter),
      order: order2.length,
    });
  }
  order2.sort((value28, value29) => {
    if (value28.selected !== value29.selected) return value28.selected ? -1 : 1;
    if (value28.visible !== value29.visible) return value28.visible ? -1 : 1;
    if (value28.distanceSq !== value29.distanceSq) return value28.distanceSq - value29.distanceSq;
    return value28.order - value29.order;
  });
  const value30 = Math.max(
      0,
      Math.min(LOW_ZOOM_VIDEO_WARMUP_LIMIT, Math.trunc(Number(maxVideos) || 0)),
    ),
    list2 = [],
    map2 = new Set();
  for (const value31 of order2) {
    if (map2.has(value31.sourceUrl)) continue;
    (map2.add(value31.sourceUrl), list2.push(value31));
    if (list2.length >= value30) break;
  }
  return list2;
}
function readCachedVideoStat(value32) {
  const enabled4 = videoStatCache.get(value32);
  if (!enabled4) return null;
  if (Number(enabled4.expiresAt || 0) <= Date.now()) return (videoStatCache.delete(value32), null);
  return enabled4.stat;
}
function rememberVideoStat(value33, exists) {
  const stat = {
    exists: exists?.exists === true,
    sizeBytes:
      Number.isSafeInteger(Number(exists?.sizeBytes)) && Number(exists.sizeBytes) >= 0
        ? Number(exists.sizeBytes)
        : 0,
  };
  return (
    videoStatCache.set(value33, {
      stat: stat,
      expiresAt:
        Date.now() + (stat.exists ? VIDEO_STAT_TRUE_CACHE_TTL_MS : VIDEO_STAT_FALSE_CACHE_TTL_MS),
    }),
    stat
  );
}
function drainVideoStatProbeQueue() {
  while (activeVideoStatProbeCount < LOW_ZOOM_VIDEO_STAT_CONCURRENCY && videoStatProbeQueue.length > 0) {
    const promise = videoStatProbeQueue.shift();
    if (!promise || videoStatProbeBySource.get(promise.sourceUrl) !== promise) continue;
    ((promise.active = true),
      (activeVideoStatProbeCount += 1),
      void statLocalMediaOnServer(promise.sourceUrl)
        .then((value34) => rememberVideoStat(promise.sourceUrl, value34))
        .catch(() => rememberVideoStat(promise.sourceUrl, { exists: false, sizeBytes: 0 }))
        .then(promise.resolve)
        .finally(() => {
          ((promise.active = false),
            (activeVideoStatProbeCount = Math.max(0, activeVideoStatProbeCount - 1)),
            videoStatProbeBySource.get(promise.sourceUrl) === promise &&
              videoStatProbeBySource.delete(promise.sourceUrl),
            drainVideoStatProbeQueue());
        }));
  }
}
function probeVideoStat(sourceUrl2) {
  const cachedVideoStat = readCachedVideoStat(sourceUrl2);
  if (cachedVideoStat) return Promise.resolve(cachedVideoStat);
  const value35 = videoStatProbeBySource.get(sourceUrl2);
  if (value35) return value35.promise;
  let resolve;
  const promise2 = new Promise((value36) => {
      resolve = value36;
    }),
    value37 = { sourceUrl: sourceUrl2, promise: promise2, resolve: resolve, active: false };
  return (
    videoStatProbeBySource.set(sourceUrl2, value37),
    videoStatProbeQueue.push(value37),
    drainVideoStatProbeQueue(),
    promise2
  );
}
function resolveEligibleVideoWarmupSources(value38) {
  const list3 = [];
  for (const value39 of value38) {
    const cachedVideoStat2 = readCachedVideoStat(value39.sourceUrl),
      count3 =
        value39.knownSizeBytes > 0
          ? value39.knownSizeBytes
          : cachedVideoStat2?.exists === true
            ? Number(cachedVideoStat2.sizeBytes || 0)
            : 0;
    count3 > 0 && count3 <= LOW_ZOOM_VIDEO_WARMUP_MAX_BYTES && list3.push(value39.sourceUrl);
  }
  return list3;
}
function applyLatestVideoWarmup(value40) {
  if (value40 !== videoWarmupRevision || !latestVideoWarmupContext) return null;
  const canvasNearbyVideoWarmupCandidates =
    collectCanvasNearbyVideoWarmupCandidates(latestVideoWarmupContext);
  return syncLocalVideoPlaybackWarmupSources(
    resolveEligibleVideoWarmupSources(canvasNearbyVideoWarmupCandidates),
    {
      scope: CANVAS_VIDEO_WARMUP_SCOPE,
      maxSources: LOW_ZOOM_VIDEO_WARMUP_LIMIT,
    },
  );
}
export function collectCanvasNearbyVideoWarmupSources(options2 = {}) {
  return resolveEligibleVideoWarmupSources(collectCanvasNearbyVideoWarmupCandidates(options2));
}
export function syncCanvasNearbyVideoWarmup({ canvas: canvas = null, containerEl: containerEl = null } = {}) {
  const containerWidth2 = getElementSize(containerEl),
    value41 = ++videoWarmupRevision;
  latestVideoWarmupContext = {
    canvas: canvas,
    containerWidth: containerWidth2.width,
    containerHeight: containerWidth2.height,
  };
  const list4 = collectCanvasNearbyVideoWarmupCandidates(latestVideoWarmupContext),
    args2 = applyLatestVideoWarmup(value41) || { sources: [], scheduledCount: 0 },
    pendingProbeCount = list4.filter(
      (value42) => !(value42.knownSizeBytes > 0) && !readCachedVideoStat(value42.sourceUrl),
    );
  return (
    pendingProbeCount.length > 0 &&
      void Promise.all(pendingProbeCount.map((value43) => probeVideoStat(value43.sourceUrl))).then(() => {
        applyLatestVideoWarmup(value41);
      }),
    { ...args2, pendingProbeCount: pendingProbeCount.length }
  );
}
export function clearCanvasNearbyVideoWarmup() {
  return (
    (videoWarmupRevision += 1),
    (latestVideoWarmupContext = null),
    clearLocalVideoPlaybackWarmupScope(CANVAS_VIDEO_WARMUP_SCOPE)
  );
}
export const __canvasMediaWarmupForTest = {
  snapshot() {
    return {
      activeVideoStatProbeCount: activeVideoStatProbeCount,
      queuedVideoStatProbeCount: videoStatProbeQueue.length,
      probedSources: Array.from(videoStatCache.keys()),
      revision: videoWarmupRevision,
    };
  },
  clearVideoStatState() {
    ((videoWarmupRevision += 1), (latestVideoWarmupContext = null), videoStatCache.clear());
    const value44 = videoStatProbeQueue;
    videoStatProbeQueue = [];
    for (const promise3 of value44) {
      !promise3.active &&
        videoStatProbeBySource.get(promise3.sourceUrl) === promise3 &&
        (videoStatProbeBySource.delete(promise3.sourceUrl),
        promise3.resolve({ exists: false, sizeBytes: 0 }));
    }
  },
};
export function collectCanvasVisibleMediaWarmupJobs({
  canvas: canvas = null,
  nodes: nodes = canvas?.nodes,
  viewport: viewport = canvas?.viewport,
  containerWidth: containerWidth = DEFAULT_CONTAINER_WIDTH,
  containerHeight: containerHeight = DEFAULT_CONTAINER_HEIGHT,
  padding: padding = DEFAULT_WARMUP_PADDING,
  maxJobs: maxJobs = DEFAULT_MAX_WARMUP_JOBS,
  selectedNodeIds: selectedNodeIds = canvas?.selectedNodeIds,
} = {}) {
  const nodes2 = normalizeNodes(nodes),
    box9 = normalizeViewport(viewport),
    effectiveWarmupMaxJobs = getEffectiveWarmupMaxJobs(maxJobs, box9),
    selected2 = normalizeSelectedNodeIds(canvas, selectedNodeIds),
    viewportWorldCenter2 = getViewportWorldCenter(box9, containerWidth, containerHeight),
    order3 = [],
    list5 = [],
    value45 = new Set();
  for (const node of nodes2) {
    if (!node?.id) continue;
    if (!isNodeInsideViewportPadding(node, box9, containerWidth, containerHeight, padding)) continue;
    const visible2 = isNodeInsideViewportPadding(node, box9, containerWidth, containerHeight, 0),
      distanceSq = getNodeCenterDistanceSq(node, viewportWorldCenter2);
    order3.push({
      node: node,
      selected: selected2.has(String(node.id || '')),
      visible: visible2,
      distanceSq: distanceSq,
      order: order3.length,
    });
  }
  order3.sort((value46, value47) => {
    if (value46.selected !== value47.selected) return value46.selected ? -1 : 1;
    if (value46.visible !== value47.visible) return value46.visible ? -1 : 1;
    if (value46.distanceSq !== value47.distanceSq) return value46.distanceSq - value47.distanceSq;
    return value46.order - value47.order;
  });
  for (const selected3 of order3) {
    const value48 = selected3.node,
      list6 = String(value48.type || '').toLowerCase();
    if (list6 === 'ai-video' && isTaskFailed(value48)) continue;
    const priorityOffset2 =
        (selected3.selected ? 40 : 0) +
        (selected3.visible ? 18 : 0) +
        getDistancePriorityBoost(selected3.distanceSq, box9, containerWidth, containerHeight),
      meta2 = {
        selected: selected3.selected,
        visible: selected3.visible,
        distanceSq: selected3.distanceSq,
      },
      includeFull2 =
        box9.zoom > LOW_ZOOM_WARMUP_THRESHOLD && (selected3.visible || selected3.selected);
    if (list6.includes('image')) {
      addImageWarmupJobs(list5, value45, value48, {
        primary: true,
        priorityOffset: priorityOffset2,
        includeFull: includeFull2,
        meta: meta2,
      });
      const primaryListItem2 = getPrimaryListItem(value48.images, value48.mainImageIndex);
      primaryListItem2 &&
        addImageWarmupJobs(list5, value45, primaryListItem2, {
          primary: false,
          priorityOffset: priorityOffset2,
          includeFull: includeFull2,
          meta: meta2,
        });
    } else {
      if (list6.includes('video')) {
        if (shouldWarmupVideoPosterAtViewport(selected3, box9)) {
          const primaryListItem3 = getPrimaryListItem(value48.videos, value48.mainVideoIndex);
          if (primaryListItem3)
            addVideoPosterWarmupJobs(list5, value45, primaryListItem3, {
              primary: true,
              priorityOffset: priorityOffset2,
              meta: meta2,
            });
          addVideoPosterWarmupJobs(list5, value45, value48, {
            primary: !primaryListItem3,
            priorityOffset: priorityOffset2,
            meta: meta2,
          });
        }
      }
    }
    if (list5.length >= effectiveWarmupMaxJobs) break;
  }
  return list5.sort(
    (value49, value50) =>
      value50.priority - value49.priority ||
      value49.distanceSq - value50.distanceSq ||
      value49.order - value50.order,
  ).slice(0, effectiveWarmupMaxJobs);
}
export function cancelCanvasVisibleMediaWarmupPreloads({
  includeActive: includeActive = false,
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
  cancelStaleQueued: cancelStaleQueued = true,
} = {}) {
  const box10 = normalizeViewport(canvas?.viewport),
    belowPriority2 = box10.zoom > LOW_ZOOM_WARMUP_THRESHOLD,
    canceledStaleCount =
      cancelStaleQueued === false
        ? 0
        : cancelCanvasVisibleMediaWarmupPreloads({
            includeActive: false,
            belowPriority: belowPriority2 ? HIGH_ZOOM_STALE_WARMUP_CANCEL_PRIORITY_LIMIT : null,
            reason: 'replaced by newer viewport',
          }),
    containerWidth3 = getElementSize(containerEl),
    scheduledCount2 = collectCanvasVisibleMediaWarmupJobs({
      canvas: canvas,
      containerWidth: containerWidth3.width,
      containerHeight: containerWidth3.height,
      maxJobs: maxJobs,
    }),
    videoWarmupCount = syncCanvasNearbyVideoWarmup({ canvas: canvas, containerEl: containerEl });
  for (const priority2 of scheduledCount2) {
    preloadCanvasImage(priority2.url, {
      priority: priority2.priority,
      fetchPriority: priority2.fetchPriority,
      scope: CANVAS_MEDIA_WARMUP_SCOPE,
      allowWhenPaused: priority2.allowWhenPaused,
      deferWhenPaused: priority2.deferWhenPaused,
    }).catch(() => {});
  }
  return {
    scheduledCount: scheduledCount2.length,
    canceledStaleCount: canceledStaleCount,
    jobs: scheduledCount2,
    videoWarmupCount: videoWarmupCount.scheduledCount,
    videoWarmupSources: videoWarmupCount.sources,
    videoWarmupProbeCount: videoWarmupCount.pendingProbeCount || 0,
  };
}
