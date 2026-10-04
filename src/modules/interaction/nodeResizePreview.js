import { beginResizeFpsSession, endResizeFpsSession } from '../perf/perfProbe.js';
const RESIZE_BODY_CLASS = 'is-node-resizing',
  RESIZE_NODE_CLASS = 'is-resizing';
function requestFrame(value) {
  if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(value);
  return setTimeout(value, 0);
}
function cancelFrame(enabled) {
  if (!enabled) return;
  if (typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(enabled);
    return;
  }
  clearTimeout(enabled);
}
function toFiniteNumber(item, key) {
  const index = Number(item);
  return Number.isFinite(index) ? index : key;
}
function normalizeSize(box, result, data) {
  return {
    width: Math.max(1, toFiniteNumber(box?.width, result)),
    height: Math.max(1, toFiniteNumber(box?.height, data)),
  };
}
function sizesEqual(box2, box3) {
  return (
    Math.round(toFiniteNumber(box2?.width, 0)) === Math.round(toFiniteNumber(box3?.width, 0)) &&
    Math.round(toFiniteNumber(box2?.height, 0)) === Math.round(toFiniteNumber(box3?.height, 0))
  );
}
function applyPreviewSize(el, box4) {
  if (!el?.style) return;
  ((el.style.width = box4.width + 'px'), (el.style.height = box4.height + 'px'));
}
function syncPreviewGeometry(nodeId, width, options, target) {
  const enabled2 = typeof window !== 'undefined' ? window : null;
  if (!enabled2 || !nodeId || !width) return;
  enabled2.v2Renderer?.previewNodeResizeGeometry?.({
    nodeId: nodeId,
    width: width.width,
    height: width.height,
  });
  const run =
    typeof enabled2._v2UpdateSidePlusNow === 'function'
      ? enabled2._v2UpdateSidePlusNow
      : enabled2._v2UpdateSidePlus;
  if (typeof run !== 'function') return;
  run(
    Number.isFinite(enabled2._lastMx) ? enabled2._lastMx : options,
    Number.isFinite(enabled2._lastMy) ? enabled2._lastMy : target,
    { nodeSizeOverrides: { [nodeId]: { width: width.width, height: width.height } } },
  );
}
function readViewportZoom(handler) {
  const box5 = (typeof handler === 'function' && handler()) || { zoom: 1 };
  return Math.max(0.01, toFiniteNumber(box5.zoom, 1));
}
export function startNodeResizePreview({
  event: event,
  nodeId: nodeId2,
  getNode: getNode,
  getViewport: getViewport,
  resolveSize: resolveSize,
  applyPatch: applyPatch,
  buildFinalPatch: buildFinalPatch,
  afterApply: afterApply,
  onPreview: onPreview,
  onPreviewEnd: onPreviewEnd,
  commit: commit,
  label: label = 'node-resize',
} = {}) {
  if (!event || !nodeId2 || typeof resolveSize !== 'function') return false;
  (event.preventDefault?.(), event.stopPropagation?.());
  const startNode = (typeof getNode === 'function' && getNode()) || {},
    toFiniteNumber2 = toFiniteNumber(event.clientX, 0),
    toFiniteNumber3 = toFiniteNumber(event.clientY, 0),
    width2 = Math.max(1, toFiniteNumber(startNode.width, 0x104)),
    height = Math.max(1, toFiniteNumber(startNode.height, 0x104)),
    startSize = { width: width2, height: height },
    el2 = typeof document !== 'undefined' ? document.getElementById(nodeId2) : null,
    el3 = typeof document !== 'undefined' ? document.body : null;
  let enabled3 = null,
    source = startSize,
    toFiniteNumber4 = toFiniteNumber2,
    toFiniteNumber5 = toFiniteNumber3,
    requestFrame2 = 0,
    next = false;
  const run2 = () => {
      requestFrame2 = 0;
      if (!enabled3) return;
      ((source = enabled3),
        (enabled3 = null),
        applyPreviewSize(el2, source),
        syncPreviewGeometry(nodeId2, source, toFiniteNumber4, toFiniteNumber5),
        onPreview?.(source));
    },
    handler2 = (current) => {
      enabled3 = current;
      if (requestFrame2) return;
      requestFrame2 = requestFrame(run2);
    },
    handler3 = () => {
      (requestFrame2 && (cancelFrame(requestFrame2), (requestFrame2 = 0)),
        window.removeEventListener('pointermove', run3),
        window.removeEventListener('pointerup', run4),
        window.removeEventListener('pointercancel', run4),
        el3?.classList?.remove(RESIZE_BODY_CLASS),
        el2?.classList?.remove(RESIZE_NODE_CLASS),
        onPreviewEnd?.(),
        endResizeFpsSession(label));
    },
    handler4 = () => {
      const finalSize = enabled3 || source;
      if (enabled3) run2();
      const args =
          (typeof buildFinalPatch === 'function' &&
            buildFinalPatch({ startNode: startNode, startSize: startSize, finalSize: finalSize })) ||
          {},
        entry = Object.keys(args).length > 0,
        record = !sizesEqual(finalSize, startSize);
      let didApply = false;
      (record || entry) &&
        typeof applyPatch === 'function' &&
        (applyPatch({ width: finalSize.width, height: finalSize.height, ...args }), (didApply = true));
      syncPreviewGeometry(nodeId2, finalSize, toFiniteNumber4, toFiniteNumber5);
      const payload =
        typeof afterApply === 'function' &&
        afterApply({
          startNode: startNode,
          startSize: startSize,
          finalSize: finalSize,
          didApply: didApply,
        }) === true;
      (didApply || payload) && typeof commit === 'function' && commit();
    };
  function run3(event2) {
    if (next) return;
    ((toFiniteNumber4 = toFiniteNumber(event2.clientX, toFiniteNumber4)),
      (toFiniteNumber5 = toFiniteNumber(event2.clientY, toFiniteNumber5)));
    const viewportZoom = readViewportZoom(getViewport),
      dx = (toFiniteNumber4 - toFiniteNumber2) / viewportZoom,
      dy = (toFiniteNumber5 - toFiniteNumber3) / viewportZoom,
      size = normalizeSize(
        resolveSize({
          startNode: startNode,
          startWidth: width2,
          startHeight: height,
          dx: dx,
          dy: dy,
          event: event2,
        }),
        width2,
        height,
      );
    if (enabled3 && sizesEqual(enabled3, size)) return;
    if (!enabled3 && sizesEqual(source, size)) return;
    handler2(size);
  }
  function run4() {
    if (next) return;
    ((next = true), handler3(), handler4());
  }
  return (
    el3?.classList?.add(RESIZE_BODY_CLASS),
    el2?.classList?.add(RESIZE_NODE_CLASS),
    beginResizeFpsSession(label),
    window.addEventListener('pointermove', run3),
    window.addEventListener('pointerup', run4),
    window.addEventListener('pointercancel', run4),
    true
  );
}
