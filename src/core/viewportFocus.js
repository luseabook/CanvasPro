import { computeNodesWorldBounds, computeViewportForWorldBounds } from './math.js';
import { jumpZoomPercentToViewportZoom } from '../modules/commentNoteJumpShortcut.js';
import { CANVAS_ZOOM_LIMITS } from './canvasZoom.js';
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
  containerCoordinates: containerCoordinates = false,
} = {}) {
  const _getWindowObject2 = _getWindowObject(windowObject);
  if (containerCoordinates && containerEl && typeof containerEl.getBoundingClientRect === 'function') {
    const box = containerEl.getBoundingClientRect();
    if (
      Number.isFinite(Number(box?.width)) &&
      Number.isFinite(Number(box?.height)) &&
      Number(box.width) > 0 &&
      Number(box.height) > 0
    )
      return _normalizeViewportRect(0, 0, box.width, box.height);
  }
  const box2 = _getWindowObject2?.visualViewport || null;
  if (
    box2 &&
    Number.isFinite(Number(box2.width)) &&
    Number.isFinite(Number(box2.height)) &&
    Number(box2.width) > 0 &&
    Number(box2.height) > 0
  )
    return _normalizeViewportRect(
      box2.offsetLeft,
      box2.offsetTop,
      box2.width,
      box2.height,
    );
  if (containerEl && typeof containerEl.getBoundingClientRect === 'function') {
    const box3 = containerEl.getBoundingClientRect();
    if (
      Number.isFinite(Number(box3?.width)) &&
      Number.isFinite(Number(box3?.height)) &&
      Number(box3.width) > 0 &&
      Number(box3.height) > 0
    )
      return _normalizeViewportRect(
        box3.left,
        box3.top,
        box3.width,
        box3.height,
      );
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
function _resolveViewportInset(source) {
  const next = Number(source);
  return Number.isFinite(next) ? Math.max(0, next) : 0;
}
function _applyViewportInsets(box4, box5) {
  if (!box5 || typeof box5 !== 'object') return box4;
  const _resolveViewportInset2 = _resolveViewportInset(box5.top),
    _resolveViewportInset3 = _resolveViewportInset(box5.right),
    _resolveViewportInset4 = _resolveViewportInset(box5.bottom),
    _resolveViewportInset5 = _resolveViewportInset(box5.left);
  return _normalizeViewportRect(
    box4.left + _resolveViewportInset5,
    box4.top + _resolveViewportInset2,
    Math.max(0, box4.width - _resolveViewportInset5 - _resolveViewportInset3),
    Math.max(0, box4.height - _resolveViewportInset2 - _resolveViewportInset4),
  );
}
export function createViewportFocusController({
  store: store,
  animateViewport: animateViewport,
  cancelAnimation: cancelAnimation,
  containerEl: containerEl = null,
  containerCoordinates: containerCoordinates = false,
  windowObject: windowObject = undefined,
  minZoom: minZoom = CANVAS_ZOOM_LIMITS.fitMin,
  maxZoom: maxZoom = CANVAS_ZOOM_LIMITS.fitMax,
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
    handler4 = (current, entry, record) => {
      store?.updateViewport?.(current, entry, record);
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
        const payload = Number(windowObject2._lastMx),
          handle = Number(windowObject2._lastMy);
        run2(
          Number.isFinite(payload) ? payload : undefined,
          Number.isFinite(handle) ? handle : undefined,
        );
      }
    };
  function clearTrackedFocus() {
    (cancelAnimation?.(), (args = null), value2 !== null && (handler3(value2), (value2 = null)));
  }
  function getTrackedFocusRequest() {
    return args ? { ...args } : null;
  }
  function run3(enabled) {
    if (!enabled) return null;
    const viewport = run(),
      state = viewport?.nodes || {};
    let browserViewportRect = getBrowserViewportRect({
        windowObject: windowObject2,
        containerEl: containerEl,
        containerCoordinates: containerCoordinates,
      }),
      nodesWorldBounds = null,
      config = { minZoom: minZoom, maxZoom: maxZoom };
    enabled.type === 'node-zoom-percent'
      ? ((nodesWorldBounds = computeNodesWorldBounds(state, [enabled.nodeId])),
        (config.fixedZoom = resolveZoomPercent(enabled.zoomPercent)))
      : ((nodesWorldBounds = computeNodesWorldBounds(state, enabled.nodeIds)),
        (config.padding = enabled.padding),
        (config.maxZoom = _resolveMaxZoom(enabled.options, maxZoom)),
        (browserViewportRect = _applyViewportInsets(browserViewportRect, enabled.options?.viewportInsets)));
    if (!nodesWorldBounds) return null;
    const target2 = computeViewportForWorldBounds(nodesWorldBounds, browserViewportRect, config);
    if (!target2) return null;
    return { target: target2, viewport: viewport?.viewport || _getDefaultViewport() };
  }
  function reapplyTrackedFocusNow() {
    value2 = null;
    if (!args) return false;
    const enabled2 = run3(args);
    if (!enabled2) return (clearTrackedFocus(), false);
    const { target: target3, viewport: viewport2 } = enabled2;
    if (
      viewport2.x === target3.x &&
      viewport2.y === target3.y &&
      viewport2.zoom === target3.zoom
    )
      return true;
    return (
      cancelAnimation?.(),
      handler4(target3.x, target3.y, target3.zoom),
      handler5(),
      handler6(),
      true
    );
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
  function focusNode(scope, padding = 120, durationMs = 1500, options2 = null) {
    return run5({
      type: 'nodes-fit',
      nodeIds: [scope],
      padding: padding,
      durationMs: durationMs,
      options: options2,
    });
  }
  function focusNodes(list, padding2 = 80, durationMs2 = 800, options3 = null) {
    if (!Array.isArray(list) || list.length === 0) return (clearTrackedFocus(), false);
    return run5({
      type: 'nodes-fit',
      nodeIds: [...list],
      padding: padding2,
      durationMs: durationMs2,
      options: options3,
    });
  }
  function focusNodeAtZoomPercent(nodeId, zoomPercent = 60, durationMs3 = 800) {
    return run5({
      type: 'node-zoom-percent',
      nodeId: nodeId,
      zoomPercent: zoomPercent,
      durationMs: durationMs3,
    });
  }
  const input = () => run4();
  (windowObject2?.addEventListener?.('resize', input),
    windowObject2?.visualViewport?.addEventListener?.('resize', input),
    windowObject2?.visualViewport?.addEventListener?.('scroll', input));
  function destroy() {
    (clearTrackedFocus(),
      windowObject2?.removeEventListener?.('resize', input),
      windowObject2?.visualViewport?.removeEventListener?.('resize', input),
      windowObject2?.visualViewport?.removeEventListener?.('scroll', input));
  }
  return {
    focusNode: focusNode,
    focusNodes: focusNodes,
    focusNodeAtZoomPercent: focusNodeAtZoomPercent,
    clearTrackedFocus: clearTrackedFocus,
    getTrackedFocusRequest: getTrackedFocusRequest,
    reapplyTrackedFocusNow: reapplyTrackedFocusNow,
    getBrowserViewportRect() {
      return getBrowserViewportRect({
        windowObject: windowObject2,
        containerEl: containerEl,
        containerCoordinates: containerCoordinates,
      });
    },
    destroy: destroy,
  };
}
