import { beginResizeFpsSession, endResizeFpsSession } from '../perf/perfProbe.js';
const RESIZE_BODY_CLASS = 'is-node-resizing',
  RESIZE_NODE_CLASS = 'is-resizing';
function requestFrame(_0x2cc2cd) {
  if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(_0x2cc2cd);
  return setTimeout(_0x2cc2cd, 0);
}
function cancelFrame(_0x5eaa83) {
  if (!_0x5eaa83) return;
  if (typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(_0x5eaa83);
    return;
  }
  clearTimeout(_0x5eaa83);
}
function toFiniteNumber(_0x1b891e, _0x1979df) {
  const _0x419b6b = Number(_0x1b891e);
  return Number.isFinite(_0x419b6b) ? _0x419b6b : _0x1979df;
}
function normalizeSize(_0x28be1a, _0x4707ad, _0x8549ce) {
  return {
    width: Math.max(1, toFiniteNumber(_0x28be1a?.width, _0x4707ad)),
    height: Math.max(1, toFiniteNumber(_0x28be1a?.height, _0x8549ce)),
  };
}
function sizesEqual(_0x1cd602, _0x4da5fd) {
  return (
    Math.round(toFiniteNumber(_0x1cd602?.width, 0)) === Math.round(toFiniteNumber(_0x4da5fd?.width, 0)) &&
    Math.round(toFiniteNumber(_0x1cd602?.height, 0)) === Math.round(toFiniteNumber(_0x4da5fd?.height, 0))
  );
}
function applyPreviewSize(_0x2eda02, _0x3f43e3) {
  if (!_0x2eda02?.style) return;
  ((_0x2eda02.style.width = _0x3f43e3.width + 'px'), (_0x2eda02.style.height = _0x3f43e3.height + 'px'));
}
function syncPreviewGeometry(_0xf6ee90, _0x6b5153, _0x5178f9, _0x80868c) {
  const _0x1d6ffe = typeof window !== 'undefined' ? window : null;
  if (!_0x1d6ffe || !_0xf6ee90 || !_0x6b5153) return;
  _0x1d6ffe.v2Renderer?.previewNodeResizeGeometry?.({
    nodeId: _0xf6ee90,
    width: _0x6b5153.width,
    height: _0x6b5153.height,
  });
  const _0x381d8d =
    typeof _0x1d6ffe._v2UpdateSidePlusNow === 'function'
      ? _0x1d6ffe._v2UpdateSidePlusNow
      : _0x1d6ffe._v2UpdateSidePlus;
  if (typeof _0x381d8d !== 'function') return;
  _0x381d8d(
    Number.isFinite(_0x1d6ffe._lastMx) ? _0x1d6ffe._lastMx : _0x5178f9,
    Number.isFinite(_0x1d6ffe._lastMy) ? _0x1d6ffe._lastMy : _0x80868c,
    { nodeSizeOverrides: { [_0xf6ee90]: { width: _0x6b5153.width, height: _0x6b5153.height } } },
  );
}
function readViewportZoom(_0x5fb702) {
  const _0x1cfb70 = (typeof _0x5fb702 === 'function' && _0x5fb702()) || { zoom: 1 };
  return Math.max(0.01, toFiniteNumber(_0x1cfb70.zoom, 1));
}
export function startNodeResizePreview({
  event: _0x30761e,
  nodeId: _0xc41a0e,
  getNode: _0x5d2117,
  getViewport: _0x163573,
  resolveSize: _0x1a034e,
  applyPatch: _0x15b520,
  buildFinalPatch: _0xe577fc,
  afterApply: _0x528cef,
  onPreview: _0x35a3d8,
  onPreviewEnd: _0x5f160a,
  commit: _0x3565f3,
  label: label = 'node-resize',
} = {}) {
  if (!_0x30761e || !_0xc41a0e || typeof _0x1a034e !== 'function') return false;
  (_0x30761e.preventDefault?.(), _0x30761e.stopPropagation?.());
  const _0x15b35c = (typeof _0x5d2117 === 'function' && _0x5d2117()) || {},
    _0x437bc1 = toFiniteNumber(_0x30761e.clientX, 0),
    _0x190025 = toFiniteNumber(_0x30761e.clientY, 0),
    _0x15b68e = Math.max(1, toFiniteNumber(_0x15b35c.width, 0x104)),
    _0x51c4d2 = Math.max(1, toFiniteNumber(_0x15b35c.height, 0x104)),
    _0x4e9c74 = { width: _0x15b68e, height: _0x51c4d2 },
    _0x205038 = typeof document !== 'undefined' ? document.getElementById(_0xc41a0e) : null,
    _0x5d4d28 = typeof document !== 'undefined' ? document.body : null;
  let _0x445e9a = null,
    _0x57515e = _0x4e9c74,
    _0x178fe7 = _0x437bc1,
    _0x138fb8 = _0x190025,
    _0x48d62e = 0,
    _0x3f7a50 = false;
  const _0x2067cd = () => {
      _0x48d62e = 0;
      if (!_0x445e9a) return;
      ((_0x57515e = _0x445e9a),
        (_0x445e9a = null),
        applyPreviewSize(_0x205038, _0x57515e),
        syncPreviewGeometry(_0xc41a0e, _0x57515e, _0x178fe7, _0x138fb8),
        _0x35a3d8?.(_0x57515e));
    },
    _0x4891b3 = (_0x1acf6e) => {
      _0x445e9a = _0x1acf6e;
      if (_0x48d62e) return;
      _0x48d62e = requestFrame(_0x2067cd);
    },
    _0x558392 = () => {
      (_0x48d62e && (cancelFrame(_0x48d62e), (_0x48d62e = 0)),
        window.removeEventListener('pointermove', _0x27d99b),
        window.removeEventListener('pointerup', _0xc37cf2),
        window.removeEventListener('pointercancel', _0xc37cf2),
        _0x5d4d28?.classList?.remove(RESIZE_BODY_CLASS),
        _0x205038?.classList?.remove(RESIZE_NODE_CLASS),
        _0x5f160a?.(),
        endResizeFpsSession(label));
    },
    _0x46c0a8 = () => {
      const _0x17a48c = _0x445e9a || _0x57515e;
      if (_0x445e9a) _0x2067cd();
      const _0x4967ff =
          (typeof _0xe577fc === 'function' &&
            _0xe577fc({ startNode: _0x15b35c, startSize: _0x4e9c74, finalSize: _0x17a48c })) ||
          {},
        _0x391eb0 = Object.keys(_0x4967ff).length > 0,
        _0x14588c = !sizesEqual(_0x17a48c, _0x4e9c74);
      let _0x3303eb = false;
      (_0x14588c || _0x391eb0) &&
        typeof _0x15b520 === 'function' &&
        (_0x15b520({ width: _0x17a48c.width, height: _0x17a48c.height, ..._0x4967ff }), (_0x3303eb = true));
      syncPreviewGeometry(_0xc41a0e, _0x17a48c, _0x178fe7, _0x138fb8);
      const _0x1db263 =
        typeof _0x528cef === 'function' &&
        _0x528cef({
          startNode: _0x15b35c,
          startSize: _0x4e9c74,
          finalSize: _0x17a48c,
          didApply: _0x3303eb,
        }) === true;
      (_0x3303eb || _0x1db263) && typeof _0x3565f3 === 'function' && _0x3565f3();
    };
  function _0x27d99b(_0x517822) {
    if (_0x3f7a50) return;
    ((_0x178fe7 = toFiniteNumber(_0x517822.clientX, _0x178fe7)),
      (_0x138fb8 = toFiniteNumber(_0x517822.clientY, _0x138fb8)));
    const _0x293e88 = readViewportZoom(_0x163573),
      _0x3d3b68 = (_0x178fe7 - _0x437bc1) / _0x293e88,
      _0x7b71da = (_0x138fb8 - _0x190025) / _0x293e88,
      _0x2b4026 = normalizeSize(
        _0x1a034e({
          startNode: _0x15b35c,
          startWidth: _0x15b68e,
          startHeight: _0x51c4d2,
          dx: _0x3d3b68,
          dy: _0x7b71da,
          event: _0x517822,
        }),
        _0x15b68e,
        _0x51c4d2,
      );
    if (_0x445e9a && sizesEqual(_0x445e9a, _0x2b4026)) return;
    if (!_0x445e9a && sizesEqual(_0x57515e, _0x2b4026)) return;
    _0x4891b3(_0x2b4026);
  }
  function _0xc37cf2() {
    if (_0x3f7a50) return;
    ((_0x3f7a50 = true), _0x558392(), _0x46c0a8());
  }
  return (
    _0x5d4d28?.classList?.add(RESIZE_BODY_CLASS),
    _0x205038?.classList?.add(RESIZE_NODE_CLASS),
    beginResizeFpsSession(label),
    window.addEventListener('pointermove', _0x27d99b),
    window.addEventListener('pointerup', _0xc37cf2),
    window.addEventListener('pointercancel', _0xc37cf2),
    true
  );
}
