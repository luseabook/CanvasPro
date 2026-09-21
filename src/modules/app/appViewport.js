import { createViewportFocusController } from '../../core/viewportFocus.js';
import { CANVAS_LOW_ZOOM_LOD_THRESHOLD } from '../canvasImageLod.js';
import { installProviderIconLodController } from '../providerIconLod.js';
const TEXT_LOD_ZOOM = CANVAS_LOW_ZOOM_LOD_THRESHOLD,
  ZOOM_SLIDER_END_DELAY_MS = 160;
export function createAppViewport({
  graphStore: _0x285f5e,
  uiStore: _0x19cc14,
  wrap: _0x159534,
  debugEl: _0x22c3bb,
  zoomSliderEl: _0x15203a,
  zoomPercentEl: _0x24694f,
  fitActionEl: _0x1492be,
} = {}) {
  let _0x55870b = false,
    _0x49c8be = null,
    _0x6ae66b = 0,
    _0x53856d = null,
    _0x1b97dc = true,
    _0x296a38 = 0,
    _0x5e7e46 = null;
  const _0x14eac7 = installProviderIconLodController({ rootEl: _0x159534 || document, store: _0x285f5e });
  function _0xc712a9(_0x5452c8) {
    (document.body.classList.toggle('is-zoom-low', _0x5452c8), _0x14eac7?.scheduleSync?.());
  }
  function _0x594d35(_0x2575e6) {
    const _0x2d4f9b = Math.round(((_0x2575e6 - 0.2) / 1.8) * 100),
      _0x50f77a = Math.max(0, Math.min(_0x2d4f9b, 100));
    if (_0x24694f) _0x24694f.textContent = _0x50f77a + '%';
    if (_0x15203a) _0x15203a.value = String(_0x50f77a);
  }
  function _0xd9e9e9(_0x3accf2) {
    if (_0x1b97dc === _0x3accf2) return;
    _0x1b97dc = _0x3accf2;
    const _0x4b7e33 = document.getElementById('v2-server-disconnect-alert');
    _0x4b7e33 && (_0x4b7e33.style.display = _0x3accf2 ? 'none' : 'block');
  }
  function _0x190844() {
    const _0x425fbd =
      typeof window._v2UpdateSidePlusNow === 'function'
        ? window._v2UpdateSidePlusNow
        : window._v2UpdateSidePlus;
    if (typeof _0x425fbd !== 'function') return;
    const _0x5e8830 = Number(window._lastMx),
      _0x205afd = Number(window._lastMy);
    _0x425fbd(
      Number.isFinite(_0x5e8830) ? _0x5e8830 : undefined,
      Number.isFinite(_0x205afd) ? _0x205afd : undefined,
    );
  }
  function _0x8d21a0() {
    document.body.classList.add('is-zooming');
    if (_0x5e7e46) clearTimeout(_0x5e7e46);
    _0x5e7e46 = setTimeout(() => {
      ((_0x5e7e46 = null), document.body.classList.remove('is-zooming'));
    }, ZOOM_SLIDER_END_DELAY_MS);
  }
  (_0x285f5e.subscribeSelector(
    (_0x4be964) => _0x4be964.viewport?.zoom,
    (_0x37cf7a) => {
      if (typeof _0x37cf7a !== 'number') return;
      if (!_0x55870b) _0x594d35(_0x37cf7a);
      const _0x154c47 = _0x37cf7a <= TEXT_LOD_ZOOM;
      _0x55870b ? (_0x53856d = _0x154c47) : ((_0x53856d = null), _0xc712a9(_0x154c47));
    },
  ),
    _0x19cc14.subscribeSelector(
      (_0x1babd2) => _0x1babd2.isServerConnected,
      (_0x2b1ee0) => {
        _0xd9e9e9(_0x2b1ee0);
      },
    ),
    _0x285f5e.subscribeSelector(
      (_0x2eba62) => {
        const _0x13e707 = _0x2eba62.viewport ?? {},
          _0x4cdef3 = Number(_0x13e707.x) || 0,
          _0x190eb9 = Number(_0x13e707.y) || 0,
          _0x2a76d4 = Number(_0x13e707.zoom) || 1,
          _0x2e2041 = _0x2eba62._nodeCount ?? Object.keys(_0x2eba62.nodes || {}).length;
        return _0x4cdef3 + '|' + _0x190eb9 + '|' + _0x2a76d4 + '|' + _0x2e2041;
      },
      (_0x1a24d1) => {
        if (!_0x22c3bb) return;
        const _0x26cd7b = performance.now();
        if (_0x26cd7b - _0x296a38 < 120) return;
        _0x296a38 = _0x26cd7b;
        const [_0x45a7fa, _0x2eb531, _0x3b017d, _0x1148ce] = String(_0x1a24d1 || '').split('|'),
          _0xab6f3d = Number(_0x45a7fa) || 0,
          _0x317897 = Number(_0x2eb531) || 0,
          _0x246e70 = Number(_0x3b017d) || 1,
          _0x2dac5e = Number(_0x1148ce) || 0;
        _0x22c3bb.textContent =
          'V2 Sandbox | Nodes: ' +
          _0x2dac5e +
          ' | x: ' +
          _0xab6f3d.toFixed(0) +
          ' y: ' +
          _0x317897.toFixed(0) +
          ' z: ' +
          _0x246e70.toFixed(2) +
          ' ';
      },
    ));
  function _0x2b263e(_0x332468, _0x16e51f, _0xb8e87b, _0x59026c, _0x573edb, _0x5dbdef, _0x51e58b = 0x320) {
    _0x49c8be !== null && (cancelAnimationFrame(_0x49c8be), (_0x49c8be = null));
    const _0x1002c7 = ++_0x6ae66b,
      _0x574132 = performance.now();
    ((_0x55870b = true), document.body.classList.add('is-viewport-animating'));
    const _0x2c3d62 = (_0x1ddd7e) => 1 - Math.pow(1 - _0x1ddd7e, 3);
    function _0x2d6667(_0x3b6134) {
      if (_0x1002c7 !== _0x6ae66b) return;
      const _0x339e1d = _0x3b6134 - _0x574132,
        _0x49c6e8 = Math.min(_0x339e1d / _0x51e58b, 1),
        _0x406048 = _0x2c3d62(_0x49c6e8);
      (_0x285f5e.updateViewport(
        _0x332468 + (_0x59026c - _0x332468) * _0x406048,
        _0x16e51f + (_0x573edb - _0x16e51f) * _0x406048,
        _0xb8e87b + (_0x5dbdef - _0xb8e87b) * _0x406048,
      ),
        _0x190844());
      if (_0x49c6e8 < 1) {
        _0x49c8be = requestAnimationFrame(_0x2d6667);
        return;
      }
      ((_0x49c8be = null),
        (_0x55870b = false),
        document.body.classList.remove('is-viewport-animating'),
        _0x53856d !== null && (_0xc712a9(_0x53856d), (_0x53856d = null)),
        _0x285f5e.markViewportPersist?.(),
        _0x594d35(_0x285f5e.getState().viewport.zoom),
        _0x190844());
    }
    _0x49c8be = requestAnimationFrame(_0x2d6667);
  }
  function _0x7e0315() {
    (_0x49c8be !== null && (cancelAnimationFrame(_0x49c8be), (_0x49c8be = null)),
      (_0x6ae66b += 1),
      (_0x55870b = false),
      document.body.classList.remove('is-viewport-animating'),
      _0x53856d !== null && (_0xc712a9(_0x53856d), (_0x53856d = null)));
  }
  const _0x536cfa = createViewportFocusController({
    store: _0x285f5e,
    animateViewport: _0x2b263e,
    cancelAnimation: _0x7e0315,
    containerEl: _0x159534,
  });
  return (
    _0x15203a &&
      _0x15203a.addEventListener('input', (_0x317231) => {
        const _0x2b01de = parseInt(_0x317231.target.value, 10),
          _0x1a8acf = 0.2 + (_0x2b01de / 100) * 1.8,
          { viewport: _0x1ecec1 } = _0x285f5e.getState();
        (_0x536cfa?.clearTrackedFocus('zoom-slider'), _0x8d21a0());
        if (_0x24694f) _0x24694f.textContent = _0x2b01de + '%';
        const _0x53a968 = window.innerWidth / 2,
          _0x37818f = window.innerHeight / 2,
          _0x1e3a97 = _0x53a968 - (_0x53a968 - _0x1ecec1.x) * (_0x1a8acf / _0x1ecec1.zoom),
          _0x2dd384 = _0x37818f - (_0x37818f - _0x1ecec1.y) * (_0x1a8acf / _0x1ecec1.zoom);
        _0x285f5e.updateViewport(_0x1e3a97, _0x2dd384, _0x1a8acf);
      }),
    _0x1492be?.addEventListener('click', () => {
      const _0x1dd574 = Object.keys(_0x285f5e.getState().nodes || {});
      _0x536cfa?.focusNodes(_0x1dd574, 80, 0x320);
    }),
    {
      animateViewport: _0x2b263e,
      cancelViewportAnimation: _0x7e0315,
      focusNode: (..._0x16503a) => _0x536cfa?.focusNode(..._0x16503a),
      focusNodeAtZoomPercent: (..._0x183820) => _0x536cfa?.focusNodeAtZoomPercent(..._0x183820),
      focusNodes: (..._0xc6db82) => _0x536cfa?.focusNodes(..._0xc6db82),
      clearTrackedFocus: (..._0xc6d735) => _0x536cfa?.clearTrackedFocus(..._0xc6d735),
      installWindowBindings(_0x515d1e = window) {
        ((_0x515d1e.v2AnimateViewport = _0x2b263e),
          (_0x515d1e.v2FocusOnNode = (_0x24d646, _0x8c324 = 120, _0x537f17 = 0x5dc, _0x2d35aa) =>
            _0x536cfa?.focusNode(_0x24d646, _0x8c324, _0x537f17, _0x2d35aa)),
          (_0x515d1e.v2FocusOnNodeAtZoomPercent = (_0x54b9c9, _0x916276 = 60, _0x2fe7be = 0x320) =>
            _0x536cfa?.focusNodeAtZoomPercent(_0x54b9c9, _0x916276, _0x2fe7be)),
          (_0x515d1e.v2FocusOnNodes = (_0x1abf12, _0x31f7b6 = 80, _0x26477e = 0x320, _0x119c65) =>
            _0x536cfa?.focusNodes(_0x1abf12, _0x31f7b6, _0x26477e, _0x119c65)));
      },
    }
  );
}
