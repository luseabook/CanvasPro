import { beginZoomFpsSession, endZoomFpsSession } from '../perf/perfProbe.js';
export function createZoomController({ store: _0x52783c }) {
  let _0x4e7e82 = 0,
    _0x49afdb = 0,
    _0x470c30 = 0,
    _0x3790ab = 0,
    _0x11cc00 = 0,
    _0xf45a92 = null;
  const _0x517579 = 'is-edge-interaction-lite',
    _0x489fd2 = 0.24,
    _0x3c74b2 = 0.48,
    _0x2c5d2f = 3,
    _0x6d934b = 160;
  function _0x5e92d8(_0x509404, _0x4d3d19) {
    const _0x30735d = Object.keys(_0x509404?.edges || {}).length,
      _0x5a1d1d = typeof window !== 'undefined' ? window._edgeDomCache : null;
    return (
      _0x4d3d19 >= _0x489fd2 &&
      _0x4d3d19 <= _0x3c74b2 &&
      _0x30735d >= _0x2c5d2f &&
      _0x5a1d1d &&
      _0x5a1d1d.size > 0
    );
  }
  function _0x492f00(_0x3e2000) {
    if (typeof document === 'undefined' || !document?.body?.classList) return;
    document.body.classList.toggle(_0x517579, !!_0x3e2000);
  }
  function _0x2f0d5e(_0x4c3aea) {
    if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(_0x4c3aea);
    return setTimeout(_0x4c3aea, 0);
  }
  function _0x471df1() {
    _0x470c30 = 0;
    if (!_0xf45a92) return;
    const { x: _0x22d076, y: _0x511a97, zoom: _0x57e4d3 } = _0xf45a92;
    ((_0xf45a92 = null), _0x52783c.updateViewport(_0x22d076, _0x511a97, _0x57e4d3));
  }
  function _0x4cbe74(_0x1970e3) {
    _0xf45a92 = _0x1970e3;
    if (_0x470c30) return;
    _0x470c30 = _0x2f0d5e(_0x471df1);
  }
  function _0x5d7049(_0x9688f7) {
    const _0x559f9b = _0xf45a92 || _0x9688f7?.viewport || {},
      _0x1a5c48 = Number.isFinite(_0x559f9b.zoom) && _0x559f9b.zoom > 0 ? _0x559f9b.zoom : 1;
    return {
      x: Number.isFinite(_0x559f9b.x) ? _0x559f9b.x : 0,
      y: Number.isFinite(_0x559f9b.y) ? _0x559f9b.y : 0,
      zoom: _0x1a5c48,
    };
  }
  function _0x39cb01(_0x3a1613, _0x5cde30, _0xd73b6f) {
    const _0x336436 = _0x52783c.getStateRaw(),
      _0x53d975 = typeof document !== 'undefined' && document && document.body;
    if (_0x53d975) document.body.classList.add('is-zooming');
    beginZoomFpsSession('wheel-zoom');
    const _0x25507e = _0x5d7049(_0x336436),
      _0x3301f5 = _0xd73b6f > 0 ? 0.9 : 1.1,
      _0x223e03 = Math.min(2, Math.max(0.2, _0x25507e.zoom * _0x3301f5)),
      _0x1f0c73 = _0x3a1613 - (_0x3a1613 - _0x25507e.x) * (_0x223e03 / _0x25507e.zoom),
      _0x5845ec = _0x5cde30 - (_0x5cde30 - _0x25507e.y) * (_0x223e03 / _0x25507e.zoom);
    (_0x4cbe74({ x: _0x1f0c73, y: _0x5845ec, zoom: _0x223e03 }), _0x492f00(_0x5e92d8(_0x336436, _0x223e03)));
    if (_0x4e7e82) clearTimeout(_0x4e7e82);
    _0x4e7e82 = setTimeout(() => {
      ((_0x4e7e82 = 0), _0x471df1());
      if (_0x53d975) document.body.classList.remove('is-zooming');
      (_0x492f00(false), endZoomFpsSession('wheel-zoom'), _0x52783c.markViewportPersist());
    }, _0x6d934b);
    const _0x588797 = typeof window !== 'undefined' ? window : null;
    ((_0x3790ab = _0x588797?._lastMx || _0x3a1613), (_0x11cc00 = _0x588797?._lastMy || _0x5cde30));
    if (_0x49afdb) return;
    _0x49afdb = _0x2f0d5e(() => {
      _0x49afdb = 0;
      const _0x19c182 =
        typeof _0x588797?._v2UpdateSidePlusNow === 'function'
          ? _0x588797._v2UpdateSidePlusNow
          : _0x588797?._v2UpdateSidePlus;
      typeof _0x19c182 === 'function' && _0x19c182(_0x3790ab, _0x11cc00);
    });
  }
  return { handleWheel: _0x39cb01 };
}
