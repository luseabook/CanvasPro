import { getCanvasMediaSchedulerStats } from '../canvasMediaScheduler.js';
const PERF_STORE_KEY = '__aicPerfProbeStore',
  DRAG_FPS_SESSION_LIMIT = 50,
  PAN_FPS_SESSION_LIMIT = 50,
  ZOOM_FPS_SESSION_LIMIT = 50,
  RESIZE_FPS_SESSION_LIMIT = 50,
  CANVAS_PAN_SAMPLE_LIMIT = 120,
  EDGE_REDRAW_SAMPLE_LIMIT = 240,
  RENDER_FRAME_SAMPLE_LIMIT = 240,
  VIRTUALIZATION_SAMPLE_LIMIT = 240,
  MINIMAP_UPDATE_SAMPLE_LIMIT = 240,
  LONG_TASK_SAMPLE_LIMIT = 120,
  STATIC_MEDIA_SAMPLE_LIMIT = 20,
  DERIVED_STATIC_MEDIA_PREFIXES = Object.freeze([
    '/data/uploads/_derived/',
    '/data/assets/_derived/',
    '/data/assets/derived/',
    '/output/_derived/',
    '/output/VideoThumbs/',
  ]),
  STATIC_VIDEO_PREFIXES = Object.freeze(['/output/', '/data/uploads/', '/data/assets/']),
  STATIC_VIDEO_EXTENSIONS = Object.freeze(['.mp4', '.webm', '.mov', '.m4v', '.mkv', '.mpeg', '.mpg', '.avi']),
  STATIC_IMAGE_EXTENSIONS = Object.freeze(['.avif', '.bmp', '.gif', '.jpeg', '.jpg', '.png', '.webp']);
