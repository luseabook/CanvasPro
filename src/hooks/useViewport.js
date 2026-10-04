import appStore from '../core/stores/appStore.js';
import { computeNodesWorldBounds, computeViewportForWorldBounds } from '../core/math.js';
import { getBrowserViewportRect } from '../core/viewportFocus.js';
import { jumpZoomPercentToViewportZoom } from '../modules/commentNoteJumpShortcut.js';
let _isAnimating = false;
function _getStateSnapshot() {
  return typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
}
function _getCurrentViewportRect() {
  const containerEl = typeof document !== 'undefined' ? document.getElementById('v2-wrap') : null;
  return getBrowserViewportRect({ containerEl: containerEl });
}
function _resolveFocusTarget({
  nodes: nodes,
  nodeIds: nodeIds,
  padding: padding = 0,
  fixedZoom: fixedZoom = undefined,
  maxZoom: maxZoom = 2,
}) {
  const nodesWorldBounds = computeNodesWorldBounds(nodes, nodeIds);
  if (!nodesWorldBounds) return null;
  return computeViewportForWorldBounds(nodesWorldBounds, _getCurrentViewportRect(), {
    padding: padding,
    fixedZoom: fixedZoom,
    maxZoom: maxZoom,
    minZoom: 0.2,
  });
}
export function getViewport() {
  return { ...(_getStateSnapshot().viewport || {}) };
}
export function setViewport(value, item, key) {
  appStore.updateViewport(value, item, key);
}
export function zoomAt(index, result, data) {
  const { viewport: viewport } = _getStateSnapshot(),
    options = viewport.zoom,
    target = (index - viewport.x) / options,
    source = (result - viewport.y) / options,
    next = index - target * data,
    current = result - source * data;
  appStore.updateViewport(next, current, data);
}
export function zoomBy(entry, record, payload) {
  const { viewport: viewport2 } = _getStateSnapshot(),
    handle = Math.max(0.1, Math.min(3, viewport2.zoom + payload));
  zoomAt(entry, record, handle);
}
export function zoomIn(state = 0.1) {
  const _getCurrentViewportRect2 = _getCurrentViewportRect();
  zoomBy(_getCurrentViewportRect2.centerX, _getCurrentViewportRect2.centerY, state);
}
export function zoomOut(config = 0.1) {
  const _getCurrentViewportRect3 = _getCurrentViewportRect();
  zoomBy(_getCurrentViewportRect3.centerX, _getCurrentViewportRect3.centerY, -config);
}
export function fitToCanvas(padding2 = 120, scope = 0x320) {
  const { nodes: nodes2, viewport: viewport3 } = _getStateSnapshot(),
    nodeIds2 = Object.keys(nodes2 || {});
  if (nodeIds2.length === 0) {
    animateViewport(viewport3.x, viewport3.y, viewport3.zoom, 0, 0, 1.1, scope);
    return;
  }
  const box = _resolveFocusTarget({
    nodes: nodes2,
    nodeIds: nodeIds2,
    padding: padding2,
    maxZoom: 2,
  });
  if (!box) return;
  animateViewport(viewport3.x, viewport3.y, viewport3.zoom, box.x, box.y, box.zoom, scope);
}
export function focusOnNode(input, padding3 = 120, output = 0x320, value2) {
  const { nodes: nodes3, viewport: viewport4 } = _getStateSnapshot(),
    box2 = _resolveFocusTarget({
      nodes: nodes3,
      nodeIds: [input],
      padding: padding3,
      maxZoom:
        typeof value2 === 'number'
          ? value2
          : Number.isFinite(Number(value2?.maxZoom))
            ? Number(value2.maxZoom)
            : 2,
    });
  if (!box2) {
    console.warn('[useViewport] 节点 ' + input + ' 不存在');
    return;
  }
  animateViewport(viewport4.x, viewport4.y, viewport4.zoom, box2.x, box2.y, box2.zoom, output);
}
export function focusOnNodeAtZoom(value3, value4 = 60, value5 = 0x320) {
  const { nodes: nodes4, viewport: viewport5 } = _getStateSnapshot(),
    box3 = _resolveFocusTarget({
      nodes: nodes4,
      nodeIds: [value3],
      fixedZoom: jumpZoomPercentToViewportZoom(value4),
      maxZoom: 2,
    });
  if (!box3) return;
  animateViewport(viewport5.x, viewport5.y, viewport5.zoom, box3.x, box3.y, box3.zoom, value5);
}
export function animateViewport(value6, value7, value8, value9, value10, value11, value12 = 0x320) {
  if (_isAnimating) return;
  _isAnimating = true;
  const value13 = performance.now(),
    handler = (value14) => 1 - Math.pow(1 - value14, 3);
  function run(value15) {
    const value16 = value15 - value13,
      count = Math.min(value16 / value12, 1),
      value17 = handler(count),
      value18 = value6 + (value9 - value6) * value17,
      value19 = value7 + (value10 - value7) * value17,
      value20 = value8 + (value11 - value8) * value17;
    (appStore.updateViewport(value18, value19, value20),
      count < 1 ? requestAnimationFrame(run) : (_isAnimating = false));
  }
  requestAnimationFrame(run);
}
export function isAnimating() {
  return _isAnimating;
}
export function subscribeToViewport(handler2) {
  return appStore.subscribeSelector(
    (value21) => value21.viewport,
    (value22) => handler2(value22),
  );
}
export function initViewportHook() {
  ((window.v2AnimateViewport = animateViewport),
    (window.v2FocusOnNode = focusOnNode),
    (window.v2FocusOnNodeAtZoom = focusOnNodeAtZoom));
}
