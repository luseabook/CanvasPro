import { computeNodesWorldBounds } from './math.js';
import { getRendererNodeLabelKind } from './rendererNodePresentation.js';
import { canReuseRasterPaint } from './rendererRasterPaintPlan.js';
import { createRendererRasterPaintSurface } from './rendererRasterPaintSurface.js';
import { isCanvasImageDisplayLoadPending, preloadCanvasImage } from '../modules/canvasMediaScheduler.js';
const DEFAULT_NODE_WIDTH = 160,
  DEFAULT_NODE_HEIGHT = 120,
  DEFAULT_WORLD_PADDING = 48,
  DEFAULT_MAX_CANVAS_DIMENSION = 4096,
  DEFAULT_MAX_BITMAP_PIXELS = 8 * 1024 * 1024,
  DEFAULT_MAX_DPR = 2,
  DEFAULT_MAX_IMAGE_CACHE = 640,
  DEFAULT_MAX_NEW_IMAGES_PER_SYNC = 24,
  DEFAULT_DENSE_MAX_NEW_IMAGES_PER_SYNC = 48,
  DEFAULT_MAX_READY_IMAGES_PER_FRAME = 8,
  DEFAULT_DENSE_MAX_READY_IMAGES_PER_FRAME = 16,
  DENSE_READY_REVEAL_NODE_COUNT = 320;