function getGlobalWindow() {
  if (typeof window === 'undefined') return null;
  return window;
}
function toFiniteNumber(value, item = 0) {
  const key = Number(value);
  return Number.isFinite(key) ? key : item;
}
function pushCapped(list, index, result) {
  if (!Array.isArray(list)) return;
  list.push(index);
  const count = list.length - result;
  if (count > 0) list.splice(0, count);
}
function normalizeResourcePath(data) {
  const enabled = String(data || '').trim();
  if (!enabled) return '';
  try {
    const globalWindow = getGlobalWindow()?.location?.href || 'http://127.0.0.1/';
    return new URL(enabled, globalWindow).pathname.replace(/\\/g, '/');
  } catch {
    return enabled.split('?')[0].split('#')[0].replace(/\\/g, '/');
  }
}
function hasAnyPrefix(options, list2) {
  return list2.some((item2) => options.startsWith(item2));
}
function isDerivedStaticMediaPath(target) {
  return hasAnyPrefix(target, DERIVED_STATIC_MEDIA_PREFIXES);
}
function isStaticVideoPath(source) {
  if (!hasAnyPrefix(source, STATIC_VIDEO_PREFIXES)) return false;
  const next = source.toLowerCase();
  return STATIC_VIDEO_EXTENSIONS.some((item3) => next.endsWith(item3));
}
function isStaticImagePath(current) {
  if (!hasAnyPrefix(current, STATIC_VIDEO_PREFIXES) && !isDerivedStaticMediaPath(current)) return false;
  const entry = current.toLowerCase();
  return STATIC_IMAGE_EXTENSIONS.some((item4) => entry.endsWith(item4));
}
function isMp4Path(record) {
  if (!hasAnyPrefix(record, STATIC_VIDEO_PREFIXES)) return false;
  return record.toLowerCase().endsWith('.mp4');
}
function getDomMediaElements() {
  const el = getGlobalWindow()?.document;
  if (!el || typeof el.querySelectorAll !== 'function') return [];
  return Array.from(el.querySelectorAll('img, video, audio, source, image') || []);
}
function getDomMediaSources() {
  const list3 = [];
  for (const payload of getDomMediaElements()) {
    const handle =
        payload?.currentSrc ||
        payload?.src ||
        (typeof payload?.getAttribute === 'function' &&
          (payload.getAttribute('src') ||
            payload.getAttribute('href') ||
            payload.getAttribute('xlink:href'))) ||
        '',
      path = normalizeResourcePath(handle);
    if (!path) continue;
    list3.push({ path: path, tagName: String(payload?.tagName || '').toLowerCase() });
  }
  return list3;
}
function countDomVideoElements() {
  let state = 0;
  for (const config of getDomMediaElements()) {
    if (String(config?.tagName || '').toLowerCase() === 'video') state += 1;
  }
  return state;
}
function createEmptyStaticMediaSummary(resourceCount = 0) {
  return {
    resourceCount: resourceCount,
    staticMediaCount: 0,
    derivedMediaCount: 0,
    cacheableVideoCount: 0,
    cacheHitLikeCount: 0,
    transferSize: 0,
    encodedBodySize: 0,
    decodedBodySize: 0,
    domMediaElementCount: 0,
    imageRequestCount: 0,
    mp4RequestCount: 0,
    videoElementCount: 0,
    sampledResources: [],
  };
}
function summarizeStaticMediaResources() {
  const globalWindow2 = getGlobalWindow(),
    scope = globalWindow2?.performance || globalThis.performance,
    handler =
      scope && typeof scope.getEntriesByType === 'function' ? scope.getEntriesByType.bind(scope) : null,
    list4 = handler ? handler('resource') || [] : [],
    input = [],
    emptyStaticMediaSummary = createEmptyStaticMediaSummary(list4.length);
  ((emptyStaticMediaSummary.sampledResources = input),
    (emptyStaticMediaSummary.videoElementCount = countDomVideoElements()));
  const map = new Set();
  for (const error of list4) {
    const path2 = normalizeResourcePath(error?.name),
      derived = isDerivedStaticMediaPath(path2),
      staticVideo = isStaticVideoPath(path2),
      isStaticImagePath2 = isStaticImagePath(path2);
    if (isStaticImagePath2) emptyStaticMediaSummary.imageRequestCount += 1;
    if (isMp4Path(path2)) emptyStaticMediaSummary.mp4RequestCount += 1;
    if (!derived && !staticVideo) continue;
    map.add(path2);
    const transferSize = toFiniteNumber(error?.transferSize, 0),
      encodedBodySize = toFiniteNumber(error?.encodedBodySize, 0),
      toFiniteNumber2 = toFiniteNumber(error?.decodedBodySize, 0);
    emptyStaticMediaSummary.staticMediaCount += 1;
    if (derived) emptyStaticMediaSummary.derivedMediaCount += 1;
    if (staticVideo) emptyStaticMediaSummary.cacheableVideoCount += 1;
    if (transferSize === 0 && encodedBodySize > 0) emptyStaticMediaSummary.cacheHitLikeCount += 1;
    ((emptyStaticMediaSummary.transferSize += transferSize),
      (emptyStaticMediaSummary.encodedBodySize += encodedBodySize),
      (emptyStaticMediaSummary.decodedBodySize += toFiniteNumber2),
      pushCapped(
        input,
        {
          path: path2,
          initiatorType: String(error?.initiatorType || ''),
          transferSize: transferSize,
          encodedBodySize: encodedBodySize,
          durationMs: toFiniteNumber(error?.duration, 0),
          derived: derived,
          staticVideo: staticVideo,
          source: 'resource',
        },
        STATIC_MEDIA_SAMPLE_LIMIT,
      ));
  }
  for (const path3 of getDomMediaSources()) {
    const derived2 = isDerivedStaticMediaPath(path3.path),
      staticVideo2 = isStaticVideoPath(path3.path);
    if (!derived2 && !staticVideo2) continue;
    emptyStaticMediaSummary.domMediaElementCount += 1;
    if (map.has(path3.path)) continue;
    (map.add(path3.path), (emptyStaticMediaSummary.staticMediaCount += 1));
    if (derived2) emptyStaticMediaSummary.derivedMediaCount += 1;
    if (staticVideo2) emptyStaticMediaSummary.cacheableVideoCount += 1;
    pushCapped(
      input,
      {
        path: path3.path,
        initiatorType: path3.tagName || 'dom',
        transferSize: 0,
        encodedBodySize: 0,
        durationMs: 0,
        derived: derived2,
        staticVideo: staticVideo2,
        source: 'dom',
      },
      STATIC_MEDIA_SAMPLE_LIMIT,
    );
  }
  return emptyStaticMediaSummary;
}
function percentile(list5, output) {
  if (!Array.isArray(list5) || list5.length === 0) return 0;
  const value2 = Math.min(1, Math.max(0, Number(output) / 100)),
    value3 = Math.ceil(value2 * list5.length) - 1;
  return list5[Math.max(0, value3)];
}
function summarize(value4) {
  const count2 = (value4 || [])
    .map((item5) => toFiniteNumber(item5, NaN))
    .filter((count3) => Number.isFinite(count3) && count3 > 0)
    .sort((item6, value5) => item6 - value5);
  if (count2.length === 0) return { count: 0, avg: 0, p50: 0, p95: 0 };
  const avg = count2.reduce((item7, value6) => item7 + value6, 0);
  return {
    count: count2.length,
    avg: avg / count2.length,
    p50: percentile(count2, 50),
    p95: percentile(count2, 95),
  };
}
function bindHelpers(value7) {
  const globalWindow3 = getGlobalWindow();
  if (!globalWindow3) return;
  ((globalWindow3.__resetPerfProbe = resetPerfProbeData),
    (globalWindow3.__getPerfProbeSnapshot = getPerfProbeSnapshot),
    (globalWindow3.__setPerfProbeEnabled = (enabled2) => {
      value7.enabled = !!enabled2;
    }));
}
function installRendererVirtualizationProbe() {
  const globalWindow4 = getGlobalWindow();
  if (!globalWindow4 || globalWindow4.__perfProbeVirtualizationProbeInstalled === true) return;
  const value8 = globalWindow4.__rendererVirtualizationProbe;
  ((globalWindow4.__rendererVirtualizationProbe = {
    onCandidateSignatureEvaluated(value9) {
      (recordRendererVirtualizationSample(value9), value8?.onCandidateSignatureEvaluated?.(value9));
    },
  }),
    (globalWindow4.__perfProbeVirtualizationProbeInstalled = true));
}
function installLongTaskObserver() {
  const globalWindow5 = getGlobalWindow();
  if (!globalWindow5 || globalWindow5.__perfProbeLongTaskObserverInstalled === true) return;
  const run = globalWindow5.PerformanceObserver || globalThis.PerformanceObserver;
  if (typeof run !== 'function') return;
  const list6 = run.supportedEntryTypes;
  if (Array.isArray(list6) && !list6.includes('longtask')) return;
  try {
    const value10 = new run((value11) => {
      const value12 = typeof value11?.getEntries === 'function' ? value11.getEntries() : [];
      for (const name of value12) {
        recordLongTaskSample(name?.duration, {
          name: name?.name,
          startTime: name?.startTime,
          source: 'observer',
        });
      }
    });
    (value10.observe({ type: 'longtask', buffered: true }),
      (globalWindow5.__perfProbeLongTaskObserver = value10),
      (globalWindow5.__perfProbeLongTaskObserverInstalled = true));
  } catch {}
}
function createMilestoneState() {
  return { startedAtPerf: nowMs(), firstVisualMs: null, firstInteractiveMs: null, maxLongTaskMs: 0 };
}
function ensureStore() {
  const enabled3 = getGlobalWindow();
  if (!enabled3) return null;
  !enabled3[PERF_STORE_KEY] &&
    (enabled3[PERF_STORE_KEY] = {
      enabled: enabled3.__perfProbeEnabled === true,
      dragSessions: {},
      dragFpsSessions: [],
      panSessions: {},
      panFpsSessions: [],
      canvasPanSamples: [],
      zoomSessions: {},
      zoomFpsSessions: [],
      resizeSessions: {},
      resizeFpsSessions: [],
      edgeRedrawSamples: [],
      renderFrameSamples: [],
      virtualizationSamples: [],
      minimapUpdateSamples: [],
      longTaskSamples: [],
      ...createMilestoneState(),
    });
  const enabled4 = enabled3[PERF_STORE_KEY];
  (!enabled4.dragSessions || typeof enabled4.dragSessions !== 'object') && (enabled4.dragSessions = {});
  if (!Array.isArray(enabled4.dragFpsSessions)) enabled4.dragFpsSessions = [];
  (!enabled4.panSessions || typeof enabled4.panSessions !== 'object') && (enabled4.panSessions = {});
  if (!Array.isArray(enabled4.panFpsSessions)) enabled4.panFpsSessions = [];
  if (!Array.isArray(enabled4.canvasPanSamples)) enabled4.canvasPanSamples = [];
  (!enabled4.zoomSessions || typeof enabled4.zoomSessions !== 'object') && (enabled4.zoomSessions = {});
  if (!Array.isArray(enabled4.zoomFpsSessions)) enabled4.zoomFpsSessions = [];
  (!enabled4.resizeSessions || typeof enabled4.resizeSessions !== 'object') && (enabled4.resizeSessions = {});
  if (!Array.isArray(enabled4.resizeFpsSessions)) enabled4.resizeFpsSessions = [];
  if (!Array.isArray(enabled4.edgeRedrawSamples)) enabled4.edgeRedrawSamples = [];
  if (!Array.isArray(enabled4.renderFrameSamples)) enabled4.renderFrameSamples = [];
  !Array.isArray(enabled4.virtualizationSamples) && (enabled4.virtualizationSamples = []);
  !Array.isArray(enabled4.minimapUpdateSamples) && (enabled4.minimapUpdateSamples = []);
  if (!Array.isArray(enabled4.longTaskSamples)) enabled4.longTaskSamples = [];
  !Number.isFinite(Number(enabled4.startedAtPerf)) && (enabled4.startedAtPerf = nowMs());
  if (!Number.isFinite(Number(enabled4.maxLongTaskMs))) enabled4.maxLongTaskMs = 0;
  return (
    enabled3.__perfProbeEnabled === true && (enabled4.enabled = true),
    bindHelpers(enabled4),
    installRendererVirtualizationProbe(),
    installLongTaskObserver(),
    enabled4
  );
}
function isEnabled(value13) {
  return !!(value13 && value13.enabled === true);
}
export function isPerfProbeEnabled() {
  return isEnabled(ensureStore());
}
export function setPerfProbeEnabled(value14) {
  const store = ensureStore();
  if (!store) return false;
  store.enabled = value14 === true;
  const globalWindow6 = getGlobalWindow();
  if (globalWindow6) globalWindow6.__perfProbeEnabled = store.enabled;
  return store.enabled;
}
function nowMs() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') return performance.now();
  return Date.now();
}
function requestProbeFrame(handler2) {
  if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(handler2);
  return setTimeout(() => handler2(nowMs()), 16);
}
function cancelProbeFrame(value15) {
  if (value15 === null || value15 === undefined) return;
  if (typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(value15);
    return;
  }
  clearTimeout(value15);
}
function getElapsedSinceProbeStart(value16) {
  const toFiniteNumber3 = toFiniteNumber(value16?.startedAtPerf, nowMs());
  return Math.max(0, nowMs() - toFiniteNumber3);
}
function sampleHasVisualContent(options2 = {}) {
  return (
    toFiniteNumber(options2.nodeCount, 0) > 0 ||
    toFiniteNumber(options2.mountedNodeCount, 0) > 0 ||
    toFiniteNumber(options2.fastPreviewCount, 0) > 0 ||
    toFiniteNumber(options2.visibleFastPreviewCount, 0) > 0
  );
}
function beginFpsSession(value17, value18, value19, value20) {
  if (!isEnabled(value17)) return;
  const label = String(value19 || value20),
    enabled5 = value17[value18] || {};
  value17[value18] = enabled5;
  if (enabled5[label]) return;
  const value21 = {
      label: label,
      startedAt: Date.now(),
      startedAtPerf: nowMs(),
      prevTs: null,
      frameIntervals: [],
      rafId: null,
    },
    value22 = (value23) => {
      if (!enabled5[label]) return;
      if (value21.prevTs !== null) {
        const count4 = value23 - value21.prevTs;
        Number.isFinite(count4) && count4 > 0 && value21.frameIntervals.push(count4);
      }
      ((value21.prevTs = value23), (value21.rafId = requestProbeFrame(value22)));
    };
  ((value21.rafId = requestProbeFrame(value22)), (enabled5[label] = value21));
}
function endFpsSession(value24, value25, value26, value27, value28, value29) {
  if (!isEnabled(value24)) return null;
  const value30 = String(value28 || value29),
    value31 = value24[value25] || {},
    label2 = value31[value30];
  if (!label2) return null;
  label2.rafId !== null && cancelProbeFrame(label2.rafId);
  const value32 = label2.frameIntervals
      .map((count5) => (count5 > 0 ? 0x3e8 / count5 : 0))
      .filter((count6) => Number.isFinite(count6) && count6 > 0),
    frameCount = summarize(value32),
    value33 = {
      label: label2.label,
      startedAt: label2.startedAt,
      endedAt: Date.now(),
      durationMs: Math.max(0, nowMs() - label2.startedAtPerf),
      frameCount: frameCount.count,
      avgFps: frameCount.avg,
      p50Fps: frameCount.p50,
      p95Fps: frameCount.p95,
    };
  return (pushCapped(value24[value26], value33, value27), delete value31[value30], value33);
}
export function beginDragFpsSession(value34 = 'node-drag') {
  beginFpsSession(ensureStore(), 'dragSessions', value34, 'node-drag');
}
export function endDragFpsSession(value35 = 'node-drag') {
  return endFpsSession(
    ensureStore(),
    'dragSessions',
    'dragFpsSessions',
    DRAG_FPS_SESSION_LIMIT,
    value35,
    'node-drag',
  );
}
export function beginPanFpsSession(value36 = 'canvas-pan') {
  beginFpsSession(ensureStore(), 'panSessions', value36, 'canvas-pan');
}
export function endPanFpsSession(value37 = 'canvas-pan') {
  return endFpsSession(
    ensureStore(),
    'panSessions',
    'panFpsSessions',
    PAN_FPS_SESSION_LIMIT,
    value37,
    'canvas-pan',
  );
}
export function beginZoomFpsSession(value38 = 'wheel-zoom') {
  beginFpsSession(ensureStore(), 'zoomSessions', value38, 'wheel-zoom');
}
export function endZoomFpsSession(value39 = 'wheel-zoom') {
  return endFpsSession(
    ensureStore(),
    'zoomSessions',
    'zoomFpsSessions',
    ZOOM_FPS_SESSION_LIMIT,
    value39,
    'wheel-zoom',
  );
}
export function beginResizeFpsSession(value40 = 'node-resize') {
  beginFpsSession(ensureStore(), 'resizeSessions', value40, 'node-resize');
}
export function endResizeFpsSession(value41 = 'node-resize') {
  return endFpsSession(
    ensureStore(),
    'resizeSessions',
    'resizeFpsSessions',
    RESIZE_FPS_SESSION_LIMIT,
    value41,
    'node-resize',
  );
}
export function recordEdgeRedrawSample(value42, value43, clearedDom = {}) {
  const store2 = ensureStore();
  if (!isEnabled(store2)) return;
  const durationMs = toFiniteNumber(value43, 0);
  if (!Number.isFinite(durationMs) || durationMs < 0) return;
  const value44 = {
    mode: String(value42 || 'unknown'),
    durationMs: durationMs,
    reason: String(clearedDom.reason || ''),
    edgeCount: toFiniteNumber(clearedDom.edgeCount, 0),
    visibleEdgeCount: toFiniteNumber(clearedDom.visibleEdgeCount, 0),
    updatedCount: toFiniteNumber(clearedDom.updatedCount, 0),
    createdCount: toFiniteNumber(clearedDom.createdCount, 0),
    removedCount: toFiniteNumber(clearedDom.removedCount, 0),
    reusedCount: toFiniteNumber(clearedDom.reusedCount, 0),
    skippedInvisibleCount: toFiniteNumber(clearedDom.skippedInvisibleCount, 0),
    cacheSize: toFiniteNumber(clearedDom.cacheSize, 0),
    layoutReadMs: toFiniteNumber(clearedDom.layoutReadMs, 0),
    pathBuildMs: toFiniteNumber(clearedDom.pathBuildMs, 0),
    domWriteMs: toFiniteNumber(clearedDom.domWriteMs, 0),
    clearedDom: clearedDom.clearedDom === true,
    at: Date.now(),
  };
  pushCapped(store2.edgeRedrawSamples, value44, EDGE_REDRAW_SAMPLE_LIMIT);
}
export function recordCanvasPanSample(committed = {}) {
  const store3 = ensureStore();
  if (!isEnabled(store3)) return;
  pushCapped(
    store3.canvasPanSamples,
    {
      durationMs: toFiniteNumber(committed.durationMs, 0),
      moveCount: toFiniteNumber(committed.moveCount, 0),
      committed: committed.committed === true,
      nodeCount: toFiniteNumber(committed.nodeCount, 0),
      edgeCount: toFiniteNumber(committed.edgeCount, 0),
      mountedNodeCount: toFiniteNumber(committed.mountedNodeCount, 0),
      minimapPreviewCount: toFiniteNumber(committed.minimapPreviewCount, 0),
      finalX: toFiniteNumber(committed.finalX, 0),
      finalY: toFiniteNumber(committed.finalY, 0),
      finalZoom: toFiniteNumber(committed.finalZoom, 1),
      at: Date.now(),
    },
    CANVAS_PAN_SAMPLE_LIMIT,
  );
}
export function recordMinimapUpdateSample(value45, value46, viewportOnly = {}) {
  const store4 = ensureStore();
  if (!isEnabled(store4)) return;
  pushCapped(
    store4.minimapUpdateSamples,
    {
      mode: String(value45 || 'unknown'),
      durationMs: toFiniteNumber(value46, 0),
      nodeCount: toFiniteNumber(viewportOnly.nodeCount, 0),
      dotCount: toFiniteNumber(viewportOnly.dotCount, 0),
      createdCount: toFiniteNumber(viewportOnly.createdCount, 0),
      updatedCount: toFiniteNumber(viewportOnly.updatedCount, 0),
      removedCount: toFiniteNumber(viewportOnly.removedCount, 0),
      viewportOnly: viewportOnly.viewportOnly === true,
      delayed: viewportOnly.delayed === true,
      at: Date.now(),
    },
    MINIMAP_UPDATE_SAMPLE_LIMIT,
  );
}
export function recordRenderFrameSample(options3 = {}) {
  const store5 = ensureStore();
  if (!isEnabled(store5)) return;
  const durationMs2 = toFiniteNumber(options3.durationMs, 0);
  if (!Number.isFinite(durationMs2) || durationMs2 < 0) return;
  const sampleHasVisualContent2 = sampleHasVisualContent(options3);
  (store5.firstVisualMs === null &&
    sampleHasVisualContent2 &&
    (store5.firstVisualMs = getElapsedSinceProbeStart(store5)),
    store5.firstInteractiveMs === null &&
      String(options3.mode || '') === 'steady' &&
      sampleHasVisualContent2 &&
      (store5.firstInteractiveMs = getElapsedSinceProbeStart(store5)),
    pushCapped(
      store5.renderFrameSamples,
      {
        mode: String(options3.mode || 'unknown'),
        durationMs: durationMs2,
        nodeCount: toFiniteNumber(options3.nodeCount, 0),
        edgeCount: toFiniteNumber(options3.edgeCount, 0),
        mountedNodeCount: toFiniteNumber(options3.mountedNodeCount, 0),
        parkedNodeCount: toFiniteNumber(options3.parkedNodeCount, 0),
        fastPreviewCount: toFiniteNumber(options3.fastPreviewCount, 0),
        visibleFastPreviewCount: toFiniteNumber(options3.visibleFastPreviewCount, 0),
        previewWithMediaCount: toFiniteNumber(options3.previewWithMediaCount, 0),
        deferredMountedWithPreviewCount: toFiniteNumber(options3.deferredMountedWithPreviewCount, 0),
        at: Date.now(),
      },
      RENDER_FRAME_SAMPLE_LIMIT,
    ));
}
export function recordLongTaskSample(value47, error2 = {}) {
  const store6 = ensureStore();
  if (!isEnabled(store6)) return;
  const durationMs3 = toFiniteNumber(value47, 0);
  if (!Number.isFinite(durationMs3) || durationMs3 <= 0) return;
  ((store6.maxLongTaskMs = Math.max(toFiniteNumber(store6.maxLongTaskMs, 0), durationMs3)),
    pushCapped(
      store6.longTaskSamples,
      {
        durationMs: durationMs3,
        name: String(error2.name || ''),
        startTime: toFiniteNumber(error2.startTime, 0),
        source: String(error2.source || 'manual'),
        at: Date.now(),
      },
      LONG_TASK_SAMPLE_LIMIT,
    ));
}
export function recordRendererVirtualizationSample(cacheHit = {}) {
  const store7 = ensureStore();
  if (!isEnabled(store7)) return;
  pushCapped(
    store7.virtualizationSamples,
    {
      cacheHit: cacheHit.cacheHit === true,
      spatialIndex: cacheHit.spatialIndex === true,
      snapshotRev: toFiniteNumber(cacheHit.snapshotRev, 0),
      nodeCount: toFiniteNumber(cacheHit.nodeCount, 0),
      mountCandidateCount: toFiniteNumber(cacheHit.mountCandidateCount, 0),
      parkCandidateCount: toFiniteNumber(cacheHit.parkCandidateCount, 0),
      keepAliveCount: toFiniteNumber(cacheHit.keepAliveCount, 0),
      containerW: toFiniteNumber(cacheHit.containerW, 0),
      containerH: toFiniteNumber(cacheHit.containerH, 0),
      at: Date.now(),
    },
    VIRTUALIZATION_SAMPLE_LIMIT,
  );
}
export function resetPerfProbeData() {
  const store8 = ensureStore();
  if (!store8) return;
  for (const value48 of Object.values(store8.dragSessions || {})) {
    value48 && value48.rafId !== null && cancelProbeFrame(value48.rafId);
  }
  for (const value49 of Object.values(store8.zoomSessions || {})) {
    value49 && value49.rafId !== null && cancelProbeFrame(value49.rafId);
  }
  for (const value50 of Object.values(store8.resizeSessions || {})) {
    value50 && value50.rafId !== null && cancelProbeFrame(value50.rafId);
  }
  ((store8.dragSessions = {}), (store8.dragFpsSessions = []));
  for (const value51 of Object.values(store8.panSessions || {})) {
    value51 && value51.rafId !== null && cancelProbeFrame(value51.rafId);
  }
  ((store8.panSessions = {}),
    (store8.panFpsSessions = []),
    (store8.canvasPanSamples = []),
    (store8.zoomSessions = {}),
    (store8.zoomFpsSessions = []),
    (store8.resizeSessions = {}),
    (store8.resizeFpsSessions = []),
    (store8.edgeRedrawSamples = []),
    (store8.renderFrameSamples = []),
    (store8.virtualizationSamples = []),
    (store8.minimapUpdateSamples = []),
    (store8.longTaskSamples = []),
    Object.assign(store8, createMilestoneState()));
}
export function getPerfProbeSnapshot() {
  const firstVisualMs = ensureStore();
  if (!firstVisualMs)
    return {
      version: 1,
      enabled: false,
      dragFpsSessions: [],
      panFpsSessions: [],
      canvasPanSamples: [],
      zoomFpsSessions: [],
      resizeFpsSessions: [],
      edgeRedrawSamples: [],
      renderFrameSamples: [],
      virtualizationSamples: [],
      minimapUpdateSamples: [],
      longTaskSamples: [],
      mediaSchedulerStats: getCanvasMediaSchedulerStats(),
      staticMediaResourceSummary: summarizeStaticMediaResources(),
      firstVisualMs: null,
      firstInteractiveMs: null,
      maxLongTaskMs: 0,
    };
  return {
    version: 1,
    enabled: !!firstVisualMs.enabled,
    dragFpsSessions: Array.isArray(firstVisualMs.dragFpsSessions)
      ? firstVisualMs.dragFpsSessions.map((args) => ({ ...args }))
      : [],
    panFpsSessions: Array.isArray(firstVisualMs.panFpsSessions)
      ? firstVisualMs.panFpsSessions.map((args2) => ({ ...args2 }))
      : [],
    canvasPanSamples: Array.isArray(firstVisualMs.canvasPanSamples)
      ? firstVisualMs.canvasPanSamples.map((args3) => ({ ...args3 }))
      : [],
    zoomFpsSessions: Array.isArray(firstVisualMs.zoomFpsSessions)
      ? firstVisualMs.zoomFpsSessions.map((args4) => ({ ...args4 }))
      : [],
    resizeFpsSessions: Array.isArray(firstVisualMs.resizeFpsSessions)
      ? firstVisualMs.resizeFpsSessions.map((args5) => ({ ...args5 }))
      : [],
    edgeRedrawSamples: Array.isArray(firstVisualMs.edgeRedrawSamples)
      ? firstVisualMs.edgeRedrawSamples.map((args6) => ({ ...args6 }))
      : [],
    renderFrameSamples: Array.isArray(firstVisualMs.renderFrameSamples)
      ? firstVisualMs.renderFrameSamples.map((args7) => ({ ...args7 }))
      : [],
    virtualizationSamples: Array.isArray(firstVisualMs.virtualizationSamples)
      ? firstVisualMs.virtualizationSamples.map((args8) => ({ ...args8 }))
      : [],
    minimapUpdateSamples: Array.isArray(firstVisualMs.minimapUpdateSamples)
      ? firstVisualMs.minimapUpdateSamples.map((args9) => ({ ...args9 }))
      : [],
    longTaskSamples: Array.isArray(firstVisualMs.longTaskSamples)
      ? firstVisualMs.longTaskSamples.map((args10) => ({ ...args10 }))
      : [],
    mediaSchedulerStats: getCanvasMediaSchedulerStats(),
    staticMediaResourceSummary: summarizeStaticMediaResources(),
    firstVisualMs: firstVisualMs.firstVisualMs,
    firstInteractiveMs: firstVisualMs.firstInteractiveMs,
    maxLongTaskMs: toFiniteNumber(firstVisualMs.maxLongTaskMs, 0),
  };
}

