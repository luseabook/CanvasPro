import appStore from '../core/stores/appStore.js';
import { computeNodesWorldBounds, computeViewportForWorldBounds } from '../core/math.js';
import { getBrowserViewportRect } from '../core/viewportFocus.js';
import { jumpZoomPercentToViewportZoom } from '../modules/commentNoteJumpShortcut.js';
let _isAnimating = false;
function _getStateSnapshot() {
  return typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
}
function _getCurrentViewportRect() {
  const _0x1c3e95 = typeof document !== 'undefined' ? document.getElementById('v2-wrap') : null;
  return getBrowserViewportRect({ containerEl: _0x1c3e95 });
}
function _resolveFocusTarget({
  nodes: _0x5e5d48,
  nodeIds: _0x3b7b25,
  padding: padding = 0,
  fixedZoom: fixedZoom = undefined,
  maxZoom: maxZoom = 2,
}) {
  const _0x31fb07 = computeNodesWorldBounds(_0x5e5d48, _0x3b7b25);
  if (!_0x31fb07) return null;
  return computeViewportForWorldBounds(_0x31fb07, _getCurrentViewportRect(), {
    padding: padding,
    fixedZoom: fixedZoom,
    maxZoom: maxZoom,
    minZoom: 0.2,
  });
}
export function getViewport() {
  return { ...(_getStateSnapshot().viewport || {}) };
}
export function setViewport(_0x14ace7, _0x32d47e, _0x14dd3e) {
  appStore.updateViewport(_0x14ace7, _0x32d47e, _0x14dd3e);
}
export function zoomAt(_0x5147d1, _0x3cab62, _0x1914c3) {
  const { viewport: _0x9f7323 } = _getStateSnapshot(),
    _0x164080 = _0x9f7323.zoom,
    _0x2ddd5a = (_0x5147d1 - _0x9f7323.x) / _0x164080,
    _0x5972ac = (_0x3cab62 - _0x9f7323.y) / _0x164080,
    _0x18422e = _0x5147d1 - _0x2ddd5a * _0x1914c3,
    _0x4dc094 = _0x3cab62 - _0x5972ac * _0x1914c3;
  appStore.updateViewport(_0x18422e, _0x4dc094, _0x1914c3);
}
export function zoomBy(_0x59e936, _0x523332, _0x210ddc) {
  const { viewport: _0x6b13ff } = _getStateSnapshot(),
    _0x369bf3 = Math.max(0.1, Math.min(3, _0x6b13ff.zoom + _0x210ddc));
  zoomAt(_0x59e936, _0x523332, _0x369bf3);
}
export function zoomIn(_0x8f32a5 = 0.1) {
  const _0x4c7d3b = _getCurrentViewportRect();
  zoomBy(_0x4c7d3b.centerX, _0x4c7d3b.centerY, _0x8f32a5);
}
export function zoomOut(_0x1db7eb = 0.1) {
  const _0x161049 = _getCurrentViewportRect();
  zoomBy(_0x161049.centerX, _0x161049.centerY, -_0x1db7eb);
}
export function fitToCanvas(_0x537466 = 120, _0x48e63d = 0x320) {
  const { nodes: _0x5f0937, viewport: _0x1e4322 } = _getStateSnapshot(),
    _0xac067e = Object.keys(_0x5f0937 || {});
  if (_0xac067e.length === 0) {
    animateViewport(_0x1e4322.x, _0x1e4322.y, _0x1e4322.zoom, 0, 0, 1.1, _0x48e63d);
    return;
  }
  const _0x3108b8 = _resolveFocusTarget({
    nodes: _0x5f0937,
    nodeIds: _0xac067e,
    padding: _0x537466,
    maxZoom: 2,
  });
  if (!_0x3108b8) return;
  animateViewport(
    _0x1e4322.x,
    _0x1e4322.y,
    _0x1e4322.zoom,
    _0x3108b8.x,
    _0x3108b8.y,
    _0x3108b8.zoom,
    _0x48e63d,
  );
}
export function focusOnNode(_0x364d30, _0x252feb = 120, _0x1d4eec = 0x320, _0x250cb5) {
  const { nodes: _0x1c12de, viewport: _0x290010 } = _getStateSnapshot(),
    _0x19a2c8 = _resolveFocusTarget({
      nodes: _0x1c12de,
      nodeIds: [_0x364d30],
      padding: _0x252feb,
      maxZoom:
        typeof _0x250cb5 === 'number'
          ? _0x250cb5
          : Number.isFinite(Number(_0x250cb5?.maxZoom))
            ? Number(_0x250cb5.maxZoom)
            : 2,
    });
  if (!_0x19a2c8) {
    console.warn('[useViewport] 节点 ' + _0x364d30 + ' 不存在');
    return;
  }
  animateViewport(
    _0x290010.x,
    _0x290010.y,
    _0x290010.zoom,
    _0x19a2c8.x,
    _0x19a2c8.y,
    _0x19a2c8.zoom,
    _0x1d4eec,
  );
}
export function focusOnNodeAtZoom(_0x436751, _0x2bd91d = 60, _0x17c75a = 0x320) {
  const { nodes: _0x135ae5, viewport: _0x5c19a0 } = _getStateSnapshot(),
    _0x33184e = _resolveFocusTarget({
      nodes: _0x135ae5,
      nodeIds: [_0x436751],
      fixedZoom: jumpZoomPercentToViewportZoom(_0x2bd91d),
      maxZoom: 2,
    });
  if (!_0x33184e) return;
  animateViewport(
    _0x5c19a0.x,
    _0x5c19a0.y,
    _0x5c19a0.zoom,
    _0x33184e.x,
    _0x33184e.y,
    _0x33184e.zoom,
    _0x17c75a,
  );
}
export function animateViewport(
  _0x26f800,
  _0x519611,
  _0x265023,
  _0x21eed0,
  _0x2c513b,
  _0x1884a9,
  _0x59eb65 = 0x320,
) {
  if (_isAnimating) return;
  _isAnimating = true;
  const _0x26e116 = performance.now(),
    _0x43e117 = (_0x59c09a) => 1 - Math.pow(1 - _0x59c09a, 3);
  function _0x39861b(_0x482a93) {
    const _0x49879c = _0x482a93 - _0x26e116,
      _0x616fde = Math.min(_0x49879c / _0x59eb65, 1),
      _0x5f37c8 = _0x43e117(_0x616fde),
      _0x511674 = _0x26f800 + (_0x21eed0 - _0x26f800) * _0x5f37c8,
      _0x290316 = _0x519611 + (_0x2c513b - _0x519611) * _0x5f37c8,
      _0x1214ea = _0x265023 + (_0x1884a9 - _0x265023) * _0x5f37c8;
    (appStore.updateViewport(_0x511674, _0x290316, _0x1214ea),
      _0x616fde < 1 ? requestAnimationFrame(_0x39861b) : (_isAnimating = false));
  }
  requestAnimationFrame(_0x39861b);
}
export function isAnimating() {
  return _isAnimating;
}
export function subscribeToViewport(_0x57ee1b) {
  return appStore.subscribeSelector(
    (_0x503ce5) => _0x503ce5.viewport,
    (_0x4611b3) => _0x57ee1b(_0x4611b3),
  );
}
export function initViewportHook() {
  ((window.v2AnimateViewport = animateViewport),
    (window.v2FocusOnNode = focusOnNode),
    (window.v2FocusOnNodeAtZoom = focusOnNodeAtZoom));
}
