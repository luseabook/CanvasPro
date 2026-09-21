import { computeNodesWorldBounds, computeViewportForWorldBounds } from './math.js';
import { jumpZoomPercentToViewportZoom } from '../modules/commentNoteJumpShortcut.js';
function _getWindowObject(_0x130f03) {
  if (_0x130f03) return _0x130f03;
  if (typeof window !== 'undefined') return window;
  return null;
}
function _getRaf() {
  return typeof globalThis.requestAnimationFrame === 'function'
    ? globalThis.requestAnimationFrame.bind(globalThis)
    : (_0x50eea3) => setTimeout(() => _0x50eea3(Date.now()), 16);
}
function _getCaf() {
  return typeof globalThis.cancelAnimationFrame === 'function'
    ? globalThis.cancelAnimationFrame.bind(globalThis)
    : (_0x29fbba) => clearTimeout(_0x29fbba);
}
function _getDefaultViewport() {
  return { x: 0, y: 0, zoom: 1 };
}
function _normalizeViewportRect(_0x60dde6, _0x26d653, _0x2705ec, _0x588502) {
  const _0xeffda6 = Number.isFinite(Number(_0x60dde6)) ? Number(_0x60dde6) : 0,
    _0xf2faea = Number.isFinite(Number(_0x26d653)) ? Number(_0x26d653) : 0,
    _0x10061b = Number.isFinite(Number(_0x2705ec)) ? Number(_0x2705ec) : 0,
    _0x3612c9 = Number.isFinite(Number(_0x588502)) ? Number(_0x588502) : 0;
  return {
    left: _0xeffda6,
    top: _0xf2faea,
    width: _0x10061b,
    height: _0x3612c9,
    right: _0xeffda6 + _0x10061b,
    bottom: _0xf2faea + _0x3612c9,
    centerX: _0xeffda6 + _0x10061b / 2,
    centerY: _0xf2faea + _0x3612c9 / 2,
  };
}
export function getBrowserViewportRect({
  windowObject: windowObject = undefined,
  containerEl: containerEl = null,
} = {}) {
  const _0x252eb2 = _getWindowObject(windowObject),
    _0x1a56e7 = _0x252eb2?.visualViewport || null;
  if (
    _0x1a56e7 &&
    Number.isFinite(Number(_0x1a56e7.width)) &&
    Number.isFinite(Number(_0x1a56e7.height)) &&
    Number(_0x1a56e7.width) > 0 &&
    Number(_0x1a56e7.height) > 0
  )
    return _normalizeViewportRect(
      _0x1a56e7.offsetLeft,
      _0x1a56e7.offsetTop,
      _0x1a56e7.width,
      _0x1a56e7.height,
    );
  if (containerEl && typeof containerEl.getBoundingClientRect === 'function') {
    const _0x241329 = containerEl.getBoundingClientRect();
    if (
      Number.isFinite(Number(_0x241329?.width)) &&
      Number.isFinite(Number(_0x241329?.height)) &&
      Number(_0x241329.width) > 0 &&
      Number(_0x241329.height) > 0
    )
      return _normalizeViewportRect(_0x241329.left, _0x241329.top, _0x241329.width, _0x241329.height);
  }
  return _normalizeViewportRect(
    0,
    0,
    Number(_0x252eb2?.innerWidth) || 0,
    Number(_0x252eb2?.innerHeight) || 0,
  );
}
function _resolveMaxZoom(_0x1a8689, _0x58a04b) {
  if (typeof _0x1a8689 === 'number' && Number.isFinite(_0x1a8689)) return _0x1a8689;
  if (_0x1a8689 && typeof _0x1a8689 === 'object' && Number.isFinite(Number(_0x1a8689.maxZoom)))
    return Number(_0x1a8689.maxZoom);
  return _0x58a04b;
}
export function createViewportFocusController({
  store: _0x39009b,
  animateViewport: _0x2fc720,
  cancelAnimation: _0x1beaf8,
  containerEl: containerEl = null,
  windowObject: windowObject = undefined,
  minZoom: minZoom = 0.2,
  maxZoom: maxZoom = 2,
  resolveZoomPercent: resolveZoomPercent = jumpZoomPercentToViewportZoom,
} = {}) {
  const _0x391556 = _getWindowObject(windowObject),
    _0x1d1f03 = _getRaf(),
    _0x3c90ca = _getCaf();
  let _0x30d7ea = null,
    _0x3da441 = null;
  const _0x14bb4a = () => {
      if (typeof _0x39009b?.getStateRaw === 'function') return _0x39009b.getStateRaw();
      if (typeof _0x39009b?.getState === 'function') return _0x39009b.getState();
      return {};
    },
    _0x5db40d = (_0x2bfa8b, _0x219bce, _0x2d7042) => {
      _0x39009b?.updateViewport?.(_0x2bfa8b, _0x219bce, _0x2d7042);
    },
    _0x358c9f = () => {
      _0x39009b?.markViewportPersist?.();
    },
    _0xa00d77 = () => {
      const _0x442a72 =
        typeof _0x391556?._v2UpdateSidePlusNow === 'function'
          ? _0x391556._v2UpdateSidePlusNow
          : _0x391556?._v2UpdateSidePlus;
      if (typeof _0x442a72 === 'function') {
        const _0x5efe2b = Number(_0x391556._lastMx),
          _0x467d04 = Number(_0x391556._lastMy);
        _0x442a72(
          Number.isFinite(_0x5efe2b) ? _0x5efe2b : undefined,
          Number.isFinite(_0x467d04) ? _0x467d04 : undefined,
        );
      }
    };
  function _0x317756() {
    if (_0x30d7ea) _0x1beaf8?.();
    ((_0x30d7ea = null), _0x3da441 !== null && (_0x3c90ca(_0x3da441), (_0x3da441 = null)));
  }
  function _0x4302d2() {
    return _0x30d7ea ? { ..._0x30d7ea } : null;
  }
  function _0xa199bd(_0x24487b) {
    if (!_0x24487b) return null;
    const _0x55be86 = _0x14bb4a(),
      _0x5d237b = _0x55be86?.nodes || {},
      _0x3c5e8f = getBrowserViewportRect({ windowObject: _0x391556, containerEl: containerEl });
    let _0x121b38 = null,
      _0x1be0de = { minZoom: minZoom, maxZoom: maxZoom };
    _0x24487b.type === 'node-zoom-percent'
      ? ((_0x121b38 = computeNodesWorldBounds(_0x5d237b, [_0x24487b.nodeId])),
        (_0x1be0de.fixedZoom = resolveZoomPercent(_0x24487b.zoomPercent)))
      : ((_0x121b38 = computeNodesWorldBounds(_0x5d237b, _0x24487b.nodeIds)),
        (_0x1be0de.padding = _0x24487b.padding),
        (_0x1be0de.maxZoom = _resolveMaxZoom(_0x24487b.options, maxZoom)));
    if (!_0x121b38) return null;
    const _0x16da2d = computeViewportForWorldBounds(_0x121b38, _0x3c5e8f, _0x1be0de);
    if (!_0x16da2d) return null;
    return { target: _0x16da2d, viewport: _0x55be86?.viewport || _getDefaultViewport() };
  }
  function _0x5bc526() {
    _0x3da441 = null;
    if (!_0x30d7ea) return false;
    const _0x4ed555 = _0xa199bd(_0x30d7ea);
    if (!_0x4ed555) return (_0x317756(), false);
    const { target: _0x3c3ed5, viewport: _0x15a3a5 } = _0x4ed555;
    if (_0x15a3a5.x === _0x3c3ed5.x && _0x15a3a5.y === _0x3c3ed5.y && _0x15a3a5.zoom === _0x3c3ed5.zoom)
      return true;
    return (
      _0x1beaf8?.(),
      _0x5db40d(_0x3c3ed5.x, _0x3c3ed5.y, _0x3c3ed5.zoom),
      _0x358c9f(),
      _0xa00d77(),
      true
    );
  }
  function _0x1819bc() {
    if (!_0x30d7ea || _0x3da441 !== null) return;
    _0x3da441 = _0x1d1f03(() => {
      _0x5bc526();
    });
  }
  function _0x25d59a(_0x386e9c) {
    const _0x42a7e7 = _0xa199bd(_0x386e9c);
    if (!_0x42a7e7) return (_0x317756(), false);
    _0x30d7ea = { ..._0x386e9c };
    const { viewport: _0x69db16, target: _0x263f0 } = _0x42a7e7;
    return (
      _0x2fc720?.(
        _0x69db16.x,
        _0x69db16.y,
        _0x69db16.zoom,
        _0x263f0.x,
        _0x263f0.y,
        _0x263f0.zoom,
        _0x386e9c.durationMs,
      ),
      true
    );
  }
  function _0x4ebbb4(_0x5cbf04, _0x4791de = 120, _0x4aac7e = 0x5dc, _0x43ddba = null) {
    return _0x25d59a({
      type: 'nodes-fit',
      nodeIds: [_0x5cbf04],
      padding: _0x4791de,
      durationMs: _0x4aac7e,
      options: _0x43ddba,
    });
  }
  function _0x3429ee(_0x3a0230, _0x2babc4 = 80, _0x2d58ba = 0x320, _0x25e81b = null) {
    if (!Array.isArray(_0x3a0230) || _0x3a0230.length === 0) return (_0x317756(), false);
    return _0x25d59a({
      type: 'nodes-fit',
      nodeIds: [..._0x3a0230],
      padding: _0x2babc4,
      durationMs: _0x2d58ba,
      options: _0x25e81b,
    });
  }
  function _0x3d61aa(_0x2c080e, _0x5b3749 = 60, _0x49ba83 = 0x320) {
    return _0x25d59a({
      type: 'node-zoom-percent',
      nodeId: _0x2c080e,
      zoomPercent: _0x5b3749,
      durationMs: _0x49ba83,
    });
  }
  const _0x3727e3 = () => _0x1819bc();
  (_0x391556?.addEventListener?.('resize', _0x3727e3),
    _0x391556?.visualViewport?.addEventListener?.('resize', _0x3727e3),
    _0x391556?.visualViewport?.addEventListener?.('scroll', _0x3727e3));
  function _0xe03588() {
    (_0x317756(),
      _0x391556?.removeEventListener?.('resize', _0x3727e3),
      _0x391556?.visualViewport?.removeEventListener?.('resize', _0x3727e3),
      _0x391556?.visualViewport?.removeEventListener?.('scroll', _0x3727e3));
  }
  return {
    focusNode: _0x4ebbb4,
    focusNodes: _0x3429ee,
    focusNodeAtZoomPercent: _0x3d61aa,
    clearTrackedFocus: _0x317756,
    getTrackedFocusRequest: _0x4302d2,
    reapplyTrackedFocusNow: _0x5bc526,
    getBrowserViewportRect() {
      return getBrowserViewportRect({ windowObject: _0x391556, containerEl: containerEl });
    },
    destroy: _0xe03588,
  };
}