const FAST_PREVIEW_SAMPLE_LIMIT = 0xf0;
const NODE_LIFECYCLE_SAMPLE_LIMIT = 0xf0;
const NODE_LIFECYCLE_TYPE_LIMIT = 0xa;
const NODE_LIFECYCLE_SLOW_LIMIT = 0x8;
const LONG_ANIMATION_FRAME_SAMPLE_LIMIT = 0x78;
const SLOW_LONG_ANIMATION_FRAME_LIMIT = 0x8;
const LONG_ANIMATION_FRAME_SCRIPT_LIMIT = 0xc;
const SCRIPT_SOURCE_URL_LIMIT = 0x1f4;
const SCRIPT_FUNCTION_NAME_LIMIT = 0xa0;

function normalizeLifecycleTypeBreakdown(enabled6) {
  if (!enabled6 || typeof enabled6 !== 'object') return [];
  return Object['entries'](enabled6)
    ['map'](([value52, value53]) => ({
      type: String(value52 || 'unknown')['slice'](0x0, 0x50),
      count: toFiniteNumber(value53?.['count'], 0x0),
      durationMs: toFiniteNumber(value53?.['durationMs'], 0x0),
      maxMs: toFiniteNumber(value53?.['maxMs'], 0x0),
    }))
    ['filter']((value54) => value54['count'] > 0x0 || value54['durationMs'] > 0x0)
    ['sort']((value55, value56) => value56['durationMs'] - value55['durationMs'])
    ['slice'](0x0, NODE_LIFECYCLE_TYPE_LIMIT);
}

