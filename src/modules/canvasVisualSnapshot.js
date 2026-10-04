const SNAPSHOT_SCHEMA_VERSION = 1,
  SNAPSHOT_MAX_WIDTH = 0x640,
  SNAPSHOT_MAX_HEIGHT = 0x3e8,
  SNAPSHOT_MIN_NODE_COUNT = 8,
  SNAPSHOT_JPEG_QUALITY = 0.68,
  SNAPSHOT_MIN_HOLD_MS = 0x384,
  SNAPSHOT_MAX_HOLD_MS = 0xaf0,
  SNAPSHOT_READY_POLL_MS = 0x1c2,
  SNAPSHOT_NODE_READY_RATIO = 0.95,
  SNAPSHOT_MEDIA_READY_RATIO = 0.94,
  SNAPSHOT_MEDIA_READY_TARGET = 36;
let overlayEl = null,
  overlayHideTimer = null,
  overlayPollTimer = null;
function getDocument() {
  return typeof document !== 'undefined' ? document : null;
}
function getWindow() {
  return typeof window !== 'undefined' ? window : globalThis;
}
function normalizeNodes(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
}
function normalizeEdges(item) {
  if (Array.isArray(item)) return item;
  if (item && typeof item === 'object') return Object.values(item);
  return [];
}
function normalizeViewport(box) {
  return {
    x: Number.isFinite(Number(box?.x)) ? Number(box.x) : 0,
    y: Number.isFinite(Number(box?.y)) ? Number(box.y) : 0,
    zoom: Number.isFinite(Number(box?.zoom)) && Number(box.zoom) > 0 ? Number(box.zoom) : 1,
  };
}
function getElementSize(el, key = 0x640, index = 0x384) {
  return {
    width: Math.max(1, Math.round(Number(el?.clientWidth) || key)),
    height: Math.max(1, Math.round(Number(el?.clientHeight) || index)),
  };
}
function getElementViewportRect(el2) {
  const box2 = el2?.getBoundingClientRect?.();
  if (!box2) return null;
  const width = Math.max(1, Math.round(Number(box2.width) || 1)),
    height = Math.max(1, Math.round(Number(box2.height) || 1));
  return {
    x: Math.max(0, Math.round(Number(box2.left) || 0)),
    y: Math.max(0, Math.round(Number(box2.top) || 0)),
    width: width,
    height: height,
  };
}
function isNodeVisible(box3, box4, result, data) {
  if (!box3?.id) return false;
  const options = box4.zoom || 1,
    target = (Number(box3.x) || 0) * options + box4.x,
    source = (Number(box3.y) || 0) * options + box4.y,
    count = Math.max(1, Number(box3.width) || 160) * options,
    count2 = Math.max(1, Number(box3.height) || 120) * options;
  return target + count > 0 && source + count2 > 0 && target < result && source < data;
}
function toScreenRect(box5, box6, next) {
  const current = box6.zoom || 1;
  return {
    x: ((Number(box5.x) || 0) * current + box6.x) * next,
    y: ((Number(box5.y) || 0) * current + box6.y) * next,
    width: Math.max(1, Number(box5.width) || 160) * current * next,
    height: Math.max(1, Number(box5.height) || 120) * current * next,
  };
}
function getCssColor(entry, record) {
  const dom = getDocument(),
    window2 = getWindow(),
    payload = dom?.documentElement || dom?.body;
  try {
    const handle = window2.getComputedStyle?.(payload)?.getPropertyValue?.(entry);
    return String(handle || '').trim() || record;
  } catch {
    return record;
  }
}
function roundRect(ctx, state, config, scope, input, output) {
  const value2 = Math.max(0, Math.min(output, scope / 2, input / 2));
  if (typeof ctx.roundRect === 'function') {
    (ctx.beginPath(), ctx.roundRect(state, config, scope, input, value2));
    return;
  }
  (ctx.beginPath(),
    ctx.moveTo(state + value2, config),
    ctx.lineTo(state + scope - value2, config),
    ctx.quadraticCurveTo(state + scope, config, state + scope, config + value2),
    ctx.lineTo(state + scope, config + input - value2),
    ctx.quadraticCurveTo(state + scope, config + input, state + scope - value2, config + input),
    ctx.lineTo(state + value2, config + input),
    ctx.quadraticCurveTo(state, config + input, state, config + input - value2),
    ctx.lineTo(state, config + value2),
    ctx.quadraticCurveTo(state, config, state + value2, config));
}
function findLoadedMediaElement(enabled) {
  const el3 = getDocument();
  if (!el3 || !enabled) return null;
  const value3 = el3.querySelectorAll?.('#v2-canvas .v2-fast-preview-node') || [];
  for (const el4 of value3) {
    if (String(el4?.dataset?.nodeId || '') !== String(enabled)) continue;
    const value4 = el4.querySelector?.('img');
    if (isMediaElementReady(value4)) return value4;
  }
  const el5 = el3.getElementById?.(enabled),
    value5 = ['.node-img', '.source-video-poster-frame', '.v2-fast-preview-media', 'img', 'video'];
  for (const value6 of value5) {
    const box7 = el5?.querySelector?.(value6);
    if (!box7) continue;
    if (box7.tagName === 'VIDEO') {
      if (box7.readyState >= 2 && Number(box7.videoWidth) > 0) return box7;
      continue;
    }
    if (box7.complete !== false && Number(box7.naturalWidth || box7.width || 0) > 0) return box7;
  }
  return null;
}
function nodeHasMediaLikeContent(enabled2) {
  if (!enabled2 || typeof enabled2 !== 'object') return false;
  const list = String(enabled2.type || '').toLowerCase();
  if (list.includes('image') || list.includes('video')) return true;
  const list2 = [
    'src',
    'imageUrl',
    'videoUrl',
    'localPath',
    'displayLocalPath',
    'thumbLocalPath',
    'thumbUrl',
    'posterUrl',
    'posterLocalPath',
    'capturePreviewUrl',
  ];
  if (list2.some((item2) => String(enabled2[item2] || '').trim())) return true;
  return (
    (Array.isArray(enabled2.images) && enabled2.images.length > 0) ||
    (Array.isArray(enabled2.videos) && enabled2.videos.length > 0)
  );
}
function countReadyVisibleMediaNodes(value7) {
  let value8 = 0;
  for (const value9 of value7 || []) {
    if (findLoadedMediaElement(value9?.id)) value8 += 1;
  }
  return value8;
}
function countExpectedVisibleMediaNodes(value10) {
  let value11 = 0;
  for (const value12 of value10 || []) {
    if (nodeHasMediaLikeContent(value12)) value11 += 1;
  }
  return value11;
}
function drawEdges(ctx2, value13, map, value14, value15, value16) {
  (ctx2.save(),
    (ctx2.strokeStyle = value16),
    (ctx2.lineWidth = Math.max(1, 1.2 * value15)),
    (ctx2.globalAlpha = 0.45));
  for (const value17 of value13) {
    const enabled3 = map.get(value17?.sourceId),
      enabled4 = map.get(value17?.targetId);
    if (!enabled3 || !enabled4) continue;
    const box8 = toScreenRect(enabled3, value14, value15),
      box9 = toScreenRect(enabled4, value14, value15),
      value18 = box8.x + box8.width,
      value19 = box8.y + box8.height / 2,
      value20 = box9.x,
      value21 = box9.y + box9.height / 2,
      value22 = Math.max(80 * value15, Math.abs(value20 - value18) * 0.42);
    (ctx2.beginPath(),
      ctx2.moveTo(value18, value19),
      ctx2.bezierCurveTo(value18 + value22, value19, value20 - value22, value21, value20, value21),
      ctx2.stroke());
  }
  ctx2.restore();
}
function drawNode(ctx3, error, value23, value24, response) {
  const box10 = toScreenRect(error, value23, value24);
  if (box10.width <= 0 || box10.height <= 0) return { drewMedia: false };
  const value25 = Math.max(4, Math.min(12 * value24, box10.width / 4, box10.height / 4));
  (ctx3.save(),
    roundRect(ctx3, box10.x, box10.y, box10.width, box10.height, value25),
    (ctx3.fillStyle = response.nodeFill),
    ctx3.fill(),
    (ctx3.strokeStyle = response.nodeStroke),
    (ctx3.lineWidth = Math.max(1, value24)),
    ctx3.stroke());
  let drewMedia = false;
  const loadedMediaElement = findLoadedMediaElement(error.id);
  if (loadedMediaElement)
    try {
      (ctx3.save(),
        roundRect(ctx3, box10.x, box10.y, box10.width, box10.height, value25),
        ctx3.clip(),
        ctx3.drawImage(loadedMediaElement, box10.x, box10.y, box10.width, box10.height),
        ctx3.restore(),
        (drewMedia = true));
    } catch {}
  const list3 = String(error.name || error.type || '').trim();
  return (
    list3 &&
      box10.width > 48 &&
      box10.height > 32 &&
      ((ctx3.fillStyle = response.text),
      (ctx3.globalAlpha = 0.82),
      (ctx3.font = Math.max(8, Math.min(12, box10.width / 14)) * value24 + 'px system-ui, sans-serif'),
      ctx3.fillText(list3.slice(0, 24), box10.x + 6 * value24, box10.y + 14 * value24)),
    ctx3.restore(),
    { drewMedia: drewMedia }
  );
}
export function normalizeCanvasVisualSnapshot(box11) {
  if (!box11 || typeof box11 !== 'object') return null;
  const src = String(box11.src || '').trim();
  if (!src.startsWith('data:image/')) return null;
  return {
    schemaVersion: Number(box11.schemaVersion) || SNAPSHOT_SCHEMA_VERSION,
    src: src,
    width: Math.max(1, Math.round(Number(box11.width) || 1)),
    height: Math.max(1, Math.round(Number(box11.height) || 1)),
    viewport: normalizeViewport(box11.viewport),
    capturedAt: Number(box11.capturedAt) || Date.now(),
    visibleNodeCount: Math.max(0, Math.round(Number(box11.visibleNodeCount) || 0)),
    mediaNodeCount: Math.max(0, Math.round(Number(box11.mediaNodeCount) || 0)),
    readyMediaNodeCount: Math.max(0, Math.round(Number(box11.readyMediaNodeCount) || 0)),
  };
}
export function captureCanvasVisualSnapshot({
  canvasEl: canvasEl,
  containerEl: containerEl = null,
  nodes: nodes,
  edges: edges,
  viewport: viewport,
  force: force = false,
} = {}) {
  const el6 = getDocument();
  if (!el6 || typeof el6.createElement !== 'function' || !canvasEl) return null;
  const list4 = normalizeNodes(nodes);
  if (!force && list4.length < SNAPSHOT_MIN_NODE_COUNT) return null;
  const box12 = getElementSize(containerEl || canvasEl),
    viewport2 = normalizeViewport(viewport),
    visibleNodeCount = list4.filter((item3) => isNodeVisible(item3, viewport2, box12.width, box12.height));
  if (!force && visibleNodeCount.length < SNAPSHOT_MIN_NODE_COUNT) return null;
  const value26 = Math.min(1, SNAPSHOT_MAX_WIDTH / box12.width, SNAPSHOT_MAX_HEIGHT / box12.height),
    width2 = Math.max(1, Math.round(box12.width * value26)),
    height2 = Math.max(1, Math.round(box12.height * value26)),
    box13 = el6.createElement('canvas');
  ((box13.width = width2), (box13.height = height2));
  const ctx4 = box13.getContext?.('2d', { alpha: false });
  if (!ctx4) return null;
  const value27 = {
    bg: getCssColor('--bg', 'Canvas'),
    edge: getCssColor('--stroke-default', 'GrayText'),
    nodeFill: getCssColor('--bg-panel-card', 'ButtonFace'),
    nodeStroke: getCssColor('--stroke-default', 'GrayText'),
    text: getCssColor('--text-primary', 'CanvasText'),
  };
  ((ctx4.fillStyle = value27.bg), ctx4.fillRect(0, 0, width2, height2));
  const value28 = new Map(list4.map((item4) => [item4?.id, item4]));
  drawEdges(ctx4, normalizeEdges(edges), value28, viewport2, value26, value27.edge);
  let mediaNodeCount = 0;
  for (const value29 of visibleNodeCount) {
    const drawNode2 = drawNode(ctx4, value29, viewport2, value26, value27);
    if (drawNode2.drewMedia) mediaNodeCount += 1;
  }
  try {
    const src2 = box13.toDataURL('image/jpeg', SNAPSHOT_JPEG_QUALITY);
    if (!src2.startsWith('data:image/')) return null;
    return {
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      src: src2,
      width: width2,
      height: height2,
      viewport: viewport2,
      capturedAt: Date.now(),
      visibleNodeCount: visibleNodeCount.length,
      mediaNodeCount: mediaNodeCount,
      readyMediaNodeCount: mediaNodeCount,
    };
  } catch {
    return null;
  }
}
export async function captureCanvasVisualSnapshotFromElectron({
  canvasEl: canvasEl2,
  containerEl: containerEl = null,
  nodes: nodes2,
  viewport: viewport3,
  force: force = false,
} = {}) {
  const document2 = getDocument(),
    window3 = getWindow()?.electronAPI?.canvasVisualSnapshot,
    enabled5 = containerEl || canvasEl2;
  if (!document2 || !enabled5 || typeof window3?.capturePage !== 'function') return null;
  if (overlayEl?.isConnected && !overlayEl.classList?.contains?.('is-hiding')) return null;
  const list5 = normalizeNodes(nodes2);
  if (!force && list5.length < SNAPSHOT_MIN_NODE_COUNT) return null;
  const box14 = getElementSize(enabled5),
    viewport4 = normalizeViewport(viewport3),
    visibleNodeCount2 = list5.filter((item5) => isNodeVisible(item5, viewport4, box14.width, box14.height));
  if (!force && visibleNodeCount2.length < SNAPSHOT_MIN_NODE_COUNT) return null;
  const rect = getElementViewportRect(enabled5);
  if (!rect) return null;
  let box15 = null;
  try {
    box15 = await window3.capturePage({
      rect: rect,
      maxWidth: SNAPSHOT_MAX_WIDTH,
      maxHeight: SNAPSHOT_MAX_HEIGHT,
    });
  } catch {
    box15 = null;
  }
  const src3 = String(box15?.src || '').trim();
  if (box15?.ok !== true || !src3.startsWith('data:image/')) return null;
  const readyMediaNodeCount = countReadyVisibleMediaNodes(visibleNodeCount2),
    mediaNodeCount2 = countExpectedVisibleMediaNodes(visibleNodeCount2);
  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    src: src3,
    width: Math.max(1, Math.round(Number(box15.width) || rect.width)),
    height: Math.max(1, Math.round(Number(box15.height) || rect.height)),
    viewport: viewport4,
    capturedAt: Number(box15.capturedAt) || Date.now(),
    visibleNodeCount: visibleNodeCount2.length,
    mediaNodeCount: mediaNodeCount2,
    readyMediaNodeCount: readyMediaNodeCount,
  };
}
function clearOverlayTimers() {
  if (overlayHideTimer !== null) clearTimeout(overlayHideTimer);
  if (overlayPollTimer !== null) clearTimeout(overlayPollTimer);
  ((overlayHideTimer = null), (overlayPollTimer = null));
}
export function hideCanvasVisualSnapshotOverlay() {
  clearOverlayTimers();
  const el7 = overlayEl;
  overlayEl = null;
  if (!el7) return;
  (el7.classList?.add?.('is-hiding'), setTimeout(() => el7.remove?.(), 180));
}
function isMediaElementReady(box16) {
  if (!box16) return false;
  if (box16.tagName === 'VIDEO')
    return box16.readyState >= 2 && Number(box16.videoWidth || box16.width || 0) > 0;
  return box16.complete !== false && Number(box16.naturalWidth || box16.width || 0) > 0;
}
function countReadyMedia() {
  const el8 = getDocument(),
    mountedNodeCount = el8?.querySelectorAll?.('#v2-canvas .v2-node') || [],
    previewNodeCount = el8?.querySelectorAll?.('#v2-canvas .v2-fast-preview-node') || [],
    value30 =
      el8?.querySelectorAll?.(
        '#v2-canvas .v2-node img, #v2-canvas .v2-node video, #v2-canvas .v2-fast-preview-node img',
      ) || [];
  let readyMedia = 0;
  for (const value31 of value30) {
    if (isMediaElementReady(value31)) readyMedia += 1;
  }
  const visualNodeCount = new Set();
  for (const el9 of mountedNodeCount) {
    const value32 = String(el9?.id || el9?.dataset?.nodeId || '').trim();
    if (value32) visualNodeCount.add(value32);
  }
  for (const el10 of previewNodeCount) {
    const value33 = String(el10?.dataset?.nodeId || '').trim();
    if (value33) visualNodeCount.add(value33);
  }
  return {
    mountedNodeCount: mountedNodeCount.length || 0,
    previewNodeCount: previewNodeCount.length || 0,
    visualNodeCount: visualNodeCount.size || mountedNodeCount.length || 0,
    readyMedia: readyMedia,
  };
}
function pollOverlayReadiness(value34, value35) {
  if (!overlayEl) return;
  const value36 = Date.now() - value35,
    count3 = Math.max(0, Number(value34.visibleNodeCount) || 0),
    count4 = Math.max(0, Number(value34.mediaNodeCount) || 0),
    { visualNodeCount: visualNodeCount2, readyMedia: readyMedia2 } = countReadyMedia(),
    value37 = count3 <= 0 || visualNodeCount2 >= Math.max(1, count3 * SNAPSHOT_NODE_READY_RATIO),
    value38 =
      count4 <= 0 ||
      readyMedia2 >= Math.max(1, Math.min(SNAPSHOT_MEDIA_READY_TARGET, count4 * SNAPSHOT_MEDIA_READY_RATIO));
  if (value36 >= SNAPSHOT_MAX_HOLD_MS) {
    hideCanvasVisualSnapshotOverlay();
    return;
  }
  if (value36 >= SNAPSHOT_MIN_HOLD_MS && value37 && value38) {
    hideCanvasVisualSnapshotOverlay();
    return;
  }
  overlayPollTimer = setTimeout(() => pollOverlayReadiness(value34, value35), SNAPSHOT_READY_POLL_MS);
}
export function showCanvasVisualSnapshotOverlay(value39) {
  hideCanvasVisualSnapshotOverlay();
  const canvasVisualSnapshot = normalizeCanvasVisualSnapshot(value39),
    el11 = getDocument();
  if (!el11 || !canvasVisualSnapshot) return false;
  const el12 = el11.getElementById?.('v2-wrap') || el11.getElementById?.('v2-container') || el11.body;
  if (!el12 || typeof el11.createElement !== 'function') return false;
  const el13 = el11.createElement('div');
  ((el13.className = 'canvas-visual-snapshot-overlay'),
    el13.setAttribute?.('aria-hidden', 'true'),
    (el13.dataset.visibleNodeCount = String(canvasVisualSnapshot.visibleNodeCount || 0)),
    (el13.dataset.mediaNodeCount = String(canvasVisualSnapshot.mediaNodeCount || 0)));
  const value40 = el11.createElement('img');
  ((value40.className = 'canvas-visual-snapshot-image'),
    (value40.alt = ''),
    (value40.decoding = 'async'),
    (value40.draggable = false),
    (value40.src = canvasVisualSnapshot.src),
    el13.appendChild?.(value40),
    el12.appendChild?.(el13),
    (overlayEl = el13));
  const window4 = getWindow(),
    handler = () => overlayEl === el13 && el13.classList?.add?.('is-visible');
  return (
    typeof window4.requestAnimationFrame === 'function' ? window4.requestAnimationFrame(handler) : handler(),
    pollOverlayReadiness(canvasVisualSnapshot, Date.now()),
    true
  );
}
