import { normalizeWebPreviewUrl } from '../modules/webPreviewUrl.js';
import { normalizeWebPreviewTabs } from '../modules/webPreviewTabs.js';
import { isViewportPanPreviewActive, VIEWPORT_PAN_PREVIEW_FRAME_EVENT } from '../core/viewportPanPreview.js';
const SOFT_OCCLUSION_SELECTOR = '.header',
  HARD_OCCLUSION_SELECTOR =
    '#settingsOverlay, #aboutOverlay, #feedbackGroupOverlay, #v2PickerOverlay, #nodePickerOverlay, .settings-overlay, .save-dialog-overlay.open, .preset-modal-overlay, .custom-confirm-overlay, .v2-asset-sidebar-panel.show, .v2-workflow-sidebar-panel.show, .sidebar-floating #avatarMenu.open, .sidebar-floating .avatar-menu.open, .node-add-menu, .v2-node-picker, .canvas-proj-dropdown, .web-preview-image-picker-overlay',
  FULLSCREEN_OCCLUSION_SELECTOR = '.web-preview-image-picker-overlay',
  OCCLUSION_OBSERVER_SELECTOR = [
    SOFT_OCCLUSION_SELECTOR,
    HARD_OCCLUSION_SELECTOR,
    '.sidebar-floating, .canvas-controls-floating, .minimap-wrapper, .save-dialog-overlay, .v2-asset-sidebar-panel, .v2-workflow-sidebar-panel, .v2-crop-overlay, .v2-annotate-overlay, .v2-matting-overlay, .v2-expand-overlay',
    FULLSCREEN_OCCLUSION_SELECTOR,
  ].join(', '),
  BACKGROUND_SYNC_INTERVAL_MS = 50,
  FINAL_INTERACTION_SYNC_DELAY_MS = 40,
  FREEZE_SETTLE_HOLD_MS = 0x168,
  MIN_VISIBLE_INTERSECTION_SIZE = 16,
  SOFT_OCCLUSION_HIDE_RATIO = 0.35,
  FREEZE_ACTIVE_BODY_CLASS = 'is-web-preview-freeze-active',
  FREEZE_SETTLING_BODY_CLASS = 'is-web-preview-freeze-settling',
  WEB_PREVIEW_FREEZE_BODY_CLASSES = new Set([FREEZE_ACTIVE_BODY_CLASS, FREEZE_SETTLING_BODY_CLASS]),
  registeredSlotsByNodeId = new Map();