function normalizeLifecycleSlowList(list7) {
  if (!Array['isArray'](list7)) return [];
  return list7['map']((value57) => {
    const value58 = {
        nodeId: String(value57?.['nodeId'] || '')['slice'](0x0, 0x78),
        type: String(value57?.['type'] || 'unknown')['slice'](0x0, 0x50),
        reason: String(value57?.['reason'] || '')['slice'](0x0, 0x50),
        durationMs: toFiniteNumber(value57?.['durationMs'], 0x0),
      },
      value59 = Array['isArray'](value57?.['breakdown']?.['sections'])
        ? value57['breakdown']['sections']
            ['map']((value60) => ({
              name: String(value60?.['name'] || '')['slice'](0x0, 0x50),
              durationMs: toFiniteNumber(value60?.['durationMs'], 0x0),
            }))
            ['filter']((value61) => value61['name'])
            ['slice'](0x0, 0xc)
        : [];
    return (
      value59['length'] &&
        ((value58['breakdown'] = {
          totalMs: toFiniteNumber(value57?.['breakdown']?.['totalMs'], 0x0),
          sections: value59,
        }),
        value57?.['breakdown']?.['details'] &&
          typeof value57['breakdown']['details'] === 'object' &&
          (value58['breakdown']['details'] = Object['fromEntries'](
            Object['entries'](value57['breakdown']['details'])
              ['map'](([value62, value63]) => [
                String(value62 || '')['slice'](0x0, 0x50),
                String(value63 ?? '')['slice'](0x0, 0x1f4),
              ])
              ['filter'](([value64]) => value64),
          ))),
      value58
    );
  })
    ['filter']((value65) => value65['durationMs'] >= 0x0)
    ['sort']((value66, value67) => value67['durationMs'] - value66['durationMs'])
    ['slice'](0x0, NODE_LIFECYCLE_SLOW_LIMIT);
}