function finiteNumber(value, item = 0) {
  const key = Number(value);
  return Number.isFinite(key) ? key : item;
}
function positiveInteger(index, result) {
  const count = Math.trunc(finiteNumber(index, result));
  return count > 0 ? count : result;
}
function normalizeIdSet(enabled) {
  const data = new Set();
  if (!enabled || typeof enabled[Symbol.iterator] !== 'function') return data;
  for (const options of enabled) {
    const target = String(options?.id ?? options ?? '').trim();
    if (target) data.add(target);
  }
  return data;
}
function resolveMediaLoadingBusy(source) {
  if (source && Object.prototype.hasOwnProperty.call(source, 'mediaLoadingBusy'))
    return source.mediaLoadingBusy === true;
  return source?.viewportBusy === true;
}
function normalizeSources(next) {
  const current =
      typeof next === 'string'
        ? [next]
        : Array.isArray(next)
          ? next
          : Array.isArray(next?.sources)
            ? next.sources
            : [next?.source, next?.src],
    list = [],
    map = new Set();
  for (const entry of current || []) {
    const enabled2 = String(entry || '').trim();
    if (!enabled2 || map.has(enabled2)) continue;
    (map.add(enabled2), list.push(enabled2));
  }
  return list;
}
function getNode(map2, record) {
  if (map2 instanceof Map) return map2.get(record) || null;
  return map2?.[record] || null;
}
function getCandidateIds(map3, payload) {
  if (payload && typeof payload[Symbol.iterator] === 'function') return normalizeIdSet(payload);
  if (map3 instanceof Map) return normalizeIdSet(map3.keys());
  return normalizeIdSet(Object.keys(map3 || {}));
}
function getNodeKind(handle) {
  const rendererNodeLabelKind = getRendererNodeLabelKind(handle?.type);
  if (rendererNodeLabelKind) return rendererNodeLabelKind;
  const list2 = String(handle?.type || '').toLowerCase();
  if (list2.includes('video') || list2.includes('media-clip')) return 'video';
  if (list2.includes('image')) return 'image';
  if (list2.includes('text') || list2.includes('comment')) return 'text';
  if (list2.includes('group')) return 'group';
  return 'node';
}
function getNodeLabel(error, state) {
  const config =
    state === 'video'
      ? 'Video'
      : state === 'image'
        ? 'Image'
        : state === 'text'
          ? 'Text'
          : state === 'group'
            ? 'Group'
            : 'Node';
  return String(error?.name || error?.title || error?.text || error?.prompt || config)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, state === 'text' ? 96 : 36);
}
function getCssColor(scope, input, output) {
  try {
    const value2 = scope?.getPropertyValue?.(input);
    return String(value2 || '').trim() || output;
  } catch {
    return output;
  }
}
function readPalette(dom) {
  const value3 = dom?.documentElement || dom?.body,
    value4 = dom?.defaultView || globalThis.window;
  let value5 = null;
  try {
    value5 = value4?.getComputedStyle?.(value3) || null;
  } catch {}
  return {
    nodeFill: getCssColor(value5, '--surface-node', 'ButtonFace'),
    nodeStroke: getCssColor(value5, '--stroke-default', 'GrayText'),
    text: getCssColor(value5, '--text-primary', 'CanvasText'),
    placeholder: getCssColor(value5, '--text-secondary', 'GrayText'),
    nodeLabel: getCssColor(value5, '--white-40', 'GrayText'),
  };
}
function getPaletteThemeKey(dom2) {
  const value6 = dom2?.documentElement || dom2?.body,
    value7 = value6?.getAttribute?.('data-theme') || '',
    value8 = String(value6?.className || ''),
    value9 = String(dom2?.readyState || '');
  return value9 + '\x1f' + value7 + '\x1f' + value8;
}
function applyPaletteOverrides(response, nodeFill = {}) {
  return {
    nodeFill: nodeFill.nodeFill || response.nodeFill,
    nodeStroke: nodeFill.nodeStroke || response.nodeStroke,
    text: nodeFill.text || response.text,
    placeholder: nodeFill.placeholder || response.placeholder,
    nodeLabel: nodeFill.nodeLabel || response.nodeLabel,
  };
}
function formatCssNumber(value10) {
  const value11 = Math.abs(value10) < 0.0001 ? 0 : value10;
  return String(value11);
}
function normalizeExplicitWorldBounds(box) {
  if (!box || typeof box !== 'object') return null;
  const left = finiteNumber(box.left ?? box.minX, NaN),
    top = finiteNumber(box.top ?? box.minY, NaN),
    width = finiteNumber(box.width, finiteNumber(box.maxX, NaN) - left),
    height = finiteNumber(box.height, finiteNumber(box.maxY, NaN) - top);
  if (!Number.isFinite(left) || !Number.isFinite(top) || !(width > 0) || !(height > 0)) return null;
  return { left: left, top: top, width: width, height: height };
}
function computeRasterWorldBounds(value12, value13) {
  const explicitWorldBounds = normalizeExplicitWorldBounds(value13?.worldBounds);
  if (explicitWorldBounds) return explicitWorldBounds;
  const nodesWorldBounds = computeNodesWorldBounds(value12);
  if (!nodesWorldBounds) return null;
  const value14 = Math.max(0, finiteNumber(value13?.worldPadding, DEFAULT_WORLD_PADDING)),
    left2 = Math.floor(nodesWorldBounds.minX - value14),
    top2 = Math.floor(nodesWorldBounds.minY - value14),
    value15 = Math.ceil(nodesWorldBounds.maxX + value14),
    value16 = Math.ceil(nodesWorldBounds.maxY + value14);
  return {
    left: left2,
    top: top2,
    width: Math.max(1, value15 - left2),
    height: Math.max(1, value16 - top2),
  };
}
function createEmptyStats(revision = 0, supported = false) {
  return {
    active: false,
    supported: supported,
    drawnNodeIds: [],
    drawnMediaNodeIds: [],
    drawnNodeCount: 0,
    mediaDrawCount: 0,
    mediaSourceCount: 0,
    placeholderCount: 0,
    candidateCount: 0,
    excludedNodeCount: 0,
    bitmapWidth: 0,
    bitmapHeight: 0,
    cssWidth: 0,
    cssHeight: 0,
    dpr: 1,
    renderScale: 1,
    effectiveScale: 1,
    rasterScale: 1,
    revision: revision,
    worldBounds: null,
    cachedImageCount: 0,
    pendingImageCount: 0,
    readyImageCount: 0,
    loadedImageCount: 0,
    errorImageCount: 0,
    cacheLimit: 0,
    cacheHitCount: 0,
    cacheMissCount: 0,
    skippedBusyImageCount: 0,
    startedImageCount: 0,
    revealedImageCount: 0,
  };
}
function defaultRequestFrame(handler) {
  if (typeof globalThis.requestAnimationFrame === 'function')
    return globalThis.requestAnimationFrame(handler);
  return (handler(), null);
}
function defaultCancelFrame(value17) {
  value17 != null &&
    typeof globalThis.cancelAnimationFrame === 'function' &&
    globalThis.cancelAnimationFrame(value17);
}
function drawImageCover(ctx, box2, box3) {
  const count2 = Math.max(
      0,
      finiteNumber(box2?.naturalWidth ?? box2?.videoWidth ?? box2?.width, 0),
    ),
    count3 = Math.max(
      0,
      finiteNumber(box2?.naturalHeight ?? box2?.videoHeight ?? box2?.height, 0),
    );
  try {
    if (!(count2 > 0 && count3 > 0))
      return (ctx.drawImage(box2, box3.x, box3.y, box3.width, box3.height), true);
    const value18 = count2 / count3,
      value19 = box3.width / box3.height;
    let value20 = 0,
      value21 = 0,
      value22 = count2,
      value23 = count3;
    if (value18 > value19) ((value22 = count3 * value19), (value20 = (count2 - value22) / 2));
    else value18 < value19 && ((value23 = count2 / value19), (value21 = (count3 - value23) / 2));
    return (
      ctx.drawImage(
        box2,
        value20,
        value21,
        value22,
        value23,
        box3.x,
        box3.y,
        box3.width,
        box3.height,
      ),
      true
    );
  } catch {
    return false;
  }
}
function strokeRoundedRect(ctx2, value24, value25, value26, value27, value28) {
  if (typeof ctx2.roundRect === 'function') {
    (ctx2.beginPath(), ctx2.roundRect(value24, value25, value26, value27, value28), ctx2.stroke());
    return;
  }
  ctx2.strokeRect(value24, value25, value26, value27);
}
function strokeCircle(ctx3, value29, value30, value31) {
  if (typeof ctx3.arc !== 'function') return;
  (ctx3.beginPath(), ctx3.arc(value29, value30, value31, 0, Math.PI * 2), ctx3.stroke());
}
function drawMediaTypeIcon(ctx4, value32, value33, value34, count4, count5) {
  if (!['image', 'video'].includes(value32)) return false;
  if (!(count4 > 0) || count4 * count5 < 3) return false;
  const value35 = count4 / 24,
    value36 = value33 - count4 / 2,
    value37 = value34 - count4 / 2,
    handler2 = (value38) => value36 + value38 * value35,
    handler3 = (value39) => value37 + value39 * value35;
  ctx4.lineWidth = Math.min(3.2, Math.max(1.2, 0.7 / Math.max(0.01, count5)));
  if (value32 === 'image')
    return (
      strokeRoundedRect(ctx4, handler2(3), handler3(3), 18 * value35, 18 * value35, 2 * value35),
      strokeCircle(ctx4, handler2(8.5), handler3(8.5), 1.5 * value35),
      ctx4.beginPath(),
      ctx4.moveTo(handler2(21), handler3(15)),
      ctx4.lineTo(handler2(16), handler3(10)),
      ctx4.lineTo(handler2(5), handler3(21)),
      ctx4.stroke(),
      true
    );
  if (value32 === 'video')
    return (
      strokeRoundedRect(ctx4, handler2(1), handler3(5), 15 * value35, 14 * value35, 2 * value35),
      ctx4.beginPath(),
      ctx4.moveTo(handler2(23), handler3(7)),
      ctx4.lineTo(handler2(16), handler3(12)),
      ctx4.lineTo(handler2(23), handler3(0x11)),
      ctx4.closePath(),
      ctx4.stroke(),
      true
    );
  return false;
}
function drawPlaceholder(ctx5, box4, value40, count6, value41) {
  const value42 = Math.min(40, box4.width * 0.32, box4.height * 0.32);
  ((ctx5.strokeStyle = value40.placeholder), (ctx5.globalAlpha = value41 * 0.72));
  const drawMediaTypeIcon2 = drawMediaTypeIcon(
    ctx5,
    box4.kind,
    box4.x + box4.width / 2,
    box4.y + box4.height / 2,
    value42,
    count6,
  );
  if (!drawMediaTypeIcon2) {
    const value43 = Math.min(18, Math.max(10, box4.height * 0.12));
    value43 * count6 >= 7 &&
      ((ctx5.fillStyle = value40.placeholder),
      (ctx5.font = '500 ' + value43 + 'px system-ui, sans-serif'),
      ctx5.fillText(
        box4.label,
        box4.x + 8,
        box4.y + box4.height / 2 + value43 * 0.35,
        Math.max(1, box4.width - 16),
      ));
  }
  ctx5.globalAlpha = value41;
}
function drawNodeLabel(ctx6, box5, value44, count7, value45) {
  if (!['image', 'video'].includes(box5.kind)) return;
  const value46 = 21;
  if (value46 * count7 < 3) return;
  const value47 = value46 * 1.33;
  ((ctx6.globalAlpha = value45 * 0.64),
    (ctx6.strokeStyle = value44.nodeLabel),
    (ctx6.fillStyle = value44.nodeLabel),
    drawMediaTypeIcon(
      ctx6,
      box5.kind,
      box5.x + value47 / 2,
      box5.y - 8 - value47 / 2,
      value47,
      count7,
    ));
  const value48 = '500 ' + value46 + 'px system-ui, sans-serif';
  if (ctx6.font !== value48) ctx6.font = value48;
  (ctx6.fillText(
    box5.label,
    box5.x + value47 + 6,
    box5.y - 10,
    Math.max(1, box5.width - value47 - 6),
  ),
    (ctx6.globalAlpha = value45));
}
export function createRendererRasterPreviewLayer({
  documentRef: documentRef = globalThis.document,
  resolveMediaSources: resolveMediaSources = null,
  createImage: createImage = null,
  requestFrame: requestFrame = defaultRequestFrame,
  cancelFrame: cancelFrame = defaultCancelFrame,
  maxImageCache: maxImageCache = DEFAULT_MAX_IMAGE_CACHE,
  maxNewImagesPerSync: maxNewImagesPerSync = null,
  maxReadyImagesPerFrame: maxReadyImagesPerFrame = null,
  maxCanvasDimension: maxCanvasDimension = DEFAULT_MAX_CANVAS_DIMENSION,
  maxBitmapPixels: maxBitmapPixels = DEFAULT_MAX_BITMAP_PIXELS,
  maxDpr: maxDpr = DEFAULT_MAX_DPR,
  onMediaPresented: onMediaPresented = null,
} = {}) {
  const cacheLimit = Math.max(0, Math.trunc(finiteNumber(maxImageCache, DEFAULT_MAX_IMAGE_CACHE))),
    count8 = Number(maxNewImagesPerSync),
    value49 = maxNewImagesPerSync != null && Number.isFinite(count8) && count8 >= 0,
    value50 = value49 ? Math.max(0, Math.trunc(count8)) : DEFAULT_MAX_NEW_IMAGES_PER_SYNC,
    value51 = value49 ? value50 : DEFAULT_DENSE_MAX_NEW_IMAGES_PER_SYNC,
    count9 = Number(maxReadyImagesPerFrame),
    value52 = Number.isFinite(count9) && count9 > 0,
    value53 = value52 ? Math.max(1, Math.trunc(count9)) : DEFAULT_MAX_READY_IMAGES_PER_FRAME,
    value54 = value52 ? value53 : DEFAULT_DENSE_MAX_READY_IMAGES_PER_FRAME,
    cachedImageCount = new Map(),
    map4 = new Map();
  let el = null,
    ctx7 = null,
    rendererRasterPaintSurface = null,
    enabled3 = false,
    enabled4 = false,
    value55 = false,
    revision2 = 0,
    revision3 = { ...createEmptyStats(), cacheLimit: cacheLimit },
    candidateCount = null,
    value56 = null,
    value57 = 0,
    value58 = 0,
    value59 = null,
    value60 = null,
    palette = null;
  function run() {
    value58 += 1;
    const enabled5 = value59;
    value59 = null;
    if (!enabled5) return;
    if (enabled5.kind === 'idle' && typeof globalThis.cancelIdleCallback === 'function')
      globalThis.cancelIdleCallback(enabled5.id);
    else enabled5.kind === 'timer' && clearTimeout(enabled5.id);
  }
  function run2() {
    if (!el || (el.width <= 1 && el.height <= 1)) return;
    run();
    const value61 = value58,
      value62 = () => {
        if (value61 !== value58) return;
        value59 = null;
        if (value55 || !el || (candidateCount?.items?.length || 0) > 0) return;
        rendererRasterPaintSurface?.resize(1, 1);
      };
    typeof globalThis.requestIdleCallback === 'function'
      ? (value59 = { kind: 'idle', id: globalThis.requestIdleCallback(value62, { timeout: 500 }) })
      : (value59 = { kind: 'timer', id: setTimeout(value62, 96) });
  }
  function run3(value63) {
    const paletteThemeKey = getPaletteThemeKey(documentRef);
    return (
      (!palette || paletteThemeKey !== value60) &&
        ((palette = readPalette(documentRef)), (value60 = paletteThemeKey)),
      value63 && typeof value63 === 'object' ? applyPaletteOverrides(palette, value63) : palette
    );
  }
  function run4(args) {
    let pendingImageCount = 0,
      readyImageCount = 0,
      loadedImageCount = 0,
      errorImageCount = 0;
    for (const response2 of cachedImageCount.values()) {
      if (response2.status === 'pending') pendingImageCount += 1;
      else {
        if (response2.status === 'ready') readyImageCount += 1;
        else {
          if (response2.status === 'loaded') loadedImageCount += 1;
          else {
            if (response2.status === 'error') errorImageCount += 1;
          }
        }
      }
    }
    revision3 = {
      ...args,
      cachedImageCount: cachedImageCount.size,
      mediaSourceCount: cachedImageCount.size,
      pendingImageCount: pendingImageCount,
      readyImageCount: readyImageCount,
      loadedImageCount: loadedImageCount,
      errorImageCount: errorImageCount,
      cacheLimit: cacheLimit,
    };
    if (el) {
      el.__aicanvasRasterPreviewStats = revision3;
      const ready = new Set(revision3.drawnMediaNodeIds || []);
      el.__aicanvasRasterPreviewRevealItems = (candidateCount?.items || [])
        .filter((value64) => value64.kind === 'image' && value64.sources.length > 0)
        .map((height2) => {
          const list3 = run5(height2),
            source2 = list3.find((value65) => cachedImageCount.get(value65)?.status === 'loaded');
          return {
            height: height2.height,
            kind: height2.kind,
            nodeId: height2.id,
            ready: ready.has(height2.id),
            source: source2 || list3[0] || height2.sources[0] || '',
            width: height2.width,
            x: height2.x,
            y: height2.y,
          };
        })
        .filter((value66) => value66.source);
    }
    return revision3;
  }
  function run6() {
    for (const response3 of cachedImageCount.values()) {
      if (response3.status === 'ready') return true;
    }
    return false;
  }
  function run7() {
    let value67 = 0;
    for (const response4 of cachedImageCount.values()) {
      if (response4.status === 'pending') value67 += 1;
    }
    return value67;
  }
  function run8(value68 = value53) {
    const list4 = [];
    for (const response5 of cachedImageCount.values()) {
      if (response5.status !== 'ready') continue;
      ((response5.status = 'loaded'), list4.push(response5.source));
      if (list4.length >= value68) break;
    }
    return list4;
  }
  function run9() {
    value57 += 1;
    if (value56 != null) cancelFrame(value56);
    value56 = null;
  }
  function run10() {
    if (value55 || !candidateCount || candidateCount.viewportBusy || value56 != null) return;
    const value69 = ++value57;
    let enabled6 = false;
    const requestFrame2 = requestFrame(() => {
      enabled6 = true;
      if (value69 !== value57 || value55) return;
      ((value56 = null), run11());
    });
    if (!enabled6) value56 = requestFrame2;
  }
  function run12(enabled7) {
    if (!enabled7 || enabled7.listenersRemoved) return;
    enabled7.listenersRemoved = true;
    const { image: image, onLoad: onLoad, onError: onError } = enabled7;
    if (typeof image?.removeEventListener === 'function')
      (image.removeEventListener('load', onLoad), image.removeEventListener('error', onError));
    else {
      if (image) {
        if (image.onload === onLoad) image.onload = null;
        if (image.onerror === onError) image.onerror = null;
      }
    }
  }
  function run13(enabled8) {
    if (!enabled8) return;
    run12(enabled8);
    try {
      if (enabled8.ownsImage === true && enabled8.image) enabled8.image.src = '';
    } catch {}
  }
  function run14(value70) {
    const enabled9 = cachedImageCount.get(value70);
    if (!enabled9) return false;
    return (cachedImageCount.delete(value70), run13(enabled9), true);
  }
  function run15(enabled10) {
    if (!enabled10 || cachedImageCount.get(enabled10.source) !== enabled10) return;
    (cachedImageCount.delete(enabled10.source),
      cachedImageCount.set(enabled10.source, enabled10));
  }
  function run16(map5 = null) {
    for (const [value71] of cachedImageCount) {
      if (map5 instanceof Set ? map5.has(value71) : value71 === map5) continue;
      return run14(value71);
    }
    return false;
  }
  function run17(source3, value72 = null) {
    if (!source3 || cacheLimit <= 0) return null;
    while (cachedImageCount.size >= cacheLimit) {
      if (!run16(value72 || source3)) return null;
    }
    const image2 = typeof createImage === 'function' ? createImage() : null,
      response6 = {
        image: image2,
        ownsImage: !!image2,
        listenersRemoved: false,
        onError: null,
        onLoad: null,
        source: source3,
        status: 'pending',
      };
    cachedImageCount.set(source3, response6);
    if (!image2)
      return (
        preloadCanvasImage(source3, {
          decode: true,
          requireImage: true,
          priority: 5,
          fetchPriority: 'auto',
          scope: 'renderer-raster-preview',
          deferWhenPaused: true,
        }).then(
          (enabled11) => {
            if (cachedImageCount.get(source3) !== response6 || response6.status !== 'pending') return;
            if (!enabled11?.image) {
              ((response6.status = 'error'), run10());
              return;
            }
            ((response6.image = enabled11.image),
              (response6.status = 'ready'),
              run15(response6),
              run10());
          },
          () => {
            if (cachedImageCount.get(source3) !== response6) return;
            ((response6.status = 'error'), run10());
          },
        ),
        response6
      );
    ((response6.onLoad = () => {
      if (cachedImageCount.get(source3) !== response6) return;
      run12(response6);
      const run18 = () => {
        if (cachedImageCount.get(source3) !== response6 || response6.status !== 'pending') return;
        ((response6.status = 'ready'), run15(response6), run10());
      };
      try {
        const promise = typeof image2.decode === 'function' ? image2.decode() : null;
        promise && typeof promise.then === 'function'
          ? Promise.resolve(promise).then(run18, run18)
          : run18();
      } catch {
        run18();
      }
    }),
      (response6.onError = () => {
        if (cachedImageCount.get(source3) !== response6) return;
        ((response6.status = 'error'), run12(response6), run10());
      }));
    typeof image2.addEventListener === 'function'
      ? (image2.addEventListener('load', response6.onLoad),
        image2.addEventListener('error', response6.onError))
      : ((image2.onload = response6.onLoad), (image2.onerror = response6.onError));
    try {
      ((image2.decoding = 'async'), (image2.src = source3));
    } catch {
      ((response6.status = 'error'), run12(response6));
    }
    return response6;
  }
  function run19(el2) {
    if (value55 || !el2 || typeof documentRef?.createElement !== 'function') return false;
    !el &&
      ((el = documentRef.createElement('canvas')),
      (el.className = 'v2-raster-preview-canvas'),
      (el.dataset.role = 'raster-preview-canvas'),
      el.setAttribute?.('data-role', 'raster-preview-canvas'),
      el.setAttribute?.('aria-hidden', 'true'),
      Object.assign(el.style, {
        display: 'none',
        height: '1px',
        left: '0px',
        top: '0px',
        width: '1px',
      }));
    if (el.parentNode !== el2) el2.appendChild?.(el);
    return (
      !enabled3 &&
        ((enabled3 = true),
        (rendererRasterPaintSurface = createRendererRasterPaintSurface(el)),
        (ctx7 = rendererRasterPaintSurface.context),
        (enabled4 = Boolean(
          ctx7 &&
          typeof ctx7.setTransform === 'function' &&
          typeof ctx7.clearRect === 'function' &&
          typeof ctx7.fillRect === 'function' &&
          typeof ctx7.strokeRect === 'function' &&
          typeof ctx7.drawImage === 'function',
        )),
        !enabled4 && ((ctx7 = null), (el.style.display = 'none'))),
      enabled4
    );
  }
  function run20(value73, value74, options2) {
    const candidateCount2 = getCandidateIds(value73, value74),
      map6 = normalizeIdSet(options2?.excludedNodeIds),
      value75 = String(options2?.sourceNodeId || '').trim(),
      value76 = String(options2?.hoverNodeId || '').trim();
    if (value75) map6.add(value75);
    if (value76) map6.add(value76);
    const invalid = normalizeIdSet(options2?.invalidNodeIds),
      handler4 =
        typeof options2?.resolveMediaSources === 'function'
          ? options2.resolveMediaSources
          : resolveMediaSources,
      items = [];
    let excludedNodeCount = 0;
    for (const nodeId of candidateCount2) {
      if (map6.has(nodeId)) {
        excludedNodeCount += 1;
        continue;
      }
      const box6 = getNode(value73, nodeId);
      if (!box6 || typeof box6 !== 'object') continue;
      const width2 = Math.max(1, finiteNumber(box6.width, DEFAULT_NODE_WIDTH)),
        height3 = Math.max(1, finiteNumber(box6.height, DEFAULT_NODE_HEIGHT)),
        kind = getNodeKind(box6);
      if (kind === 'audio') continue;
      let sources = [];
      if (typeof handler4 === 'function')
        try {
          sources = normalizeSources(handler4(box6, { nodeId: nodeId, options: options2 }));
        } catch {
          sources = [];
        }
      items.push({
        height: height3,
        id: nodeId,
        invalid: invalid.has(nodeId),
        kind: kind,
        label: getNodeLabel(box6, kind),
        sources: sources,
        width: width2,
        x: finiteNumber(box6.x, 0),
        y: finiteNumber(box6.y, 0),
      });
    }
    const mediaLoadNodeIds =
        options2?.mediaLoadNodeIds == null ? null : normalizeIdSet(options2.mediaLoadNodeIds),
      list5 =
        mediaLoadNodeIds === null
          ? items
          : [
              ...items.filter((value77) => mediaLoadNodeIds.has(value77.id)),
              ...items.filter(
                (value78) =>
                  !mediaLoadNodeIds.has(value78.id) &&
                  value78.sources.some((value79) => cachedImageCount.has(value79)),
              ),
            ],
      admittedSources = new Set(),
      value80 = list5.reduce(
        (value81, value82) => Math.max(value81, value82.sources.length),
        0,
      );
    for (let value83 = 0; value83 < value80 && admittedSources.size < cacheLimit; value83 += 1) {
      for (const value84 of list5) {
        const value85 = value84.sources[value83];
        if (value85) admittedSources.add(value85);
        if (admittedSources.size >= cacheLimit) break;
      }
    }
    return {
      admittedSources: admittedSources,
      mediaLoadNodeIds: mediaLoadNodeIds,
      candidateCount: candidateCount2.size,
      excludedNodeCount: excludedNodeCount,
      items: items,
      options: options2,
      paintScaleKey: [
        options2?.dpr ?? globalThis.devicePixelRatio ?? 1,
        options2?.viewport?.zoom ?? options2?.zoom,
        options2?.renderScale,
        options2?.maxDpr,
        options2?.maxCanvasDimension,
        options2?.maxBitmapPixels,
      ].join('|'),
      palette: items.length > 0 ? run3(options2?.palette) : palette,
      viewportBusy: resolveMediaLoadingBusy(options2),
      worldBounds: computeRasterWorldBounds(items, options2),
    };
  }
  function run21(box7, box8) {
    const dpr = Math.max(
        0.1,
        finiteNumber(box8?.dpr, finiteNumber(globalThis.devicePixelRatio, 1)),
      ),
      value86 = Math.max(0.0001, finiteNumber(box8?.viewport?.zoom ?? box8?.zoom, 1)),
      renderScale = Math.max(0.0001, finiteNumber(box8?.renderScale, value86 * dpr)),
      value87 = Math.max(0.1, finiteNumber(box8?.maxDpr, maxDpr)),
      value88 = Math.min(renderScale, value87),
      positiveInteger2 = positiveInteger(
        box8?.maxCanvasDimension,
        positiveInteger(maxCanvasDimension, DEFAULT_MAX_CANVAS_DIMENSION),
      ),
      positiveInteger3 = positiveInteger(
        box8?.maxBitmapPixels,
        positiveInteger(maxBitmapPixels, DEFAULT_MAX_BITMAP_PIXELS),
      );
    let effectiveScale = Math.max(
        0.0001,
        Math.min(
          value88,
          positiveInteger2 / box7.width,
          positiveInteger2 / box7.height,
          Math.sqrt(positiveInteger3 / (box7.width * box7.height)),
        ),
      ),
      bitmapWidth = Math.max(
        1,
        Math.min(positiveInteger2, Math.floor(box7.width * effectiveScale)),
      ),
      bitmapHeight = Math.max(
        1,
        Math.min(positiveInteger2, Math.floor(box7.height * effectiveScale)),
      );
    if (bitmapWidth * bitmapHeight > positiveInteger3) {
      const value89 = Math.sqrt(positiveInteger3 / (bitmapWidth * bitmapHeight));
      ((bitmapWidth = Math.max(1, Math.floor(bitmapWidth * value89))),
        (bitmapHeight = Math.max(1, Math.floor(bitmapHeight * value89))));
    }
    return (
      (effectiveScale = Math.min(
        effectiveScale,
        bitmapWidth / box7.width,
        bitmapHeight / box7.height,
      )),
      rendererRasterPaintSurface.resize(bitmapWidth, bitmapHeight),
      Object.assign(el.style, {
        display: 'block',
        height: formatCssNumber(box7.height) + 'px',
        left: formatCssNumber(box7.left) + 'px',
        top: formatCssNumber(box7.top) + 'px',
        width: formatCssNumber(box7.width) + 'px',
      }),
      ctx7.setTransform(1, 0, 0, 1, 0, 0),
      ctx7.clearRect(0, 0, bitmapWidth, bitmapHeight),
      ctx7.setTransform(
        effectiveScale,
        0,
        0,
        effectiveScale,
        box7.left === 0 ? 0 : -box7.left * effectiveScale,
        box7.top === 0 ? 0 : -box7.top * effectiveScale,
      ),
      (ctx7.imageSmoothingEnabled = true),
      (ctx7.imageSmoothingQuality = 'low'),
      {
        bitmapHeight: bitmapHeight,
        bitmapWidth: bitmapWidth,
        dpr: dpr,
        effectiveScale: effectiveScale,
        rasterScale: effectiveScale,
        renderScale: renderScale,
      }
    );
  }
  function run5(value90) {
    const map7 = candidateCount?.admittedSources;
    return value90.sources.filter((value91) => map7?.has(value91));
  }
  function run22(value92, value93) {
    const value94 = run5(value92);
    for (const value95 of value94) {
      const response7 = cachedImageCount.get(value95);
      if (response7?.status !== 'loaded') continue;
      (run15(response7), (value93.cacheHitCount += 1));
      if (drawImageCover(ctx7, response7.image, value92))
        return (map4.set(value92.id, value95), true);
    }
    return false;
  }
  function run23(value96, value97) {
    if (candidateCount?.mediaLoadNodeIds && !candidateCount.mediaLoadNodeIds.has(value96.id))
      return false;
    const value98 = candidateCount?.admittedSources,
      value99 = run5(value96);
    for (const value100 of value99) {
      const response8 = cachedImageCount.get(value100);
      if (
        response8?.status === 'pending' ||
        response8?.status === 'ready' ||
        response8?.status === 'loaded'
      )
        return false;
      if (response8?.status === 'error') continue;
      if (isCanvasImageDisplayLoadPending(value100)) return false;
      value97.cacheMissCount += 1;
      if (value97.viewportBusy) return ((value97.skippedBusyImageCount += 1), false);
      if (value97.newImageStartsRemaining <= 0) return false;
      value97.newImageStartsRemaining -= 1;
      const value101 = run17(value100, value98);
      if (value101) value97.startedImageCount += 1;
      return false;
    }
    return false;
  }
  function run24(value102, value103) {
    if (value102.sources.length === 0) return false;
    if (run22(value102, value103)) return true;
    return (run23(value102, value103), false);
  }
  function run25(box9, value104, value105, value106) {
    const value107 = box9.invalid ? 0.38 : 1,
      enabled12 = box9.kind === 'image' || box9.kind === 'video';
    ctx7.globalAlpha = value107;
    !enabled12 &&
      ((ctx7.fillStyle = value104.nodeFill),
      ctx7.fillRect(box9.x, box9.y, box9.width, box9.height));
    const enabled13 = run24(box9, value106);
    if (!enabled13) {
      if (enabled12) return ((ctx7.globalAlpha = 1), false);
      drawPlaceholder(ctx7, box9, value104, value105, value107);
    }
    return (
      (ctx7.globalAlpha = value107),
      (ctx7.strokeStyle = value104.nodeStroke),
      (ctx7.lineWidth = Math.max(1 / value105, 0.5)),
      ctx7.strokeRect(box9.x, box9.y, box9.width, box9.height),
      drawNodeLabel(ctx7, box9, value104, value105, value107),
      enabled13
    );
  }
  function run26(list6, value108) {
    const count10 = Number(value108?.maxNewImagesPerSync),
      value109 = Number.isFinite(count10) && count10 >= 0;
    return value109
      ? Math.max(0, Math.trunc(count10))
      : list6.length >= DENSE_READY_REVEAL_NODE_COUNT
        ? value51
        : value50;
  }
  function run27(value110, newImageStartsRemaining) {
    const value111 = run7();
    return {
      cacheHitCount: 0,
      cacheMissCount: 0,
      newImageStartsRemaining: newImageStartsRemaining
        ? 0
        : Math.min(value110, Math.max(0, value110 - value111)),
      skippedBusyImageCount: 0,
      startedImageCount: 0,
      viewportBusy: newImageStartsRemaining,
    };
  }
  function run11() {
    if (value55 || !candidateCount || candidateCount.viewportBusy || !enabled4 || !el || !ctx7)
      return revision3;
    const { items: items2, options: options3, palette: palette2, worldBounds: worldBounds } = candidateCount;
    if (!worldBounds || items2.length === 0 || revision3.active !== true) return run28();
    revision2 += 1;
    const value112 = items2.length >= DENSE_READY_REVEAL_NODE_COUNT ? value54 : value53,
      revealedImageCount = new Set(run8(value112)),
      value113 = Math.max(0.0001, finiteNumber(revision3.rasterScale, 1)),
      mediaDrawCount = new Set(revision3.drawnMediaNodeIds || []),
      nodeIds = [],
      cacheHitCount = run27(0, false);
    if (revealedImageCount.size > 0)
      for (const enabled14 of items2) {
        if (
          mediaDrawCount.has(enabled14.id) ||
          !enabled14.sources.some((value114) => revealedImageCount.has(value114))
        )
          continue;
        run25(enabled14, palette2, value113, cacheHitCount) &&
          (mediaDrawCount.add(enabled14.id), nodeIds.push(enabled14.id));
      }
    const value115 = run26(items2, options3);
    cacheHitCount.newImageStartsRemaining = Math.min(value115, Math.max(0, value115 - run7()));
    for (const value116 of items2) {
      if (mediaDrawCount.has(value116.id)) continue;
      run23(value116, cacheHitCount);
      if (cacheHitCount.newImageStartsRemaining <= 0) break;
    }
    if (nodeIds.length > 0) rendererRasterPaintSurface.present();
    const value117 = run4({
      ...revision3,
      drawnMediaNodeIds: [...mediaDrawCount],
      mediaDrawCount: mediaDrawCount.size,
      placeholderCount: items2.reduce(
        (value118, value119) =>
          value118 +
          Number(
            value119.kind !== 'image' &&
              value119.kind !== 'video' &&
              !mediaDrawCount.has(value119.id),
          ),
        0,
      ),
      revision: revision2,
      cacheHitCount: cacheHitCount.cacheHitCount,
      cacheMissCount: cacheHitCount.cacheMissCount,
      skippedBusyImageCount: cacheHitCount.skippedBusyImageCount,
      startedImageCount: cacheHitCount.startedImageCount,
      revealedImageCount: revealedImageCount.size,
    });
    if (nodeIds.length > 0 && typeof onMediaPresented === 'function')
      try {
        onMediaPresented({ nodeIds: nodeIds, revision: revision2 });
      } catch {}
    if (run6()) run10();
    return value117;
  }
  function run28() {
    if (value55 || !candidateCount || !enabled4 || !el || !ctx7) return revision3;
    ((revision2 += 1), map4.clear());
    const { items: items3, options: options4, palette: palette3, worldBounds: worldBounds2 } = candidateCount,
      value120 = items3.length >= DENSE_READY_REVEAL_NODE_COUNT ? value54 : value53,
      revealedImageCount2 = candidateCount.viewportBusy ? 0 : run8(value120).length;
    if (!worldBounds2 || items3.length === 0)
      return (
        (el.style.display = 'none'),
        run2(),
        run4({
          ...createEmptyStats(revision2, true),
          candidateCount: candidateCount.candidateCount,
          excludedNodeCount: candidateCount.excludedNodeCount,
        })
      );
    run();
    const bitmapWidth2 = run21(worldBounds2, options4),
      value121 = run26(items3, options4),
      cacheHitCount2 = run27(value121, candidateCount.viewportBusy),
      active = [],
      drawnMediaNodeIds = [];
    let placeholderCount = 0;
    ctx7.lineWidth = Math.max(1 / bitmapWidth2.rasterScale, 0.5);
    for (const value122 of items3) {
      const value123 = run25(value122, palette3, bitmapWidth2.rasterScale, cacheHitCount2);
      if (value123) drawnMediaNodeIds.push(value122.id);
      else value122.kind !== 'image' && value122.kind !== 'video' && (placeholderCount += 1);
      active.push(value122.id);
    }
    rendererRasterPaintSurface.present();
    const value124 = run4({
      active: active.length > 0,
      supported: true,
      drawnNodeIds: active,
      drawnMediaNodeIds: drawnMediaNodeIds,
      drawnNodeCount: active.length,
      mediaDrawCount: drawnMediaNodeIds.length,
      placeholderCount: placeholderCount,
      candidateCount: candidateCount.candidateCount,
      excludedNodeCount: candidateCount.excludedNodeCount,
      bitmapWidth: bitmapWidth2.bitmapWidth,
      bitmapHeight: bitmapWidth2.bitmapHeight,
      cssWidth: worldBounds2.width,
      cssHeight: worldBounds2.height,
      dpr: bitmapWidth2.dpr,
      renderScale: bitmapWidth2.renderScale,
      effectiveScale: bitmapWidth2.effectiveScale,
      rasterScale: bitmapWidth2.rasterScale,
      revision: revision2,
      worldBounds: { ...worldBounds2 },
      cacheHitCount: cacheHitCount2.cacheHitCount,
      cacheMissCount: cacheHitCount2.cacheMissCount,
      skippedBusyImageCount: cacheHitCount2.skippedBusyImageCount,
      startedImageCount: cacheHitCount2.startedImageCount,
      revealedImageCount: revealedImageCount2,
    });
    if (!candidateCount.viewportBusy && run6()) run10();
    return value124;
  }
  function sync(value125, value126, list7, value127 = {}) {
    const value128 =
      value127?.viewportBusy === true &&
      value127?.reuseWhileBusy === true &&
      value127?.forceRender !== true &&
      revision3.active &&
      (Number(list7?.size) > 0 || Number(list7?.length) > 0);
    if (value128 && run19(value125)) {
      const mediaLoadingBusy = resolveMediaLoadingBusy(value127);
      candidateCount && (candidateCount.viewportBusy = mediaLoadingBusy);
      if (mediaLoadingBusy) run9();
      else {
        if (run6()) run10();
      }
      return revision3;
    }
    run9();
    const candidateCount3 = run20(value126, list7, value127);
    if ((!candidateCount3.worldBounds || candidateCount3.items.length === 0) && !el)
      return (
        (revision2 += 1),
        (candidateCount = candidateCount3),
        run4({
          ...createEmptyStats(revision2, true),
          candidateCount: candidateCount3.candidateCount,
          excludedNodeCount: candidateCount3.excludedNodeCount,
        })
      );
    if (!run19(value125))
      return (
        (revision2 += 1),
        (candidateCount = null),
        run4({
          ...createEmptyStats(revision2, false),
          candidateCount: candidateCount3.candidateCount,
          excludedNodeCount: candidateCount3.excludedNodeCount,
        })
      );
    const value129 =
      revision3.active &&
      value127?.forceRender !== true &&
      canReuseRasterPaint(candidateCount, candidateCount3) &&
      candidateCount3.items.every((value130) => {
        if (!map4.has(value130.id)) return true;
        const value131 = value130.sources.find(
          (value132) =>
            candidateCount3.admittedSources.has(value132) &&
            ['loaded', 'ready'].includes(cachedImageCount.get(value132)?.status),
        );
        return value131 === map4.get(value130.id);
      });
    candidateCount = candidateCount3;
    if (value129) return run11();
    return run28();
  }
  function excludeNode(value133) {
    const enabled15 = String(value133 || '').trim();
    if (!enabled15 || !candidateCount) return false;
    const list8 = candidateCount.items || [],
      items4 = list8.filter((value134) => value134.id !== enabled15);
    if (items4.length === list8.length) return false;
    return (
      run9(),
      (candidateCount = {
        ...candidateCount,
        excludedNodeCount: Number(candidateCount.excludedNodeCount || 0) + 1,
        items: items4,
        worldBounds: computeRasterWorldBounds(items4, candidateCount.options),
      }),
      run28(),
      true
    );
  }
  function captureNodeFrame(value135) {
    const nodeId2 = String(value135 || '').trim();
    if (
      !nodeId2 ||
      value55 ||
      !el ||
      !enabled4 ||
      !candidateCount ||
      !revision3?.worldBounds ||
      typeof documentRef?.createElement !== 'function'
    )
      return null;
    const height4 = candidateCount.items?.find?.((value136) => value136.id === nodeId2);
    if (!height4) return null;
    const value137 = height4.kind === 'image' || height4.kind === 'video';
    if (value137 && !(revision3.drawnMediaNodeIds || []).includes(nodeId2)) return null;
    const box10 = revision3.worldBounds,
      value138 = Math.max(0.0001, finiteNumber(revision3.effectiveScale, 1)),
      value139 = (height4.x - box10.left) * value138,
      value140 = (height4.y - box10.top) * value138,
      value141 = height4.width * value138,
      value142 = height4.height * value138,
      value143 = Math.max(0, value139),
      value144 = Math.max(0, value140),
      value145 = Math.min(el.width, value139 + value141),
      value146 = Math.min(el.height, value140 + value142),
      count11 = value145 - value143,
      count12 = value146 - value144;
    if (!(count11 > 0) || !(count12 > 0)) return null;
    const canvas = documentRef.createElement('canvas');
    ((canvas.width = Math.max(1, Math.ceil(value141))),
      (canvas.height = Math.max(1, Math.ceil(value142))));
    const ctx8 = canvas.getContext?.('2d', { alpha: true }) || null;
    if (!ctx8 || typeof ctx8.drawImage !== 'function') return null;
    const value147 = canvas.width / value141,
      value148 = canvas.height / value142;
    try {
      ctx8.drawImage(
        el,
        value143,
        value144,
        count11,
        count12,
        (value143 - value139) * value147,
        (value144 - value140) * value148,
        count11 * value147,
        count12 * value148,
      );
    } catch {
      return null;
    }
    return {
      canvas: canvas,
      height: height4.height,
      kind: height4.kind,
      label: height4.label,
      nodeId: nodeId2,
      revision: revision3.revision,
      sources: [...height4.sources],
      width: height4.width,
    };
  }
  function setMediaLoadingBusy(value149) {
    if (value55 || !candidateCount) return revision3;
    const value150 = candidateCount.viewportBusy;
    candidateCount.viewportBusy = value149 === true;
    if (candidateCount.viewportBusy) run9();
    else value150 && run6() ? run11() : run10();
    return run4(revision3);
  }
  function prune(options5 = {}) {
    if (value55) return revision3;
    let map8 = null,
      value151 = cacheLimit;
    if (options5 && typeof options5[Symbol.iterator] === 'function') map8 = normalizeIdSet(options5);
    else
      options5 &&
        typeof options5 === 'object' &&
        (Object.prototype.hasOwnProperty.call(options5, 'keepSources') &&
          (map8 = normalizeIdSet(options5.keepSources)),
        (value151 = Math.max(0, Math.trunc(finiteNumber(options5.maxEntries, cacheLimit)))));
    let value152 = false;
    for (const [value153, response9] of Array.from(cachedImageCount.entries())) {
      ((map8 && !map8.has(value153)) || (!map8 && response9.status === 'error')) &&
        (value152 = run14(value153) || value152);
    }
    while (cachedImageCount.size > value151) {
      const enabled16 = run16();
      if (!enabled16) break;
      value152 = true;
    }
    if (value152 && candidateCount && enabled4) {
      const value154 = candidateCount.viewportBusy;
      candidateCount.viewportBusy = true;
      const value155 = run28();
      return ((candidateCount.viewportBusy = value154), value155);
    }
    return run4(revision3);
  }
  function destroy() {
    if (value55) return;
    ((value55 = true), run(), run9(), (candidateCount = null));
    for (const value156 of cachedImageCount.values()) run13(value156);
    (cachedImageCount.clear(), map4.clear(), (revision2 += 1));
    const el3 = el;
    ((revision3 = { ...createEmptyStats(revision2, enabled4), cacheLimit: cacheLimit }),
      el3 &&
        ((el3.__aicanvasRasterPreviewStats = revision3),
        (el3.__aicanvasRasterPreviewRevealItems = []),
        (el3.width = 1),
        (el3.height = 1),
        (el3.style.display = 'none'),
        el3.remove?.()),
      rendererRasterPaintSurface?.release(),
      (rendererRasterPaintSurface = null),
      (el = null),
      (ctx7 = null));
  }
  function getStats() {
    return revision3;
  }
  return {
    sync: sync,
    captureNodeFrame: captureNodeFrame,
    excludeNode: excludeNode,
    setMediaLoadingBusy: setMediaLoadingBusy,
    prune: prune,
    destroy: destroy,
    getStats: getStats,
  };
}