function normalizeNodeId(_0x55a075) {
  return String(_0x55a075 || '').trim();
}
function getViewKey(_0x245f97 = {}) {
  return normalizeNodeId(_0x245f97.nodeId) + '\n' + String(_0x245f97.tabId || '').trim();
}
function getNowMs() {
  const _0x57f43a = globalThis.performance?.now?.();
  return Number.isFinite(_0x57f43a) ? _0x57f43a : Date.now();
}
function readCanvasSpaceHeld() {
  return globalThis.window?._spaceHeld === true;
}
function getRequestAnimationFrame() {
  return (
    globalThis.window?.requestAnimationFrame?.bind(globalThis.window) ||
    ((_0x4f7341) => setTimeout(_0x4f7341, 16))
  );
}
function getCancelAnimationFrame() {
  return globalThis.window?.cancelAnimationFrame?.bind(globalThis.window) || clearTimeout;
}
function rectIntersects(_0x181a35, _0x159315) {
  return (
    _0x181a35.left < _0x159315.right &&
    _0x181a35.right > _0x159315.left &&
    _0x181a35.top < _0x159315.bottom &&
    _0x181a35.bottom > _0x159315.top
  );
}
function getRectArea(_0x40f54e) {
  return Math.max(0, Number(_0x40f54e?.width) || 0) * Math.max(0, Number(_0x40f54e?.height) || 0);
}
function getIntersectionArea(_0x3b551e, _0x3c8c81) {
  if (!rectIntersects(_0x3b551e, _0x3c8c81)) return 0;
  const _0x2f5cfc = Math.min(_0x3b551e.right, _0x3c8c81.right) - Math.max(_0x3b551e.left, _0x3c8c81.left),
    _0x4b4f19 = Math.min(_0x3b551e.bottom, _0x3c8c81.bottom) - Math.max(_0x3b551e.top, _0x3c8c81.top);
  return Math.max(0, _0x2f5cfc) * Math.max(0, _0x4b4f19);
}
function hasVisibleViewportIntersection(_0x14bb73) {
  const _0x244309 = Number(_0x14bb73?.width) || 0,
    _0x121615 = Number(_0x14bb73?.height) || 0;
  if (_0x244309 < 16 || _0x121615 < 16) return false;
  const _0x2b031f = globalThis.window || {},
    _0x5096d8 = Number(_0x2b031f.innerWidth) || 0,
    _0x1076fa = Number(_0x2b031f.innerHeight) || 0;
  if (_0x5096d8 <= 0 || _0x1076fa <= 0) return false;
  const _0x22b664 = Math.min(_0x14bb73.right, _0x5096d8) - Math.max(_0x14bb73.left, 0),
    _0x5dcdc8 = Math.min(_0x14bb73.bottom, _0x1076fa) - Math.max(_0x14bb73.top, 0);
  return _0x22b664 >= MIN_VISIBLE_INTERSECTION_SIZE && _0x5dcdc8 >= MIN_VISIBLE_INTERSECTION_SIZE;
}
function collectOcclusionRects(_0x39060c = document, _0x1e0663 = SOFT_OCCLUSION_SELECTOR) {
  const _0x4a2e2e = _0x39060c.querySelectorAll?.(_0x1e0663) || [],
    _0x12c5f8 = [];
  for (const _0xca23a9 of _0x4a2e2e) {
    if (!_0xca23a9 || _0xca23a9.hidden) continue;
    const _0x3a2335 = globalThis.window?.getComputedStyle?.(_0xca23a9);
    if (_0x3a2335?.display === 'none' || _0x3a2335?.visibility === 'hidden') continue;
    const _0x8e783d = Number(_0x3a2335?.opacity);
    if (Number.isFinite(_0x8e783d) && _0x8e783d <= 0) continue;
    if (_0x3a2335?.pointerEvents === 'none') continue;
    const _0x2d60be = _0xca23a9.getBoundingClientRect?.();
    if (_0x2d60be) _0x12c5f8.push(_0x2d60be);
  }
  return _0x12c5f8;
}
function isOccludedByRects(_0x42eafe, _0xc2114 = []) {
  return _0xc2114.some((_0xe7fb89) => rectIntersects(_0x42eafe, _0xe7fb89));
}
function isSignificantlyOccludedByRects(_0x113480, _0x2a1199 = []) {
  const _0x7db3e0 = getRectArea(_0x113480);
  if (_0x7db3e0 <= 0) return false;
  let _0x40706b = 0;
  for (const _0x41d458 of _0x2a1199) {
    _0x40706b += getIntersectionArea(_0x113480, _0x41d458);
    if (_0x40706b / _0x7db3e0 >= SOFT_OCCLUSION_HIDE_RATIO) return true;
  }
  return false;
}
function nodeMatchesOcclusionSelector(_0x29df02) {
  if (!_0x29df02 || _0x29df02.nodeType === 3) return false;
  try {
    if (typeof _0x29df02.matches === 'function' && _0x29df02.matches(OCCLUSION_OBSERVER_SELECTOR))
      return true;
    return Boolean(_0x29df02.querySelector?.(OCCLUSION_OBSERVER_SELECTOR));
  } catch {
    return false;
  }
}
function isCanvasPanSurfaceTarget(_0xe5da7e) {
  if (!_0xe5da7e) return false;
  const _0xcbbf85 = globalThis.document?.getElementById?.('v2-wrap');
  if (_0xcbbf85?.contains?.(_0xe5da7e)) return true;
  return Boolean(_0xe5da7e.closest?.('.side-plus-btn'));
}
function isPotentialCanvasPanStartEvent(_0x4c63bd) {
  if (!isCanvasPanSurfaceTarget(_0x4c63bd?.target)) return false;
  const _0x34366e = Number(_0x4c63bd?.button);
  if (_0x34366e === 1) return true;
  return _0x34366e === 0 && globalThis.window?._spaceHeld === true;
}
function isNativePanStartPreviewEvent(_0x3174c0) {
  return _0x3174c0?.type === 'pan-start-preview';
}
function normalizeObservedClassName(_0x24c56d = '') {
  return String(_0x24c56d || '')
    .split(/\s+/)
    .map((_0x3c4ef0) => _0x3c4ef0.trim())
    .filter((_0x139456) => _0x139456 && !WEB_PREVIEW_FREEZE_BODY_CLASSES.has(_0x139456))
    .sort()
    .join(' ');
}
function isOwnFreezeClassMutation(_0x2da4e0) {
  if (_0x2da4e0?.type !== 'attributes' || _0x2da4e0?.attributeName !== 'class') return false;
  if (_0x2da4e0.target !== globalThis.document?.body) return false;
  return (
    normalizeObservedClassName(_0x2da4e0.oldValue) === normalizeObservedClassName(_0x2da4e0.target?.className)
  );
}
function shouldSyncForOcclusionMutation(_0x2052c7 = []) {
  for (const _0x3e85b2 of _0x2052c7) {
    if (isOwnFreezeClassMutation(_0x3e85b2)) continue;
    if (nodeMatchesOcclusionSelector(_0x3e85b2?.target)) return true;
    for (const _0x4578e4 of _0x3e85b2?.addedNodes || []) {
      if (nodeMatchesOcclusionSelector(_0x4578e4)) return true;
    }
    for (const _0x5c3a41 of _0x3e85b2?.removedNodes || []) {
      if (nodeMatchesOcclusionSelector(_0x5c3a41)) return true;
    }
  }
  return false;
}
function appendSlotToIndex(_0x371ad3, _0x5c02dc) {
  const _0x48c930 = _0x5c02dc?.dataset?.nodeId;
  if (!_0x48c930) return;
  const _0x33080f = _0x371ad3.get(_0x48c930);
  if (_0x5c02dc.dataset.webPreviewFullscreen === 'true') {
    _0x371ad3.set(_0x48c930, _0x5c02dc);
    return;
  }
  if (!_0x33080f) _0x371ad3.set(_0x48c930, _0x5c02dc);
}
function buildSlotIndex(_0x3d1bd4 = document, _0x4d3a53 = []) {
  const _0x5351e3 = new Map(),
    _0x1d5da0 = new Set();
  for (const _0x4c64d2 of registeredSlotsByNodeId.values()) {
    for (const _0x2742ce of _0x4c64d2) {
      if (!_0x2742ce || _0x2742ce.isConnected === false || _0x1d5da0.has(_0x2742ce)) continue;
      (_0x1d5da0.add(_0x2742ce), appendSlotToIndex(_0x5351e3, _0x2742ce));
    }
  }
  if (_0x4d3a53.length > 0 && _0x4d3a53.every((_0x56207f) => _0x5351e3.has(_0x56207f))) return _0x5351e3;
  const _0x28fd77 = _0x3d1bd4.querySelectorAll?.("[data-web-preview-slot='true']") || [];
  for (const _0x43b01f of _0x28fd77) {
    if (!_0x43b01f || _0x1d5da0.has(_0x43b01f)) continue;
    (_0x1d5da0.add(_0x43b01f), appendSlotToIndex(_0x5351e3, _0x43b01f));
  }
  return _0x5351e3;
}
export function registerWebPreviewSlot(_0x182b1a, _0x13d794) {
  const _0x5e4bcc = normalizeNodeId(_0x182b1a);
  if (!_0x5e4bcc || !_0x13d794) return () => {};
  let _0x34cdef = registeredSlotsByNodeId.get(_0x5e4bcc);
  return (
    !_0x34cdef && ((_0x34cdef = new Set()), registeredSlotsByNodeId.set(_0x5e4bcc, _0x34cdef)),
    _0x34cdef.add(_0x13d794),
    () => {
      const _0x552bbd = registeredSlotsByNodeId.get(_0x5e4bcc);
      if (!_0x552bbd) return;
      _0x552bbd.delete(_0x13d794);
      if (_0x552bbd.size === 0) registeredSlotsByNodeId.delete(_0x5e4bcc);
    }
  );
}
export function _clearWebPreviewSlotRegistryForTest() {
  registeredSlotsByNodeId.clear();
}
function hasActiveWebPreviewNodes(_0x4cdcec) {
  const _0x417532 =
    typeof _0x4cdcec?.getStateRaw === 'function' ? _0x4cdcec.getStateRaw() : _0x4cdcec?.getState?.() || {};
  return Object.values(_0x417532.nodes || {}).some(
    (_0x4cdb2c) =>
      _0x4cdb2c?.type === 'web-preview' &&
      normalizeWebPreviewTabs(_0x4cdb2c).tabs.some(
        (_0x205f84) => normalizeWebPreviewUrl(_0x205f84.url) || _0x205f84.pendingPopup === true,
      ),
  );
}
function normalizeCanvasZoom(_0x15d971) {
  const _0x1c2a93 = Number(_0x15d971);
  if (!Number.isFinite(_0x1c2a93) || _0x1c2a93 <= 0) return 1;
  return Math.min(5, Math.max(0.25, _0x1c2a93));
}
function getCanvasInteractionState() {
  const _0x330f7b = globalThis.document?.body?.classList,
    _0x1bc276 = Boolean(_0x330f7b?.contains?.('is-viewport-animating'));
  return {
    frozen: _0x1bc276,
    deferZoomFactor: _0x1bc276,
    settleSnapshot: _0x1bc276,
    showSnapshot: _0x1bc276,
  };
}
function getSlotFullscreen(_0x1726bf) {
  return _0x1726bf?.dataset?.webPreviewFullscreen === 'true';
}
function getSlotSnapshotComponent(_0x39b8e8) {
  return _0x39b8e8?.closest?.('.web-preview-component') || null;
}
function getSlotSnapshotReady(_0x1a487e, _0x30d670 = '', { allowAnyToken: allowAnyToken = false } = {}) {
  const _0x256460 = getSlotSnapshotComponent(_0x1a487e);
  if (!_0x256460?.classList?.contains?.('has-freeze-snapshot')) return false;
  if (allowAnyToken) return true;
  const _0x2cd51a = String(_0x30d670 || '').trim();
  if (!_0x2cd51a) return true;
  const _0x58f814 = String(_0x256460?.dataset?.webPreviewSnapshotToken || '').trim();
  return _0x58f814 === _0x2cd51a;
}
function getSlotSnapshotHold(_0x3e2338) {
  return Boolean(getSlotSnapshotComponent(_0x3e2338)?.classList?.contains?.('is-web-preview-loading'));
}
function buildViewPayload({
  node: _0x28b066,
  tabId: _0x36e8e4,
  webUrl: _0x5081c1,
  slot: _0x49187d,
  active: _0x1bcd3f,
  selected: _0x25eab2,
  canvasZoom: _0x458525,
  interactionState: _0x390bb3,
  freezeToken: _0x249fb0,
  fullscreenBlockerRects: _0x7884a3,
  softBlockerRects: _0x1f5781,
  hardBlockerRects: _0xf5c945,
  canvasSpaceHeld: canvasSpaceHeld = false,
  pendingPopup: pendingPopup = false,
}) {
  let _0x3cf171 = false,
    _0x5196bf = null;
  const _0x353be6 = getSlotFullscreen(_0x49187d);
  if (_0x49187d?.isConnected !== false) {
    const _0x40a517 = _0x49187d?.getBoundingClientRect?.(),
      _0x32db77 = _0x40a517 ? isOccludedByRects(_0x40a517, _0x7884a3) : false,
      _0xdb1d0d = _0x40a517 && !_0x353be6 ? isOccludedByRects(_0x40a517, _0xf5c945) : false,
      _0x14aa27 = _0x40a517 && !_0x353be6 ? isSignificantlyOccludedByRects(_0x40a517, _0x1f5781) : false;
    _0x40a517 &&
      hasVisibleViewportIntersection(_0x40a517) &&
      !_0x32db77 &&
      !_0xdb1d0d &&
      !_0x14aa27 &&
      ((_0x3cf171 = true),
      (_0x5196bf = {
        x: Math.round(_0x40a517.left),
        y: Math.round(_0x40a517.top),
        width: Math.round(_0x40a517.width),
        height: Math.round(_0x40a517.height),
      }));
  }
  const _0x51e262 = getSlotSnapshotHold(_0x49187d),
    _0x142b0c = Boolean((_0x390bb3.frozen || _0x51e262) && !_0x353be6 && _0x3cf171),
    _0x50440f = _0x142b0c ? String(_0x249fb0 || '0') : '',
    _0x24dd48 = Boolean(_0x142b0c && (_0x390bb3.showSnapshot || _0x51e262)),
    _0x3e4480 = _0x24dd48 || _0x51e262;
  return {
    nodeId: _0x28b066.id,
    tabId: _0x36e8e4,
    webUrl: _0x5081c1,
    pendingPopup: pendingPopup,
    browserProfileId: _0x28b066.browserProfileId || '',
    active: _0x1bcd3f,
    visible: _0x3cf171,
    bounds: _0x5196bf,
    zoomFactor: _0x353be6 ? 1 : _0x458525,
    deferZoomFactor: _0x353be6 ? false : _0x390bb3.deferZoomFactor,
    frozen: _0x142b0c,
    freezeToken: _0x50440f,
    snapshotReady: _0x24dd48
      ? getSlotSnapshotReady(_0x49187d, _0x50440f, { allowAnyToken: _0x3e4480 })
      : false,
    snapshotHold: _0x51e262,
    showSnapshot: _0x24dd48,
    fullscreen: _0x353be6,
    selected: _0x25eab2,
    canvasSpaceHeld: canvasSpaceHeld === true,
  };
}
function syncCachedViewsForBudget(_0x54b3cf, _0x56af16) {
  if (!_0x56af16) return _0x54b3cf;
  const _0xc04625 = getNowMs(),
    _0x15c460 = _0x54b3cf.some((_0xb86497) => _0xb86497?.frozen || _0xb86497?.deferZoomFactor),
    _0x4cd470 = new Set(_0x54b3cf.map(getViewKey));
  for (const _0x5eb2c2 of [..._0x56af16.cachedViewsByNodeId.keys()]) {
    if (!_0x4cd470.has(_0x5eb2c2)) _0x56af16.cachedViewsByNodeId.delete(_0x5eb2c2);
  }
  if (!_0x15c460) {
    _0x56af16.lastBackgroundSyncAt = _0xc04625;
    for (const _0x317d37 of _0x54b3cf) _0x56af16.cachedViewsByNodeId.set(getViewKey(_0x317d37), _0x317d37);
    return _0x54b3cf;
  }
  const _0x312476 = _0xc04625 - _0x56af16.lastBackgroundSyncAt >= BACKGROUND_SYNC_INTERVAL_MS;
  if (_0x312476) _0x56af16.lastBackgroundSyncAt = _0xc04625;
  return _0x54b3cf.map((_0x1a8d6c) => {
    const _0x6693c2 = getViewKey(_0x1a8d6c),
      _0x23557c = _0x56af16.cachedViewsByNodeId.get(_0x6693c2),
      _0x4fa4b7 =
        _0x1a8d6c.frozen === true &&
        _0x1a8d6c.visible === true &&
        _0x23557c?.visible === true &&
        _0x23557c?.bounds &&
        _0x23557c.webUrl === _0x1a8d6c.webUrl &&
        _0x23557c.pendingPopup === _0x1a8d6c.pendingPopup &&
        _0x23557c.active === _0x1a8d6c.active;
    if (_0x4fa4b7) {
      const _0x2921e6 = {
        ..._0x23557c,
        selected: _0x1a8d6c.selected,
        zoomFactor: _0x1a8d6c.zoomFactor,
        deferZoomFactor: _0x1a8d6c.deferZoomFactor,
        frozen: true,
        freezeToken: _0x1a8d6c.freezeToken,
        snapshotReady: _0x1a8d6c.snapshotReady,
        snapshotHold: _0x1a8d6c.snapshotHold,
        showSnapshot: _0x1a8d6c.showSnapshot,
        syncPriority: _0x23557c.frozen === true ? 'background-throttled' : undefined,
      };
      return (_0x56af16.cachedViewsByNodeId.set(_0x6693c2, _0x2921e6), _0x2921e6);
    }
    const _0x32e9dc = _0x312476 && _0x1a8d6c.frozen !== true,
      _0xfbc2c8 =
        _0x1a8d6c.deferZoomFactor === true && _0x1a8d6c.frozen !== true && _0x1a8d6c.visible === true,
      _0x281c31 =
        _0x1a8d6c.fullscreen ||
        (_0x1a8d6c.selected && !_0x1a8d6c.frozen) ||
        _0xfbc2c8 ||
        _0x32e9dc ||
        !_0x23557c ||
        _0x23557c.active !== _0x1a8d6c.active ||
        _0x23557c.webUrl !== _0x1a8d6c.webUrl ||
        _0x23557c.pendingPopup !== _0x1a8d6c.pendingPopup ||
        _0x23557c.visible !== _0x1a8d6c.visible ||
        _0x23557c.frozen !== _0x1a8d6c.frozen ||
        _0x23557c.freezeToken !== _0x1a8d6c.freezeToken ||
        _0x23557c.snapshotReady !== _0x1a8d6c.snapshotReady ||
        _0x23557c.snapshotHold !== _0x1a8d6c.snapshotHold;
    if (_0x281c31) return (_0x56af16.cachedViewsByNodeId.set(_0x6693c2, _0x1a8d6c), _0x1a8d6c);
    return {
      ..._0x23557c,
      webUrl: _0x1a8d6c.webUrl,
      pendingPopup: _0x1a8d6c.pendingPopup,
      active: _0x1a8d6c.active,
      selected: _0x1a8d6c.selected,
      zoomFactor: _0x1a8d6c.zoomFactor,
      deferZoomFactor: _0x1a8d6c.deferZoomFactor,
      frozen: _0x1a8d6c.frozen,
      freezeToken: _0x1a8d6c.freezeToken,
      snapshotReady: _0x1a8d6c.snapshotReady,
      snapshotHold: _0x1a8d6c.snapshotHold,
      showSnapshot: _0x1a8d6c.showSnapshot,
      syncPriority: 'background-throttled',
    };
  });
}
function buildViewsSignature(_0x5b147e = []) {
  return _0x5b147e
    .map((_0x1756bb) => {
      const _0x43e69a = _0x1756bb?.bounds || {};
      return [
        _0x1756bb?.nodeId || '',
        _0x1756bb?.tabId || '',
        _0x1756bb?.webUrl || '',
        _0x1756bb?.pendingPopup === true ? 1 : 0,
        _0x1756bb?.browserProfileId || '',
        _0x1756bb?.active === true ? 1 : 0,
        _0x1756bb?.visible === true ? 1 : 0,
        Number(_0x43e69a.x || 0),
        Number(_0x43e69a.y || 0),
        Number(_0x43e69a.width || 0),
        Number(_0x43e69a.height || 0),
        Number(_0x1756bb?.zoomFactor || 1).toFixed(3),
        _0x1756bb?.deferZoomFactor === true ? 1 : 0,
        _0x1756bb?.frozen === true ? 1 : 0,
        _0x1756bb?.freezeToken || '',
        _0x1756bb?.snapshotReady === true ? 1 : 0,
        _0x1756bb?.snapshotHold === true ? 1 : 0,
        _0x1756bb?.showSnapshot === true ? 1 : 0,
        _0x1756bb?.fullscreen === true ? 1 : 0,
        _0x1756bb?.selected === true ? 1 : 0,
        _0x1756bb?.canvasSpaceHeld === true ? 1 : 0,
      ].join(':');
    })
    .join('|');
}
function clearFinalSyncTimer(_0x53f961) {
  if (!_0x53f961?.finalSyncTimer) return;
  (clearTimeout(_0x53f961.finalSyncTimer), (_0x53f961.finalSyncTimer = null));
}
function setBodyClass(_0xbac539, _0x3b755c) {
  const _0x5c2010 = globalThis.document?.body?.classList;
  if (!_0x5c2010) return;
  const _0xd907f8 = Boolean(_0x5c2010.contains?.(_0xbac539));
  if (_0x3b755c) {
    if (!_0xd907f8) _0x5c2010.add?.(_0xbac539);
  } else _0xd907f8 && _0x5c2010.remove?.(_0xbac539);
}
function setFreezeActiveClass(_0x31e185) {
  setBodyClass(FREEZE_ACTIVE_BODY_CLASS, _0x31e185);
}
function setFreezeSettlingClass(_0x4e4d48) {
  setBodyClass(FREEZE_SETTLING_BODY_CLASS, _0x4e4d48);
}
function clearFreezeSettlingTimer(_0x633ce7) {
  if (!_0x633ce7?.freezeSettlingTimer) return;
  (clearTimeout(_0x633ce7.freezeSettlingTimer), (_0x633ce7.freezeSettlingTimer = null));
}
function scheduleFreezeSettlingClear(_0x19439b) {
  if (!_0x19439b) return;
  (setFreezeSettlingClass(true),
    clearFreezeSettlingTimer(_0x19439b),
    (_0x19439b.freezeSettlingUntil = getNowMs() + FREEZE_SETTLE_HOLD_MS),
    (_0x19439b.freezeSettlingTimer = setTimeout(() => {
      ((_0x19439b.freezeSettlingTimer = null),
        (_0x19439b.freezeSettlingUntil = 0),
        setFreezeSettlingClass(false));
      if (!getCanvasInteractionState().frozen) setFreezeActiveClass(false);
      _0x19439b.scheduleFinalSync();
    }, FREEZE_SETTLE_HOLD_MS)));
}
function createSyncBudgetState(_0x441c99) {
  const _0x2858df = {
    cachedViewsByNodeId: new Map(),
    finalSyncTimer: null,
    freezeSettlingTimer: null,
    freezeSettlingUntil: 0,
    freezeActive: false,
    snapshotFreezeActive: false,
    snapshotSettleActive: false,
    canvasSpaceHeld: readCanvasSpaceHeld(),
    freezeToken: 0,
    lastBackgroundSyncAt: 0,
    lastViewsSignature: '',
    scheduleFinalSync() {
      (clearFinalSyncTimer(_0x2858df),
        (_0x2858df.finalSyncTimer = setTimeout(() => {
          ((_0x2858df.finalSyncTimer = null), _0x441c99());
        }, FINAL_INTERACTION_SYNC_DELAY_MS)));
    },
  };
  return _0x2858df;
}
function markInteractionTransition(_0x2a50c0, _0x90515a) {
  if (!_0x2a50c0) return;
  const _0x515150 = Boolean(_0x90515a?.frozen),
    _0x249f1a = Boolean(_0x90515a?.showSnapshot),
    _0x4083cf = Boolean(_0x90515a?.settleSnapshot),
    _0x55483c = _0x515150 && !_0x2a50c0.freezeActive,
    _0x2f9e38 = _0x515150 && _0x249f1a && !_0x2a50c0.snapshotFreezeActive;
  if (_0x55483c || _0x2f9e38)
    (clearFreezeSettlingTimer(_0x2a50c0),
      (_0x2a50c0.freezeSettlingUntil = 0),
      setFreezeSettlingClass(false),
      (_0x2a50c0.freezeToken += 1),
      (_0x2a50c0.lastBackgroundSyncAt = 0));
  else
    !_0x515150 &&
      _0x2a50c0.freezeActive &&
      ((_0x2a50c0.lastBackgroundSyncAt = 0),
      _0x2a50c0.snapshotSettleActive
        ? scheduleFreezeSettlingClear(_0x2a50c0)
        : ((_0x2a50c0.freezeSettlingUntil = 0),
          setFreezeSettlingClass(false),
          setFreezeActiveClass(false),
          _0x2a50c0.scheduleFinalSync()));
  ((_0x2a50c0.freezeActive = _0x515150),
    (_0x2a50c0.snapshotFreezeActive = _0x515150 && _0x249f1a),
    (_0x2a50c0.snapshotSettleActive = _0x515150 && _0x4083cf));
}
function getEffectiveInteractionState(_0x329a49, _0x19f0bb) {
  const _0x148be9 = !_0x329a49?.frozen && Number(_0x19f0bb?.freezeSettlingUntil || 0) > getNowMs();
  if (!_0x148be9) return _0x329a49;
  return { frozen: true, deferZoomFactor: true, settleSnapshot: true, showSnapshot: true };
}
function collectWebPreviewViews({
  graphStore: _0xd554e1,
  root: root = document,
  freezeToken: freezeToken = 0,
  interactionState: interactionState = getCanvasInteractionState(),
  canvasSpaceHeld: canvasSpaceHeld = readCanvasSpaceHeld(),
} = {}) {
  const _0x3319e4 =
      typeof _0xd554e1?.getStateRaw === 'function' ? _0xd554e1.getStateRaw() : _0xd554e1?.getState?.() || {},
    _0x44e556 = new Set(_0x3319e4.selectedNodeIds || []),
    _0x24aa5a = Object.values(_0x3319e4.nodes || {})
      .filter((_0x4fded4) => _0x4fded4?.type === 'web-preview')
      .map((_0x123989) => {
        const _0xaec0fc = normalizeWebPreviewTabs(_0x123989);
        return {
          node: _0x123989,
          tabState: _0xaec0fc,
          tabs: _0xaec0fc.tabs
            .map((_0x2bc605) => ({
              tab: _0x2bc605,
              webUrl: normalizeWebPreviewUrl(_0x2bc605.url),
              pendingPopup: _0x2bc605.pendingPopup === true,
              active: _0x2bc605.id === _0xaec0fc.activeTabId,
            }))
            .filter((_0xd26072) => _0xd26072.webUrl || _0xd26072.pendingPopup),
        };
      })
      .filter((_0x42df20) => _0x42df20.tabs.length > 0),
    _0x402b64 = normalizeCanvasZoom(_0x3319e4.viewport?.zoom),
    _0x1b866f = buildSlotIndex(
      root,
      _0x24aa5a.map((_0x3ab123) => _0x3ab123.node.id),
    ),
    _0x2c8f65 = collectOcclusionRects(root, SOFT_OCCLUSION_SELECTOR),
    _0x39bdb1 = collectOcclusionRects(root, HARD_OCCLUSION_SELECTOR),
    _0x333e53 = collectOcclusionRects(root, FULLSCREEN_OCCLUSION_SELECTOR),
    _0x2f275d = [];
  for (const { node: _0x36272c, tabs: _0x52dbc6 } of _0x24aa5a) {
    const _0x3a078a = _0x1b866f.get(_0x36272c.id);
    for (const {
      tab: _0x1930e4,
      webUrl: _0x18aa12,
      pendingPopup: _0xf781ec,
      active: _0x3e2ffc,
    } of _0x52dbc6) {
      _0x2f275d.push(
        buildViewPayload({
          node: _0x36272c,
          tabId: _0x1930e4.id,
          webUrl: _0x18aa12,
          pendingPopup: _0xf781ec,
          slot: _0x3e2ffc ? _0x3a078a : null,
          active: _0x3e2ffc,
          selected: _0x3e2ffc && _0x44e556.has(_0x36272c.id),
          canvasZoom: _0x402b64,
          interactionState: interactionState,
          freezeToken: freezeToken,
          canvasSpaceHeld: canvasSpaceHeld,
          fullscreenBlockerRects: _0x333e53,
          softBlockerRects: _0x2c8f65,
          hardBlockerRects: _0x39bdb1,
        }),
      );
    }
  }
  return (
    _0x2f275d.sort((_0x2aa9da, _0x1515e8) => Number(_0x2aa9da.selected) - Number(_0x1515e8.selected)),
    _0x2f275d
  );
}
export function initWebPreviewViewSyncService({ graphStore: _0x5bc956, root: root = document } = {}) {
  const _0x498fbf = globalThis.window?.electronAPI?.webPreview;
  if (!_0x498fbf || typeof _0x498fbf.syncViews !== 'function') return { dispose() {} };
  const _0x55951b = getRequestAnimationFrame(),
    _0x282f64 = getCancelAnimationFrame(),
    _0x17a1fc = typeof _0x498fbf.syncViewsFast === 'function' ? _0x498fbf.syncViewsFast : _0x498fbf.syncViews;
  let _0x2d4e7a = null,
    _0x31848c = false,
    _0x20a858 = hasActiveWebPreviewNodes(_0x5bc956),
    _0x10c62f = null;
  const _0xe75f76 = () => {
      _0x2d4e7a = null;
      if (_0x31848c) return;
      const _0xad173d = getCanvasInteractionState();
      markInteractionTransition(_0x10c62f, _0xad173d);
      const _0x260d46 = getEffectiveInteractionState(_0xad173d, _0x10c62f),
        _0x22d0a5 = syncCachedViewsForBudget(
          collectWebPreviewViews({
            graphStore: _0x5bc956,
            root: root,
            freezeToken: _0x10c62f?.freezeToken || 0,
            interactionState: _0x260d46,
            canvasSpaceHeld: _0x10c62f?.canvasSpaceHeld === true,
          }),
          _0x10c62f,
        );
      setFreezeActiveClass(_0x22d0a5.some((_0x56f076) => _0x56f076?.showSnapshot === true));
      const _0x1b7d3a = buildViewsSignature(_0x22d0a5);
      if (_0x1b7d3a === _0x10c62f?.lastViewsSignature) return;
      if (_0x10c62f) _0x10c62f.lastViewsSignature = _0x1b7d3a;
      try {
        const _0x581a46 = _0x17a1fc({ views: _0x22d0a5 });
        _0x581a46 && typeof _0x581a46.catch === 'function' && void _0x581a46.catch(() => {});
      } catch {}
    },
    _0x3b51a0 = () => {
      if (_0x31848c || _0x2d4e7a !== null) return;
      _0x2d4e7a = _0x55951b(_0xe75f76);
    },
    _0x278cfa = () => {
      if (_0x31848c) return;
      (_0x2d4e7a !== null && (_0x282f64(_0x2d4e7a), (_0x2d4e7a = null)), _0xe75f76());
    },
    _0x10144e = () => {
      const _0x395cc1 = getCanvasInteractionState();
      return (
        _0x395cc1.frozen ||
        _0x395cc1.deferZoomFactor ||
        _0x10c62f?.freezeActive === true ||
        Number(_0x10c62f?.freezeSettlingUntil || 0) > getNowMs()
      );
    },
    _0x987633 = () => {
      if (_0x10144e()) {
        _0x278cfa();
        return;
      }
      _0x3b51a0();
    },
    _0x45a0bc = () => {
      if (!_0x20a858) return;
      _0x278cfa();
    };
  _0x10c62f = createSyncBudgetState(_0x3b51a0);
  const _0x3880f9 = () => {
      if (!_0x20a858) return;
      if (isViewportPanPreviewActive()) return;
      _0x3b51a0();
    },
    _0x25da6d = () => {
      if (!_0x20a858) return;
      _0x278cfa();
    },
    _0x4abd54 = () => {
      if (!_0x20a858) return;
      _0x278cfa();
    },
    _0x136894 = (_0x4113f9) => {
      if (!_0x20a858) return;
      if (isPotentialCanvasPanStartEvent(_0x4113f9)) {
        _0x4abd54();
        return;
      }
      _0x3b51a0();
    },
    _0x303b9f = () => {
      _0x3880f9();
    },
    _0x165115 = () => {
      if (!_0x20a858 || !_0x10c62f) return;
      const _0x3b98f9 = readCanvasSpaceHeld();
      if (_0x10c62f.canvasSpaceHeld === _0x3b98f9) return;
      ((_0x10c62f.canvasSpaceHeld = _0x3b98f9), _0x278cfa());
    },
    _0x3aa7cd = () => {
      ((_0x20a858 = hasActiveWebPreviewNodes(_0x5bc956)), _0x987633());
    },
    _0x3b4dca = typeof _0x5bc956?.subscribeRaw === 'function' ? _0x5bc956.subscribeRaw(_0x3aa7cd) : () => {},
    _0x5ee314 =
      typeof _0x498fbf.onEvent === 'function'
        ? _0x498fbf.onEvent((_0xa9f81d) => {
            if (isNativePanStartPreviewEvent(_0xa9f81d)) _0x4abd54();
            globalThis.window?.dispatchEvent?.(
              new CustomEvent('web-preview:native-event', { detail: _0xa9f81d }),
            );
          })
        : () => {},
    _0x3f2498 = globalThis.window?.MutationObserver || globalThis.MutationObserver,
    _0x440369 =
      typeof _0x3f2498 === 'function'
        ? new _0x3f2498((_0x2247de) => {
            if (shouldSyncForOcclusionMutation(_0x2247de)) _0x45a0bc();
          })
        : null,
    _0x1d2e94 = root?.body || root?.documentElement || root;
  try {
    _0x440369?.observe?.(_0x1d2e94, {
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden'],
      attributeOldValue: true,
      childList: true,
      subtree: true,
    });
  } catch {}
  return (
    globalThis.window?.addEventListener?.('resize', _0x3b51a0),
    globalThis.window?.addEventListener?.('scroll', _0x3b51a0, true),
    globalThis.window?.addEventListener?.(VIEWPORT_PAN_PREVIEW_FRAME_EVENT, _0x25da6d),
    globalThis.window?.addEventListener?.('pointerdown', _0x136894, true),
    globalThis.window?.addEventListener?.('pointermove', _0x3880f9),
    globalThis.window?.addEventListener?.('pointerup', _0x303b9f),
    globalThis.window?.addEventListener?.('pointercancel', _0x303b9f),
    globalThis.window?.addEventListener?.('keydown', _0x165115),
    globalThis.window?.addEventListener?.('keyup', _0x165115),
    globalThis.window?.addEventListener?.('blur', _0x165115),
    globalThis.window?.addEventListener?.('wheel', _0x3880f9, { passive: true }),
    globalThis.window?.addEventListener?.('web-preview:force-sync', _0x278cfa),
    _0x3b51a0(),
    {
      dispose() {
        ((_0x31848c = true), clearFinalSyncTimer(_0x10c62f), clearFreezeSettlingTimer(_0x10c62f));
        if (_0x10c62f) _0x10c62f.freezeSettlingUntil = 0;
        (setFreezeActiveClass(false), setFreezeSettlingClass(false));
        if (_0x2d4e7a !== null) _0x282f64(_0x2d4e7a);
        ((_0x2d4e7a = null),
          _0x3b4dca?.(),
          _0x5ee314?.(),
          globalThis.window?.removeEventListener?.('resize', _0x3b51a0),
          globalThis.window?.removeEventListener?.('scroll', _0x3b51a0, true),
          globalThis.window?.removeEventListener?.(VIEWPORT_PAN_PREVIEW_FRAME_EVENT, _0x25da6d),
          globalThis.window?.removeEventListener?.('pointerdown', _0x136894, true),
          globalThis.window?.removeEventListener?.('pointermove', _0x3880f9),
          globalThis.window?.removeEventListener?.('pointerup', _0x303b9f),
          globalThis.window?.removeEventListener?.('pointercancel', _0x303b9f),
          globalThis.window?.removeEventListener?.('keydown', _0x165115),
          globalThis.window?.removeEventListener?.('keyup', _0x165115),
          globalThis.window?.removeEventListener?.('blur', _0x165115),
          globalThis.window?.removeEventListener?.('wheel', _0x3880f9, { passive: true }),
          globalThis.window?.removeEventListener?.('web-preview:force-sync', _0x278cfa),
          _0x440369?.disconnect?.(),
          void _0x498fbf.disposeViews?.());
      },
    }
  );
}
export { collectWebPreviewViews };