function sanitizeScriptSourceURL(value68) {
  const enabled7 = String(value68 || '')['trim']();
  if (!enabled7) return '';
  try {
    const uRL = new URL(getGlobalWindow()?.['location']?.['href'] || 'http://127.0.0.1/'),
      uRL2 = new URL(enabled7, uRL);
    if (uRL2['protocol'] === 'data:' || uRL2['protocol'] === 'blob:') return uRL2['protocol'] + '[redacted]';
    const value69 = uRL2['pathname']['replace'](/\\/g, '/');
    if (uRL2['protocol'] === 'file:') {
      const value70 = value69['split']('/')['filter'](Boolean)['at'](-0x1) || 'script';
      return ('file:///[redacted]/' + value70)['slice'](0x0, SCRIPT_SOURCE_URL_LIMIT);
    }
    const value71 = uRL2['origin'] === uRL['origin'] ? value69 : '' + uRL2['origin'] + value69;
    return value71['slice'](0x0, SCRIPT_SOURCE_URL_LIMIT);
  } catch {
    const value72 = enabled7['split']('?')[0x0]['split']('#')[0x0]['replace'](/\\/g, '/');
    if (/^(?:[a-z]:\/|\/users\/)/i['test'](value72)) {
      const value73 = value72['split']('/')['filter'](Boolean)['at'](-0x1) || 'script';
      return ('[redacted]/' + value73)['slice'](0x0, SCRIPT_SOURCE_URL_LIMIT);
    }
    return value72['slice'](0x0, SCRIPT_SOURCE_URL_LIMIT);
  }
}

