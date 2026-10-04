import { computeNodesWorldBounds, computeViewportForWorldBounds } from './math.js';
import { jumpZoomPercentToViewportZoom } from '../modules/commentNoteJumpShortcut.js';
function _getWindowObject(value) {
  if (value) return value;
  if (typeof window !== 'undefined') return window;
  return null;
}
function _getRaf() {
  return typeof globalThis.requestAnimationFrame === 'function'
    ? globalThis.requestAnimationFrame.bind(globalThis)
    : (handler) => setTimeout(() => handler(Date.now()), 16);
}
function _getCaf() {
  return typeof globalThis.cancelAnimationFrame === 'function'
    ? globalThis.cancelAnimationFrame.bind(globalThis)
    : (item) => clearTimeout(item);
}
function _getDefaultViewport() {
  return { x: 0, y: 0, zoom: 1 };
}
function _normalizeViewportRect(key, index, result, data) {
  const left = Number.isFinite(Number(key)) ? Number(key) : 0,
    top = Number.isFinite(Number(index)) ? Number(index) : 0,
    width = Number.isFinite(Number(result)) ? Number(result) : 0,
    height = Number.isFinite(Number(data)) ? Number(data) : 0;
  return {
    left: left,
    top: top,
    width: width,
    height: height,
    right: left + width,
    bottom: top + height,
    centerX: left + width / 2,
    centerY: top + height / 2,
  };
}
export function getBrowserViewportRect({
  windowObject: windowObject = undefined,
  containerEl: containerEl = null,
} = {}) {
  const _getWindowObject2 = _getWindowObject(windowObject),
    box = _getWindowObject2?.visualViewport || null;
  if (
    box &&
    Number.isFinite(Number(box.width)) &&
    Number.isFinite(Number(box.height)) &&
    Number(box.width) > 0 &&
    Number(box.height) > 0
  )
    return _normalizeViewportRect(box.offsetLeft, box.offsetTop, box.width, box.height);
  if (containerEl && typeof containerEl.getBoundingClientRect === 'function') {
    const box2 = containerEl.getBoundingClientRect();
    if (
      Number.isFinite(Number(box2?.width)) &&
      Number.isFinite(Number(box2?.height)) &&
      Number(box2.width) > 0 &&
      Number(box2.height) > 0
    )
      return _normalizeViewportRect(box2.left, box2.top, box2.width, box2.height);
  }
  return _normalizeViewportRect(
    0,
    0,
    Number(_getWindowObject2?.innerWidth) || 0,
    Number(_getWindowObject2?.innerHeight) || 0,
  );
}
function _resolveMaxZoom(options, target) {
  if (typeof options === 'number' && Number.isFinite(options)) return options;
  if (options && typeof options === 'object' && Number.isFinite(Number(options.maxZoom)))
    return Number(options.maxZoom);
  return target;
}
export function createViewportFocusController({
  store: store,
  animateViewport: animateViewport,
  cancelAnimation: cancelAnimation,
  containerEl: containerEl = null,
  windowObject: windowObject = undefined,
  minZoom: minZoom = 0.2,
  maxZoom: maxZoom = 2,
  resolveZoomPercent: resolveZoomPercent = jumpZoomPercentToViewportZoom,
} = {}) {
  const windowObject2 = _getWindowObject(windowObject),
    handler2 = _getRaf(),
    handler3 = _getCaf();
  let args = null,
    value2 = null;
  const run = () => {
      if (typeof store?.getStateRaw === 'function') return store.getStateRaw();
      if (typeof store?.getState === 'function') return store.getState();
      return {};
    },
    handler4 = (source, next, current) => {
      store?.updateViewport?.(source, next, current);
    },
    handler5 = () => {
      store?.markViewportPersist?.();
    },
    handler6 = () => {
      const run2 =
        typeof windowObject2?._v2UpdateSidePlusNow === 'function'
          ? windowObject2._v2UpdateSidePlusNow
          : windowObject2?._v2UpdateSidePlus;
      if (typeof run2 === 'function') {
        const entry = Number(windowObject2._lastMx),
          record = Number(windowObject2._lastMy);
        run2(Number.isFinite(entry) ? entry : undefined, Number.isFinite(record) ? record : undefined);
      }
    };
  function clearTrackedFocus() {
    if (args) cancelAnimation?.();
    ((args = null), value2 !== null && (handler3(value2), (value2 = null)));
  }
  function getTrackedFocusRequest() {
    return args ? { ...args } : null;
  }
  function run3(enabled) {
    if (!enabled) return null;
    const viewport = run(),
      payload = viewport?.nodes || {},
      browserViewportRect = getBrowserViewportRect({ windowObject: windowObject2, containerEl: containerEl });
    let nodesWorldBounds = null,
      handle = { minZoom: minZoom, maxZoom: maxZoom };
    enabled.type === 'node-zoom-percent'
      ? ((nodesWorldBounds = computeNodesWorldBounds(payload, [enabled.nodeId])),
        (handle.fixedZoom = resolveZoomPercent(enabled.zoomPercent)))
      : ((nodesWorldBounds = computeNodesWorldBounds(payload, enabled.nodeIds)),
        (handle.padding = enabled.padding),
        (handle.maxZoom = _resolveMaxZoom(enabled.options, maxZoom)));
    if (!nodesWorldBounds) return null;
    const target2 = computeViewportForWorldBounds(nodesWorldBounds, browserViewportRect, handle);
    if (!target2) return null;
    return { target: target2, viewport: viewport?.viewport || _getDefaultViewport() };
  }
  function reapplyTrackedFocusNow() {
    value2 = null;
    if (!args) return false;
    const enabled2 = run3(args);
    if (!enabled2) return (clearTrackedFocus(), false);
    const { target: target3, viewport: viewport2 } = enabled2;
    if (viewport2.x === target3.x && viewport2.y === target3.y && viewport2.zoom === target3.zoom)
      return true;
    return (cancelAnimation?.(), handler4(target3.x, target3.y, target3.zoom), handler5(), handler6(), true);
  }
  function run4() {
    if (!args || value2 !== null) return;
    value2 = handler2(() => {
      reapplyTrackedFocusNow();
    });
  }
  function run5(args2) {
    const enabled3 = run3(args2);
    if (!enabled3) return (clearTrackedFocus(), false);
    args = { ...args2 };
    const { viewport: viewport3, target: target4 } = enabled3;
    return (
      animateViewport?.(
        viewport3.x,
        viewport3.y,
        viewport3.zoom,
        target4.x,
        target4.y,
        target4.zoom,
        args2.durationMs,
      ),
      true
    );
  }
  function focusNode(state, padding = 120, durationMs = 0x5dc, options2 = null) {
    return run5({
      type: 'nodes-fit',
      nodeIds: [state],
      padding: padding,
      durationMs: durationMs,
      options: options2,
    });
  }
  function focusNodes(list, padding2 = 80, durationMs2 = 0x320, options3 = null) {
    if (!Array.isArray(list) || list.length === 0) return (clearTrackedFocus(), false);
    return run5({
      type: 'nodes-fit',
      nodeIds: [...list],
      padding: padding2,
      durationMs: durationMs2,
      options: options3,
    });
  }
  function focusNodeAtZoomPercent(nodeId, zoomPercent = 60, durationMs3 = 0x320) {
    return run5({
      type: 'node-zoom-percent',
      nodeId: nodeId,
      zoomPercent: zoomPercent,
      durationMs: durationMs3,
    });
  }
  const config = () => run4();
  (windowObject2?.addEventListener?.('resize', config),
    windowObject2?.visualViewport?.addEventListener?.('resize', config),
    windowObject2?.visualViewport?.addEventListener?.('scroll', config));
  function destroy() {
    (clearTrackedFocus(),
      windowObject2?.removeEventListener?.('resize', config),
      windowObject2?.visualViewport?.removeEventListener?.('resize', config),
      windowObject2?.visualViewport?.removeEventListener?.('scroll', config));
  }
  return {
    focusNode: focusNode,
    focusNodes: focusNodes,
    focusNodeAtZoomPercent: focusNodeAtZoomPercent,
    clearTrackedFocus: clearTrackedFocus,
    getTrackedFocusRequest: getTrackedFocusRequest,
    reapplyTrackedFocusNow: reapplyTrackedFocusNow,
    getBrowserViewportRect() {
      return getBrowserViewportRect({ windowObject: windowObject2, containerEl: containerEl });
    },
    destroy: destroy,
  };
}
