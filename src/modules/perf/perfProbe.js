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
function toFiniteNumber(_0x3c1734, _0x4418ad = 0) {
  const _0x443cb8 = Number(_0x3c1734);
  return Number.isFinite(_0x443cb8) ? _0x443cb8 : _0x4418ad;
}
function pushCapped(_0x45c3c2, _0x23b669, _0x1d9fe5) {
  if (!Array.isArray(_0x45c3c2)) return;
  _0x45c3c2.push(_0x23b669);
  const _0x577174 = _0x45c3c2.length - _0x1d9fe5;
  if (_0x577174 > 0) _0x45c3c2.splice(0, _0x577174);
}
function normalizeResourcePath(_0x22dcf7) {
  const _0x3fc555 = String(_0x22dcf7 || '').trim();
  if (!_0x3fc555) return '';
  try {
    const _0x18322d = getGlobalWindow()?.location?.href || 'http://127.0.0.1/';
    return new URL(_0x3fc555, _0x18322d).pathname.replace(/\\/g, '/');
  } catch {
    return _0x3fc555.split('?')[0].split('#')[0].replace(/\\/g, '/');
  }
}
function hasAnyPrefix(_0x5428b7, _0x4aa36c) {
  return _0x4aa36c.some((_0x361909) => _0x5428b7.startsWith(_0x361909));
}
function isDerivedStaticMediaPath(_0x25aac6) {
  return hasAnyPrefix(_0x25aac6, DERIVED_STATIC_MEDIA_PREFIXES);
}
function isStaticVideoPath(_0x4e01f6) {
  if (!hasAnyPrefix(_0x4e01f6, STATIC_VIDEO_PREFIXES)) return false;
  const _0x2d15c3 = _0x4e01f6.toLowerCase();
  return STATIC_VIDEO_EXTENSIONS.some((_0x160066) => _0x2d15c3.endsWith(_0x160066));
}
function isStaticImagePath(_0x1d95fc) {
  if (!hasAnyPrefix(_0x1d95fc, STATIC_VIDEO_PREFIXES) && !isDerivedStaticMediaPath(_0x1d95fc)) return false;
  const _0x1ad2e6 = _0x1d95fc.toLowerCase();
  return STATIC_IMAGE_EXTENSIONS.some((_0x1eee45) => _0x1ad2e6.endsWith(_0x1eee45));
}
function isMp4Path(_0x529c65) {
  if (!hasAnyPrefix(_0x529c65, STATIC_VIDEO_PREFIXES)) return false;
  return _0x529c65.toLowerCase().endsWith('.mp4');
}
function getDomMediaElements() {
  const _0xd96c4d = getGlobalWindow()?.document;
  if (!_0xd96c4d || typeof _0xd96c4d.querySelectorAll !== 'function') return [];
  return Array.from(_0xd96c4d.querySelectorAll('img, video, audio, source, image') || []);
}
function getDomMediaSources() {
  const _0x38a05 = [];
  for (const _0x392727 of getDomMediaElements()) {
    const _0x4daf57 =
        _0x392727?.currentSrc ||
        _0x392727?.src ||
        (typeof _0x392727?.getAttribute === 'function' &&
          (_0x392727.getAttribute('src') ||
            _0x392727.getAttribute('href') ||
            _0x392727.getAttribute('xlink:href'))) ||
        '',
      _0x12954f = normalizeResourcePath(_0x4daf57);
    if (!_0x12954f) continue;
    _0x38a05.push({ path: _0x12954f, tagName: String(_0x392727?.tagName || '').toLowerCase() });
  }
  return _0x38a05;
}
function countDomVideoElements() {
  let _0x21702a = 0;
  for (const _0xf2e5a0 of getDomMediaElements()) {
    if (String(_0xf2e5a0?.tagName || '').toLowerCase() === 'video') _0x21702a += 1;
  }
  return _0x21702a;
}
function createEmptyStaticMediaSummary(_0x50c4a5 = 0) {
  return {
    resourceCount: _0x50c4a5,
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
  const _0x549bee = getGlobalWindow(),
    _0x4d680c = _0x549bee?.performance || globalThis.performance,
    _0x311e7f =
      _0x4d680c && typeof _0x4d680c.getEntriesByType === 'function'
        ? _0x4d680c.getEntriesByType.bind(_0x4d680c)
        : null,
    _0x3b2581 = _0x311e7f ? _0x311e7f('resource') || [] : [],
    _0x3a38f8 = [],
    _0x2986cd = createEmptyStaticMediaSummary(_0x3b2581.length);
  ((_0x2986cd.sampledResources = _0x3a38f8), (_0x2986cd.videoElementCount = countDomVideoElements()));
  const _0x17196d = new Set();
  for (const _0x22c8c3 of _0x3b2581) {
    const _0x24cfd0 = normalizeResourcePath(_0x22c8c3?.name),
      _0x4679ed = isDerivedStaticMediaPath(_0x24cfd0),
      _0x2a2295 = isStaticVideoPath(_0x24cfd0),
      _0x2801ae = isStaticImagePath(_0x24cfd0);
    if (_0x2801ae) _0x2986cd.imageRequestCount += 1;
    if (isMp4Path(_0x24cfd0)) _0x2986cd.mp4RequestCount += 1;
    if (!_0x4679ed && !_0x2a2295) continue;
    _0x17196d.add(_0x24cfd0);
    const _0xc5e85 = toFiniteNumber(_0x22c8c3?.transferSize, 0),
      _0x3391dc = toFiniteNumber(_0x22c8c3?.encodedBodySize, 0),
      _0x4eb011 = toFiniteNumber(_0x22c8c3?.decodedBodySize, 0);
    _0x2986cd.staticMediaCount += 1;
    if (_0x4679ed) _0x2986cd.derivedMediaCount += 1;
    if (_0x2a2295) _0x2986cd.cacheableVideoCount += 1;
    if (_0xc5e85 === 0 && _0x3391dc > 0) _0x2986cd.cacheHitLikeCount += 1;
    ((_0x2986cd.transferSize += _0xc5e85),
      (_0x2986cd.encodedBodySize += _0x3391dc),
      (_0x2986cd.decodedBodySize += _0x4eb011),
      pushCapped(
        _0x3a38f8,
        {
          path: _0x24cfd0,
          initiatorType: String(_0x22c8c3?.initiatorType || ''),
          transferSize: _0xc5e85,
          encodedBodySize: _0x3391dc,
          durationMs: toFiniteNumber(_0x22c8c3?.duration, 0),
          derived: _0x4679ed,
          staticVideo: _0x2a2295,
          source: 'resource',
        },
        STATIC_MEDIA_SAMPLE_LIMIT,
      ));
  }
  for (const _0x5f013a of getDomMediaSources()) {
    const _0x16e571 = isDerivedStaticMediaPath(_0x5f013a.path),
      _0x8576ac = isStaticVideoPath(_0x5f013a.path);
    if (!_0x16e571 && !_0x8576ac) continue;
    _0x2986cd.domMediaElementCount += 1;
    if (_0x17196d.has(_0x5f013a.path)) continue;
    (_0x17196d.add(_0x5f013a.path), (_0x2986cd.staticMediaCount += 1));
    if (_0x16e571) _0x2986cd.derivedMediaCount += 1;
    if (_0x8576ac) _0x2986cd.cacheableVideoCount += 1;
    pushCapped(
      _0x3a38f8,
      {
        path: _0x5f013a.path,
        initiatorType: _0x5f013a.tagName || 'dom',
        transferSize: 0,
        encodedBodySize: 0,
        durationMs: 0,
        derived: _0x16e571,
        staticVideo: _0x8576ac,
        source: 'dom',
      },
      STATIC_MEDIA_SAMPLE_LIMIT,
    );
  }
  return _0x2986cd;
}
function percentile(_0x50f4a9, _0x48f9f1) {
  if (!Array.isArray(_0x50f4a9) || _0x50f4a9.length === 0) return 0;
  const _0x3b8997 = Math.min(1, Math.max(0, Number(_0x48f9f1) / 100)),
    _0x222dbb = Math.ceil(_0x3b8997 * _0x50f4a9.length) - 1;
  return _0x50f4a9[Math.max(0, _0x222dbb)];
}
function summarize(_0xdf0847) {
  const _0x4b472e = (_0xdf0847 || [])
    .map((_0x5e5113) => toFiniteNumber(_0x5e5113, NaN))
    .filter((_0x2120fa) => Number.isFinite(_0x2120fa) && _0x2120fa > 0)
    .sort((_0x36b1a6, _0x318cd7) => _0x36b1a6 - _0x318cd7);
  if (_0x4b472e.length === 0) return { count: 0, avg: 0, p50: 0, p95: 0 };
  const _0x308605 = _0x4b472e.reduce((_0x467b15, _0x5cf495) => _0x467b15 + _0x5cf495, 0);
  return {
    count: _0x4b472e.length,
    avg: _0x308605 / _0x4b472e.length,
    p50: percentile(_0x4b472e, 50),
    p95: percentile(_0x4b472e, 95),
  };
}
function bindHelpers(_0x4bf07d) {
  const _0x442345 = getGlobalWindow();
  if (!_0x442345) return;
  ((_0x442345.__resetPerfProbe = resetPerfProbeData),
    (_0x442345.__getPerfProbeSnapshot = getPerfProbeSnapshot),
    (_0x442345.__setPerfProbeEnabled = (_0x595f70) => {
      _0x4bf07d.enabled = !!_0x595f70;
    }));
}
function installRendererVirtualizationProbe() {
  const _0x1bc4bf = getGlobalWindow();
  if (!_0x1bc4bf || _0x1bc4bf.__perfProbeVirtualizationProbeInstalled === true) return;
  const _0x35a9ea = _0x1bc4bf.__rendererVirtualizationProbe;
  ((_0x1bc4bf.__rendererVirtualizationProbe = {
    onCandidateSignatureEvaluated(_0x39b67a) {
      (recordRendererVirtualizationSample(_0x39b67a), _0x35a9ea?.onCandidateSignatureEvaluated?.(_0x39b67a));
    },
  }),
    (_0x1bc4bf.__perfProbeVirtualizationProbeInstalled = true));
}
function installLongTaskObserver() {
  const _0x4d171e = getGlobalWindow();
  if (!_0x4d171e || _0x4d171e.__perfProbeLongTaskObserverInstalled === true) return;
  const _0x45e492 = _0x4d171e.PerformanceObserver || globalThis.PerformanceObserver;
  if (typeof _0x45e492 !== 'function') return;
  const _0x2429b1 = _0x45e492.supportedEntryTypes;
  if (Array.isArray(_0x2429b1) && !_0x2429b1.includes('longtask')) return;
  try {
    const _0x2e8a64 = new _0x45e492((_0x128520) => {
      const _0x368460 = typeof _0x128520?.getEntries === 'function' ? _0x128520.getEntries() : [];
      for (const _0xc70355 of _0x368460) {
        recordLongTaskSample(_0xc70355?.duration, {
          name: _0xc70355?.name,
          startTime: _0xc70355?.startTime,
          source: 'observer',
        });
      }
    });
    (_0x2e8a64.observe({ type: 'longtask', buffered: true }),
      (_0x4d171e.__perfProbeLongTaskObserver = _0x2e8a64),
      (_0x4d171e.__perfProbeLongTaskObserverInstalled = true));
  } catch {}
}
function createMilestoneState() {
  return { startedAtPerf: nowMs(), firstVisualMs: null, firstInteractiveMs: null, maxLongTaskMs: 0 };
}
function ensureStore() {
  const _0x431822 = getGlobalWindow();
  if (!_0x431822) return null;
  !_0x431822[PERF_STORE_KEY] &&
    (_0x431822[PERF_STORE_KEY] = {
      enabled: _0x431822.__perfProbeEnabled === true,
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
  const _0x156ff6 = _0x431822[PERF_STORE_KEY];
  (!_0x156ff6.dragSessions || typeof _0x156ff6.dragSessions !== 'object') && (_0x156ff6.dragSessions = {});
  if (!Array.isArray(_0x156ff6.dragFpsSessions)) _0x156ff6.dragFpsSessions = [];
  (!_0x156ff6.panSessions || typeof _0x156ff6.panSessions !== 'object') && (_0x156ff6.panSessions = {});
  if (!Array.isArray(_0x156ff6.panFpsSessions)) _0x156ff6.panFpsSessions = [];
  if (!Array.isArray(_0x156ff6.canvasPanSamples)) _0x156ff6.canvasPanSamples = [];
  (!_0x156ff6.zoomSessions || typeof _0x156ff6.zoomSessions !== 'object') && (_0x156ff6.zoomSessions = {});
  if (!Array.isArray(_0x156ff6.zoomFpsSessions)) _0x156ff6.zoomFpsSessions = [];
  (!_0x156ff6.resizeSessions || typeof _0x156ff6.resizeSessions !== 'object') &&
    (_0x156ff6.resizeSessions = {});
  if (!Array.isArray(_0x156ff6.resizeFpsSessions)) _0x156ff6.resizeFpsSessions = [];
  if (!Array.isArray(_0x156ff6.edgeRedrawSamples)) _0x156ff6.edgeRedrawSamples = [];
  if (!Array.isArray(_0x156ff6.renderFrameSamples)) _0x156ff6.renderFrameSamples = [];
  !Array.isArray(_0x156ff6.virtualizationSamples) && (_0x156ff6.virtualizationSamples = []);
  !Array.isArray(_0x156ff6.minimapUpdateSamples) && (_0x156ff6.minimapUpdateSamples = []);
  if (!Array.isArray(_0x156ff6.longTaskSamples)) _0x156ff6.longTaskSamples = [];
  !Number.isFinite(Number(_0x156ff6.startedAtPerf)) && (_0x156ff6.startedAtPerf = nowMs());
  if (!Number.isFinite(Number(_0x156ff6.maxLongTaskMs))) _0x156ff6.maxLongTaskMs = 0;
  return (
    _0x431822.__perfProbeEnabled === true && (_0x156ff6.enabled = true),
    bindHelpers(_0x156ff6),
    installRendererVirtualizationProbe(),
    installLongTaskObserver(),
    _0x156ff6
  );
}
function isEnabled(_0x5ccb40) {
  return !!(_0x5ccb40 && _0x5ccb40.enabled === true);
}
export function isPerfProbeEnabled() {
  return isEnabled(ensureStore());
}
export function setPerfProbeEnabled(_0x383db9) {
  const _0x10a511 = ensureStore();
  if (!_0x10a511) return false;
  _0x10a511.enabled = _0x383db9 === true;
  const _0x34397f = getGlobalWindow();
  if (_0x34397f) _0x34397f.__perfProbeEnabled = _0x10a511.enabled;
  return _0x10a511.enabled;
}
function nowMs() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') return performance.now();
  return Date.now();
}
function requestProbeFrame(_0x33f568) {
  if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(_0x33f568);
  return setTimeout(() => _0x33f568(nowMs()), 16);
}
function cancelProbeFrame(_0x26616e) {
  if (_0x26616e === null || _0x26616e === undefined) return;
  if (typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(_0x26616e);
    return;
  }
  clearTimeout(_0x26616e);
}
function getElapsedSinceProbeStart(_0x381670) {
  const _0x14a820 = toFiniteNumber(_0x381670?.startedAtPerf, nowMs());
  return Math.max(0, nowMs() - _0x14a820);
}
function sampleHasVisualContent(_0x162004 = {}) {
  return (
    toFiniteNumber(_0x162004.nodeCount, 0) > 0 ||
    toFiniteNumber(_0x162004.mountedNodeCount, 0) > 0 ||
    toFiniteNumber(_0x162004.fastPreviewCount, 0) > 0 ||
    toFiniteNumber(_0x162004.visibleFastPreviewCount, 0) > 0
  );
}
function beginFpsSession(_0x2e825e, _0x224e4e, _0x22f238, _0xc33180) {
  if (!isEnabled(_0x2e825e)) return;
  const _0x21cd6c = String(_0x22f238 || _0xc33180),
    _0x2cb65b = _0x2e825e[_0x224e4e] || {};
  _0x2e825e[_0x224e4e] = _0x2cb65b;
  if (_0x2cb65b[_0x21cd6c]) return;
  const _0x567297 = {
      label: _0x21cd6c,
      startedAt: Date.now(),
      startedAtPerf: nowMs(),
      prevTs: null,
      frameIntervals: [],
      rafId: null,
    },
    _0x3abab1 = (_0x2b3114) => {
      if (!_0x2cb65b[_0x21cd6c]) return;
      if (_0x567297.prevTs !== null) {
        const _0x25f3ad = _0x2b3114 - _0x567297.prevTs;
        Number.isFinite(_0x25f3ad) && _0x25f3ad > 0 && _0x567297.frameIntervals.push(_0x25f3ad);
      }
      ((_0x567297.prevTs = _0x2b3114), (_0x567297.rafId = requestProbeFrame(_0x3abab1)));
    };
  ((_0x567297.rafId = requestProbeFrame(_0x3abab1)), (_0x2cb65b[_0x21cd6c] = _0x567297));
}
function endFpsSession(_0x26a236, _0x183a96, _0x446ab6, _0x2e8616, _0x4c8ad5, _0x511b72) {
  if (!isEnabled(_0x26a236)) return null;
  const _0x2137e6 = String(_0x4c8ad5 || _0x511b72),
    _0x592613 = _0x26a236[_0x183a96] || {},
    _0x48677b = _0x592613[_0x2137e6];
  if (!_0x48677b) return null;
  _0x48677b.rafId !== null && cancelProbeFrame(_0x48677b.rafId);
  const _0x16c3d6 = _0x48677b.frameIntervals
      .map((_0x2995c7) => (_0x2995c7 > 0 ? 0x3e8 / _0x2995c7 : 0))
      .filter((_0x19f150) => Number.isFinite(_0x19f150) && _0x19f150 > 0),
    _0x42ed57 = summarize(_0x16c3d6),
    _0x213868 = {
      label: _0x48677b.label,
      startedAt: _0x48677b.startedAt,
      endedAt: Date.now(),
      durationMs: Math.max(0, nowMs() - _0x48677b.startedAtPerf),
      frameCount: _0x42ed57.count,
      avgFps: _0x42ed57.avg,
      p50Fps: _0x42ed57.p50,
      p95Fps: _0x42ed57.p95,
    };
  return (pushCapped(_0x26a236[_0x446ab6], _0x213868, _0x2e8616), delete _0x592613[_0x2137e6], _0x213868);
}
export function beginDragFpsSession(_0x648ae2 = 'node-drag') {
  beginFpsSession(ensureStore(), 'dragSessions', _0x648ae2, 'node-drag');
}
export function endDragFpsSession(_0x3b4d65 = 'node-drag') {
  return endFpsSession(
    ensureStore(),
    'dragSessions',
    'dragFpsSessions',
    DRAG_FPS_SESSION_LIMIT,
    _0x3b4d65,
    'node-drag',
  );
}
export function beginPanFpsSession(_0x379491 = 'canvas-pan') {
  beginFpsSession(ensureStore(), 'panSessions', _0x379491, 'canvas-pan');
}
export function endPanFpsSession(_0x2cc7e6 = 'canvas-pan') {
  return endFpsSession(
    ensureStore(),
    'panSessions',
    'panFpsSessions',
    PAN_FPS_SESSION_LIMIT,
    _0x2cc7e6,
    'canvas-pan',
  );
}
export function beginZoomFpsSession(_0x546051 = 'wheel-zoom') {
  beginFpsSession(ensureStore(), 'zoomSessions', _0x546051, 'wheel-zoom');
}
export function endZoomFpsSession(_0x19c40d = 'wheel-zoom') {
  return endFpsSession(
    ensureStore(),
    'zoomSessions',
    'zoomFpsSessions',
    ZOOM_FPS_SESSION_LIMIT,
    _0x19c40d,
    'wheel-zoom',
  );
}
export function beginResizeFpsSession(_0xf0f77e = 'node-resize') {
  beginFpsSession(ensureStore(), 'resizeSessions', _0xf0f77e, 'node-resize');
}
export function endResizeFpsSession(_0x314cdb = 'node-resize') {
  return endFpsSession(
    ensureStore(),
    'resizeSessions',
    'resizeFpsSessions',
    RESIZE_FPS_SESSION_LIMIT,
    _0x314cdb,
    'node-resize',
  );
}
export function recordEdgeRedrawSample(_0x4c0584, _0x3f2117, _0xd2b7b3 = {}) {
  const _0x1297f9 = ensureStore();
  if (!isEnabled(_0x1297f9)) return;
  const _0xf56382 = toFiniteNumber(_0x3f2117, 0);
  if (!Number.isFinite(_0xf56382) || _0xf56382 < 0) return;
  const _0xc6bc8f = {
    mode: String(_0x4c0584 || 'unknown'),
    durationMs: _0xf56382,
    reason: String(_0xd2b7b3.reason || ''),
    edgeCount: toFiniteNumber(_0xd2b7b3.edgeCount, 0),
    visibleEdgeCount: toFiniteNumber(_0xd2b7b3.visibleEdgeCount, 0),
    updatedCount: toFiniteNumber(_0xd2b7b3.updatedCount, 0),
    createdCount: toFiniteNumber(_0xd2b7b3.createdCount, 0),
    removedCount: toFiniteNumber(_0xd2b7b3.removedCount, 0),
    reusedCount: toFiniteNumber(_0xd2b7b3.reusedCount, 0),
    skippedInvisibleCount: toFiniteNumber(_0xd2b7b3.skippedInvisibleCount, 0),
    cacheSize: toFiniteNumber(_0xd2b7b3.cacheSize, 0),
    layoutReadMs: toFiniteNumber(_0xd2b7b3.layoutReadMs, 0),
    pathBuildMs: toFiniteNumber(_0xd2b7b3.pathBuildMs, 0),
    domWriteMs: toFiniteNumber(_0xd2b7b3.domWriteMs, 0),
    clearedDom: _0xd2b7b3.clearedDom === true,
    at: Date.now(),
  };
  pushCapped(_0x1297f9.edgeRedrawSamples, _0xc6bc8f, EDGE_REDRAW_SAMPLE_LIMIT);
}
export function recordCanvasPanSample(_0x52ac3d = {}) {
  const _0x127b7b = ensureStore();
  if (!isEnabled(_0x127b7b)) return;
  pushCapped(
    _0x127b7b.canvasPanSamples,
    {
      durationMs: toFiniteNumber(_0x52ac3d.durationMs, 0),
      moveCount: toFiniteNumber(_0x52ac3d.moveCount, 0),
      committed: _0x52ac3d.committed === true,
      nodeCount: toFiniteNumber(_0x52ac3d.nodeCount, 0),
      edgeCount: toFiniteNumber(_0x52ac3d.edgeCount, 0),
      mountedNodeCount: toFiniteNumber(_0x52ac3d.mountedNodeCount, 0),
      minimapPreviewCount: toFiniteNumber(_0x52ac3d.minimapPreviewCount, 0),
      finalX: toFiniteNumber(_0x52ac3d.finalX, 0),
      finalY: toFiniteNumber(_0x52ac3d.finalY, 0),
      finalZoom: toFiniteNumber(_0x52ac3d.finalZoom, 1),
      at: Date.now(),
    },
    CANVAS_PAN_SAMPLE_LIMIT,
  );
}
export function recordMinimapUpdateSample(_0x479be0, _0x4b0864, _0x1450c1 = {}) {
  const _0x42f7c8 = ensureStore();
  if (!isEnabled(_0x42f7c8)) return;
  pushCapped(
    _0x42f7c8.minimapUpdateSamples,
    {
      mode: String(_0x479be0 || 'unknown'),
      durationMs: toFiniteNumber(_0x4b0864, 0),
      nodeCount: toFiniteNumber(_0x1450c1.nodeCount, 0),
      dotCount: toFiniteNumber(_0x1450c1.dotCount, 0),
      createdCount: toFiniteNumber(_0x1450c1.createdCount, 0),
      updatedCount: toFiniteNumber(_0x1450c1.updatedCount, 0),
      removedCount: toFiniteNumber(_0x1450c1.removedCount, 0),
      viewportOnly: _0x1450c1.viewportOnly === true,
      delayed: _0x1450c1.delayed === true,
      at: Date.now(),
    },
    MINIMAP_UPDATE_SAMPLE_LIMIT,
  );
}
export function recordRenderFrameSample(_0x37851d = {}) {
  const _0x3d6159 = ensureStore();
  if (!isEnabled(_0x3d6159)) return;
  const _0x5ed1bb = toFiniteNumber(_0x37851d.durationMs, 0);
  if (!Number.isFinite(_0x5ed1bb) || _0x5ed1bb < 0) return;
  const _0xefe400 = sampleHasVisualContent(_0x37851d);
  (_0x3d6159.firstVisualMs === null &&
    _0xefe400 &&
    (_0x3d6159.firstVisualMs = getElapsedSinceProbeStart(_0x3d6159)),
    _0x3d6159.firstInteractiveMs === null &&
      String(_0x37851d.mode || '') === 'steady' &&
      _0xefe400 &&
      (_0x3d6159.firstInteractiveMs = getElapsedSinceProbeStart(_0x3d6159)),
    pushCapped(
      _0x3d6159.renderFrameSamples,
      {
        mode: String(_0x37851d.mode || 'unknown'),
        durationMs: _0x5ed1bb,
        nodeCount: toFiniteNumber(_0x37851d.nodeCount, 0),
        edgeCount: toFiniteNumber(_0x37851d.edgeCount, 0),
        mountedNodeCount: toFiniteNumber(_0x37851d.mountedNodeCount, 0),
        parkedNodeCount: toFiniteNumber(_0x37851d.parkedNodeCount, 0),
        fastPreviewCount: toFiniteNumber(_0x37851d.fastPreviewCount, 0),
        visibleFastPreviewCount: toFiniteNumber(_0x37851d.visibleFastPreviewCount, 0),
        previewWithMediaCount: toFiniteNumber(_0x37851d.previewWithMediaCount, 0),
        deferredMountedWithPreviewCount: toFiniteNumber(_0x37851d.deferredMountedWithPreviewCount, 0),
        at: Date.now(),
      },
      RENDER_FRAME_SAMPLE_LIMIT,
    ));
}
export function recordLongTaskSample(_0x528f86, _0xb45320 = {}) {
  const _0x46096b = ensureStore();
  if (!isEnabled(_0x46096b)) return;
  const _0x420f47 = toFiniteNumber(_0x528f86, 0);
  if (!Number.isFinite(_0x420f47) || _0x420f47 <= 0) return;
  ((_0x46096b.maxLongTaskMs = Math.max(toFiniteNumber(_0x46096b.maxLongTaskMs, 0), _0x420f47)),
    pushCapped(
      _0x46096b.longTaskSamples,
      {
        durationMs: _0x420f47,
        name: String(_0xb45320.name || ''),
        startTime: toFiniteNumber(_0xb45320.startTime, 0),
        source: String(_0xb45320.source || 'manual'),
        at: Date.now(),
      },
      LONG_TASK_SAMPLE_LIMIT,
    ));
}
export function recordRendererVirtualizationSample(_0x46f3a0 = {}) {
  const _0x2a5411 = ensureStore();
  if (!isEnabled(_0x2a5411)) return;
  pushCapped(
    _0x2a5411.virtualizationSamples,
    {
      cacheHit: _0x46f3a0.cacheHit === true,
      spatialIndex: _0x46f3a0.spatialIndex === true,
      snapshotRev: toFiniteNumber(_0x46f3a0.snapshotRev, 0),
      nodeCount: toFiniteNumber(_0x46f3a0.nodeCount, 0),
      mountCandidateCount: toFiniteNumber(_0x46f3a0.mountCandidateCount, 0),
      parkCandidateCount: toFiniteNumber(_0x46f3a0.parkCandidateCount, 0),
      keepAliveCount: toFiniteNumber(_0x46f3a0.keepAliveCount, 0),
      containerW: toFiniteNumber(_0x46f3a0.containerW, 0),
      containerH: toFiniteNumber(_0x46f3a0.containerH, 0),
      at: Date.now(),
    },
    VIRTUALIZATION_SAMPLE_LIMIT,
  );
}
export function resetPerfProbeData() {
  const _0x5ed097 = ensureStore();
  if (!_0x5ed097) return;
  for (const _0x3a82b6 of Object.values(_0x5ed097.dragSessions || {})) {
    _0x3a82b6 && _0x3a82b6.rafId !== null && cancelProbeFrame(_0x3a82b6.rafId);
  }
  for (const _0x229fe6 of Object.values(_0x5ed097.zoomSessions || {})) {
    _0x229fe6 && _0x229fe6.rafId !== null && cancelProbeFrame(_0x229fe6.rafId);
  }
  for (const _0x133137 of Object.values(_0x5ed097.resizeSessions || {})) {
    _0x133137 && _0x133137.rafId !== null && cancelProbeFrame(_0x133137.rafId);
  }
  ((_0x5ed097.dragSessions = {}), (_0x5ed097.dragFpsSessions = []));
  for (const _0x2b65bf of Object.values(_0x5ed097.panSessions || {})) {
    _0x2b65bf && _0x2b65bf.rafId !== null && cancelProbeFrame(_0x2b65bf.rafId);
  }
  ((_0x5ed097.panSessions = {}),
    (_0x5ed097.panFpsSessions = []),
    (_0x5ed097.canvasPanSamples = []),
    (_0x5ed097.zoomSessions = {}),
    (_0x5ed097.zoomFpsSessions = []),
    (_0x5ed097.resizeSessions = {}),
    (_0x5ed097.resizeFpsSessions = []),
    (_0x5ed097.edgeRedrawSamples = []),
    (_0x5ed097.renderFrameSamples = []),
    (_0x5ed097.virtualizationSamples = []),
    (_0x5ed097.minimapUpdateSamples = []),
    (_0x5ed097.longTaskSamples = []),
    Object.assign(_0x5ed097, createMilestoneState()));
}
export function getPerfProbeSnapshot() {
  const _0x4bd5b9 = ensureStore();
  if (!_0x4bd5b9)
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
    enabled: !!_0x4bd5b9.enabled,
    dragFpsSessions: Array.isArray(_0x4bd5b9.dragFpsSessions)
      ? _0x4bd5b9.dragFpsSessions.map((_0x763f44) => ({ ..._0x763f44 }))
      : [],
    panFpsSessions: Array.isArray(_0x4bd5b9.panFpsSessions)
      ? _0x4bd5b9.panFpsSessions.map((_0x3a8f0f) => ({ ..._0x3a8f0f }))
      : [],
    canvasPanSamples: Array.isArray(_0x4bd5b9.canvasPanSamples)
      ? _0x4bd5b9.canvasPanSamples.map((_0x5a9076) => ({ ..._0x5a9076 }))
      : [],
    zoomFpsSessions: Array.isArray(_0x4bd5b9.zoomFpsSessions)
      ? _0x4bd5b9.zoomFpsSessions.map((_0x42098b) => ({ ..._0x42098b }))
      : [],
    resizeFpsSessions: Array.isArray(_0x4bd5b9.resizeFpsSessions)
      ? _0x4bd5b9.resizeFpsSessions.map((_0x58463d) => ({ ..._0x58463d }))
      : [],
    edgeRedrawSamples: Array.isArray(_0x4bd5b9.edgeRedrawSamples)
      ? _0x4bd5b9.edgeRedrawSamples.map((_0x32c294) => ({ ..._0x32c294 }))
      : [],
    renderFrameSamples: Array.isArray(_0x4bd5b9.renderFrameSamples)
      ? _0x4bd5b9.renderFrameSamples.map((_0x470923) => ({ ..._0x470923 }))
      : [],
    virtualizationSamples: Array.isArray(_0x4bd5b9.virtualizationSamples)
      ? _0x4bd5b9.virtualizationSamples.map((_0x190e8b) => ({ ..._0x190e8b }))
      : [],
    minimapUpdateSamples: Array.isArray(_0x4bd5b9.minimapUpdateSamples)
      ? _0x4bd5b9.minimapUpdateSamples.map((_0x37defb) => ({ ..._0x37defb }))
      : [],
    longTaskSamples: Array.isArray(_0x4bd5b9.longTaskSamples)
      ? _0x4bd5b9.longTaskSamples.map((_0x33bf96) => ({ ..._0x33bf96 }))
      : [],
    mediaSchedulerStats: getCanvasMediaSchedulerStats(),
    staticMediaResourceSummary: summarizeStaticMediaResources(),
    firstVisualMs: _0x4bd5b9.firstVisualMs,
    firstInteractiveMs: _0x4bd5b9.firstInteractiveMs,
    maxLongTaskMs: toFiniteNumber(_0x4bd5b9.maxLongTaskMs, 0),
  };
}