function sanitizeScriptFunctionName(value74) {
  return String(value74 || '')
    ['replace'](/[\u0000-\u001f\u007f]+/g, '\x20')
    ['replace'](/\s+/g, '\x20')
    ['trim']()
    ['slice'](0x0, SCRIPT_FUNCTION_NAME_LIMIT);
}

function normalizeLongAnimationFrameScript(options4 = {}) {
  return {
    durationMs: Math['max'](0x0, toFiniteNumber(options4['duration'], 0x0)),
    executionStart: Math['max'](0x0, toFiniteNumber(options4['executionStart'], 0x0)),
    forcedStyleAndLayoutDurationMs: Math['max'](
      0x0,
      toFiniteNumber(options4['forcedStyleAndLayoutDuration'], 0x0),
    ),
    sourceURL: sanitizeScriptSourceURL(options4['sourceURL']),
    functionName: sanitizeScriptFunctionName(options4['sourceFunctionName'] ?? options4['functionName']),
    charPosition: Math['max'](
      0x0,
      Math['trunc'](toFiniteNumber(options4['sourceCharPosition'] ?? options4['charPosition'], 0x0)),
    ),
  };
}

function normalizeLongAnimationFrameEntry(options5 = {}) {
  const count7 = Math['max'](0x0, toFiniteNumber(options5['duration'], 0x0));
  if (count7 <= 0x0) return null;
  const list8 = Array['isArray'](options5['scripts'])
      ? options5['scripts']
          ['map'](normalizeLongAnimationFrameScript)
          ['sort']((value75, value76) => value76['durationMs'] - value75['durationMs'])
          ['slice'](0x0, LONG_ANIMATION_FRAME_SCRIPT_LIMIT)
      : [],
    value77 = Math['max'](0x0, toFiniteNumber(options5['startTime'], 0x0)),
    value78 = Math['max'](0x0, toFiniteNumber(options5['renderStart'], 0x0)),
    value79 = Math['max'](0x0, toFiniteNumber(options5['styleAndLayoutStart'], 0x0)),
    value80 = list8['reduce']((value81, value82) => value81 + value82['durationMs'], 0x0),
    value83 = list8['reduce']((value84, value85) => value84 + value85['forcedStyleAndLayoutDurationMs'], 0x0);
  return {
    durationMs: count7,
    blockingDurationMs: Math['max'](0x0, toFiniteNumber(options5['blockingDuration'], 0x0)),
    startTime: value77,
    renderStart: value78,
    styleAndLayoutStart: value79,
    renderStartOffsetMs: Math['max'](0x0, value78 - value77),
    styleAndLayoutStartOffsetMs: Math['max'](0x0, value79 - value77),
    scriptDurationMs: value80,
    forcedStyleAndLayoutDurationMs: value83,
    unattributedDurationMs: Math['max'](0x0, count7 - value80),
    scripts: list8,
    at: Date['now'](),
  };
}

function cloneLongAnimationFrameSample(args11 = {}) {
  return {
    ...args11,
    scripts: Array['isArray'](args11['scripts']) ? args11['scripts']['map']((args12) => ({ ...args12 })) : [],
  };
}

function disconnectLongAnimationFrameObserver(value86, value87) {
  value86?.['__perfProbeLongAnimationFrameObserver']?.['disconnect']?.();
  value86 &&
    ((value86['__perfProbeLongAnimationFrameObserver'] = null),
    (value86['__perfProbeLongAnimationFrameObserverInstalled'] = ![]),
    (value86['__perfProbeLongAnimationFrameObserverAttempted'] = ![]));
  if (value87) value87['longAnimationFrameObserverActive'] = ![];
}

function detectLongAnimationFrameSupport(value88) {
  const value89 = value88?.['PerformanceObserver'] || globalThis['PerformanceObserver'];
  if (typeof value89 !== 'function') return ![];
  const value90 = value89['supportedEntryTypes'];
  if (Array['isArray'](value90)) return value90['includes']('long-animation-frame');
  return null;
}

function recordLongAnimationFrameEntry(value91) {
  const store9 = ensureStore();
  if (!isEnabled(store9)) return;
  const longAnimationFrameEntry = normalizeLongAnimationFrameEntry(value91);
  if (!longAnimationFrameEntry) return;
  ((store9['maxLongAnimationFrameDurationMs'] = Math['max'](
    toFiniteNumber(store9['maxLongAnimationFrameDurationMs'], 0x0),
    longAnimationFrameEntry['durationMs'],
  )),
    (store9['maxLongAnimationFrameBlockingDurationMs'] = Math['max'](
      toFiniteNumber(store9['maxLongAnimationFrameBlockingDurationMs'], 0x0),
      longAnimationFrameEntry['blockingDurationMs'],
    )),
    pushCapped(
      store9['longAnimationFrameSamples'],
      longAnimationFrameEntry,
      LONG_ANIMATION_FRAME_SAMPLE_LIMIT,
    ));
}

function syncLongAnimationFrameObserver(enabled8) {
  const globalWindow7 = getGlobalWindow();
  if (!globalWindow7 || !enabled8) return;
  if (!isEnabled(enabled8)) {
    disconnectLongAnimationFrameObserver(globalWindow7, enabled8);
    const detectLongAnimationFrameSupport2 = detectLongAnimationFrameSupport(globalWindow7);
    detectLongAnimationFrameSupport2 !== null &&
      (enabled8['longAnimationFrameSupported'] = detectLongAnimationFrameSupport2);
    return;
  }
  if (globalWindow7['__perfProbeLongAnimationFrameObserverInstalled'] === !![]) {
    ((enabled8['longAnimationFrameSupported'] = !![]), (enabled8['longAnimationFrameObserverActive'] = !![]));
    return;
  }
  if (globalWindow7['__perfProbeLongAnimationFrameObserverAttempted'] === !![]) return;
  const run2 = globalWindow7['PerformanceObserver'] || globalThis['PerformanceObserver'];
  if (typeof run2 !== 'function') {
    ((enabled8['longAnimationFrameSupported'] = ![]),
      (globalWindow7['__perfProbeLongAnimationFrameObserverAttempted'] = !![]));
    return;
  }
  const enabled9 = run2['supportedEntryTypes'];
  if (Array['isArray'](enabled9) && !enabled9['includes']('long-animation-frame')) {
    ((enabled8['longAnimationFrameSupported'] = ![]),
      (globalWindow7['__perfProbeLongAnimationFrameObserverAttempted'] = !![]));
    return;
  }
  globalWindow7['__perfProbeLongAnimationFrameObserverAttempted'] = !![];
  try {
    const value92 = new run2((value93) => {
      const value94 = typeof value93?.['getEntries'] === 'function' ? value93['getEntries']() : [];
      for (const value95 of value94) recordLongAnimationFrameEntry(value95);
    });
    (value92['observe']({ type: 'long-animation-frame' }),
      (globalWindow7['__perfProbeLongAnimationFrameObserver'] = value92),
      (globalWindow7['__perfProbeLongAnimationFrameObserverInstalled'] = !![]),
      (enabled8['longAnimationFrameSupported'] = !![]),
      (enabled8['longAnimationFrameObserverActive'] = !![]));
  } catch {
    ((globalWindow7['__perfProbeLongAnimationFrameObserver'] = null),
      (globalWindow7['__perfProbeLongAnimationFrameObserverInstalled'] = ![]),
      (enabled8['longAnimationFrameSupported'] = ![]),
      (enabled8['longAnimationFrameObserverActive'] = ![]));
  }
}

export function recordFastPreviewSample(value96, value97, value98 = {}) {
  const store10 = ensureStore();
  if (!isEnabled(store10)) return;
  const toFiniteNumber4 = toFiniteNumber(value97, 0x0);
  if (!Number['isFinite'](toFiniteNumber4) || toFiniteNumber4 < 0x0) return;
  pushCapped(
    store10['fastPreviewSamples'],
    {
      mode: String(value96 || 'unknown'),
      durationMs: toFiniteNumber4,
      startPerf: toFiniteNumber(value98['startPerf'], 0x0),
      endPerf: toFiniteNumber(value98['endPerf'], 0x0),
      candidateCount: toFiniteNumber(value98['candidateCount'], 0x0),
      createdCount: toFiniteNumber(value98['createdCount'], 0x0),
      reusedCount: toFiniteNumber(value98['reusedCount'], 0x0),
      removedCount: toFiniteNumber(value98['removedCount'], 0x0),
      poolSize: toFiniteNumber(value98['poolSize'], 0x0),
      pendingCreateCount: toFiniteNumber(value98['pendingCreateCount'], 0x0),
      srcAssignedCount: toFiniteNumber(value98['srcAssignedCount'], 0x0),
      pendingMediaSrcCount: toFiniteNumber(value98['pendingMediaSrcCount'], 0x0),
      imageCount: toFiniteNumber(value98['imageCount'], 0x0),
      zoom: toFiniteNumber(value98['zoom'], 0x1),
      at: Date['now'](),
    },
    FAST_PREVIEW_SAMPLE_LIMIT,
  );
}

export function recordRendererNodeLifecycleSample(options6 = {}) {
  const store11 = ensureStore();
  if (!isEnabled(store11)) return;
  const toFiniteNumber5 = toFiniteNumber(options6['createdCount'], 0x0),
    toFiniteNumber6 = toFiniteNumber(options6['remountedCount'], 0x0),
    toFiniteNumber7 = toFiniteNumber(options6['parkedCount'], 0x0),
    toFiniteNumber8 = toFiniteNumber(options6['updateCount'], 0x0),
    toFiniteNumber9 = toFiniteNumber(options6['skippedUpdateCount'], 0x0),
    toFiniteNumber10 = toFiniteNumber(options6['mountBatchCount'], 0x0),
    enabled10 =
      toFiniteNumber5 > 0x0 ||
      toFiniteNumber6 > 0x0 ||
      toFiniteNumber7 > 0x0 ||
      toFiniteNumber8 > 0x0 ||
      toFiniteNumber9 > 0x0 ||
      toFiniteNumber10 > 0x0;
  if (!enabled10) return;
  pushCapped(
    store11['nodeLifecycleSamples'],
    {
      mode: String(options6['mode'] || 'unknown'),
      nodeCount: toFiniteNumber(options6['nodeCount'], 0x0),
      renderNodeCount: toFiniteNumber(options6['renderNodeCount'], 0x0),
      mountCandidateCount: toFiniteNumber(options6['mountCandidateCount'], 0x0),
      parkCandidateCount: toFiniteNumber(options6['parkCandidateCount'], 0x0),
      viewportBusy: options6['viewportBusy'] === !![],
      createdCount: toFiniteNumber5,
      createRuntimeMs: toFiniteNumber(options6['createRuntimeMs'], 0x0),
      createRuntimeMaxMs: toFiniteNumber(options6['createRuntimeMaxMs'], 0x0),
      remountedCount: toFiniteNumber6,
      remountRuntimeMs: toFiniteNumber(options6['remountRuntimeMs'], 0x0),
      remountRuntimeMaxMs: toFiniteNumber(options6['remountRuntimeMaxMs'], 0x0),
      parkedCount: toFiniteNumber7,
      parkRuntimeMs: toFiniteNumber(options6['parkRuntimeMs'], 0x0),
      parkRuntimeMaxMs: toFiniteNumber(options6['parkRuntimeMaxMs'], 0x0),
      updateCount: toFiniteNumber8,
      hiddenUpdateCount: toFiniteNumber(options6['hiddenUpdateCount'], 0x0),
      updateRuntimeMs: toFiniteNumber(options6['updateRuntimeMs'], 0x0),
      updateRuntimeMaxMs: toFiniteNumber(options6['updateRuntimeMaxMs'], 0x0),
      skippedUpdateCount: toFiniteNumber9,
      mountBatchCount: toFiniteNumber10,
      mountBatchFlushMs: toFiniteNumber(options6['mountBatchFlushMs'], 0x0),
      mountBatchFlushMaxMs: toFiniteNumber(options6['mountBatchFlushMaxMs'], 0x0),
      createdByType: normalizeLifecycleTypeBreakdown(options6['createdByType']),
      updatedByType: normalizeLifecycleTypeBreakdown(options6['updatedByType']),
      slowCreates: normalizeLifecycleSlowList(options6['slowCreates']),
      slowUpdates: normalizeLifecycleSlowList(options6['slowUpdates']),
      at: Date['now'](),
    },
    NODE_LIFECYCLE_SAMPLE_LIMIT,
  );
}
