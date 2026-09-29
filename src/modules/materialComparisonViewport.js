const MIN_ZOOM = 0.25,
  MAX_ZOOM = 0x6,
  WHEEL_ZOOM_INTENSITY = 0.0015;
function clamp(_0x2d3836, _0x4f1dde, _0x11554e) {
  return Math['min'](_0x11554e, Math['max'](_0x4f1dde, Number(_0x2d3836) || 0x0));
}
function fitAspectWithin(_0x35edb4, _0x3de501) {
  const _0x2fef5f = Math['min'](_0x3de501['width'], _0x3de501['height'] * _0x35edb4),
    _0x32c9fd = _0x2fef5f / _0x35edb4;
  return { width: _0x2fef5f, height: _0x32c9fd, area: _0x2fef5f * _0x32c9fd };
}
export function createMaterialComparisonViewport({
  state: _0x2bb237,
  main: _0x2d4fc0,
  stage: _0x294fbd,
  stageShell: _0x40d9a3,
  viewport: _0x1645fa,
  windowObject: _0x236df3,
}) {
  let _0x56b67a = null,
    _0x4bbac7 = null,
    _0x826a2 = ![];
  function _0x11a157() {
    const _0x23903b = _0x2d4fc0['getBoundingClientRect']?.(),
      _0x275827 = _0x236df3?.['getComputedStyle']?.(_0x40d9a3),
      _0x3deb45 = {
        width: Math['max'](
          0x1,
          Number(_0x2d4fc0['clientWidth'] || _0x23903b?.['width'] || _0x236df3?.['innerWidth'] || 0x0) -
            (parseFloat(_0x275827?.['paddingLeft']) || 0x0) -
            (parseFloat(_0x275827?.['paddingRight']) || 0x0),
        ),
        height: Math['max'](
          0x1,
          Number(_0x2d4fc0['clientHeight'] || _0x23903b?.['height'] || _0x236df3?.['innerHeight'] || 0x0) -
            (parseFloat(_0x275827?.['paddingTop']) || 0x0) -
            (parseFloat(_0x275827?.['paddingBottom']) || 0x0),
        ),
      },
      _0x4438d5 = _0x2bb237['leftAspectRatio'] > 0x0 ? _0x2bb237['leftAspectRatio'] : 0x1,
      _0x489267 = _0x2bb237['rightAspectRatio'] > 0x0 ? _0x2bb237['rightAspectRatio'] : 0x1,
      _0x458683 = fitAspectWithin(_0x4438d5, _0x3deb45),
      _0x2118e2 = fitAspectWithin(_0x489267, _0x3deb45),
      _0x3c1bec =
        _0x2bb237['mode'] === 'side-by-side'
          ? fitAspectWithin(_0x4438d5 + _0x489267, _0x3deb45)
          : _0x458683['area'] >= _0x2118e2['area']
            ? _0x458683
            : _0x2118e2;
    ((_0x2bb237['stageWidth'] = Math['max'](0x1, _0x3c1bec['width'] * _0x2bb237['zoom'])),
      (_0x2bb237['stageHeight'] = Math['max'](0x1, _0x3c1bec['height'] * _0x2bb237['zoom'])),
      _0x294fbd['style']['setProperty'](
        '--material-comparison-stage-width',
        Math['round'](_0x2bb237['stageWidth'] * 0x64) / 0x64 + 'px',
      ),
      _0x294fbd['style']['setProperty'](
        '--material-comparison-stage-height',
        Math['round'](_0x2bb237['stageHeight'] * 0x64) / 0x64 + 'px',
      ),
      (_0x294fbd['dataset']['zoom'] = String(Math['round'](_0x2bb237['zoom'] * 0x3e8) / 0x3e8)));
  }
  function _0x455367() {
    if (_0x826a2) return;
    const _0x47b20c = _0x2d4fc0['getBoundingClientRect']?.(),
      _0x23d8aa = _0x294fbd['getBoundingClientRect']?.();
    if (!_0x47b20c || !_0x23d8aa) return;
    const _0x284c08 = Number(_0x2d4fc0['clientWidth'] || _0x47b20c['width']),
      _0x23a2be = Number(_0x2d4fc0['clientHeight'] || _0x47b20c['height']),
      _0x5ceb4e = (_0x284c08 * _0x2bb237['dividerPercent']) / 0x64,
      _0x379fb6 = clamp(
        ((_0x47b20c['left'] + _0x5ceb4e - _0x23d8aa['left'] - Number(_0x294fbd['clientLeft'] || 0x0)) /
          Math['max'](0x1, Number(_0x294fbd['clientWidth'] || _0x23d8aa['width']))) *
          0x64,
        0x0,
        0x64,
      );
    (_0x1645fa['style']['setProperty']('--material-comparison-divider-x', _0x5ceb4e + 'px'),
      _0x1645fa['style']['setProperty']('--material-comparison-divider-height', _0x23a2be + 'px'),
      _0x294fbd['style']['setProperty']('--material-comparison-divider', _0x379fb6 + '%'));
  }
  function _0x3cdeee() {
    if (_0x826a2) return;
    (_0x11a157(), _0x455367());
  }
  function _0x1c1803() {
    _0x56b67a = null;
    if (_0x826a2 || !_0x4bbac7) return;
    const { zoom: _0x35bdfd, clientX: _0x2b56c9, clientY: _0x6d82dd } = _0x4bbac7;
    _0x4bbac7 = null;
    if (_0x35bdfd === _0x2bb237['zoom']) return;
    const _0x1a411a = _0x294fbd['getBoundingClientRect']?.(),
      _0x1d0906 = clamp(
        (_0x2b56c9 - Number(_0x1a411a?.['left'] || 0x0)) /
          Math['max'](0x1, Number(_0x1a411a?.['width'] || 0x0)),
        0x0,
        0x1,
      ),
      _0x359584 = clamp(
        (_0x6d82dd - Number(_0x1a411a?.['top'] || 0x0)) /
          Math['max'](0x1, Number(_0x1a411a?.['height'] || 0x0)),
        0x0,
        0x1,
      );
    ((_0x2bb237['zoom'] = _0x35bdfd), _0x11a157());
    const _0xc5bc28 = _0x294fbd['getBoundingClientRect']?.();
    if (_0x1a411a && _0xc5bc28) {
      const _0x2bf2e6 =
          Number(_0x2d4fc0['scrollLeft'] || 0x0) +
          _0xc5bc28['left'] +
          _0xc5bc28['width'] * _0x1d0906 -
          _0x2b56c9,
        _0x2c1b3b =
          Number(_0x2d4fc0['scrollTop'] || 0x0) +
          _0xc5bc28['top'] +
          _0xc5bc28['height'] * _0x359584 -
          _0x6d82dd;
      ((_0x2d4fc0['scrollLeft'] = _0x2bf2e6), (_0x2d4fc0['scrollTop'] = _0x2c1b3b));
    }
    _0x455367();
  }
  function _0x198418() {
    if (_0x56b67a !== null) _0x236df3?.['cancelAnimationFrame']?.(_0x56b67a);
    ((_0x56b67a = null), (_0x4bbac7 = null));
  }
  return {
    syncGeometry: _0x3cdeee,
    syncDivider: _0x455367,
    zoomBy(_0x23715a) {
      if (_0x826a2) return;
      const _0x9c1548 = Number(_0x23715a?.['deltaY'] || _0x23715a?.['deltaX'] || 0x0);
      if (!_0x9c1548) return;
      (_0x23715a['preventDefault']?.(), _0x23715a['stopPropagation']?.());
      const _0x3c5a98 = _0x4bbac7?.['zoom'] ?? _0x2bb237['zoom'],
        _0xc4513c =
          Math['round'](
            clamp(_0x3c5a98 * Math['exp'](-_0x9c1548 * WHEEL_ZOOM_INTENSITY), MIN_ZOOM, MAX_ZOOM) * 0x3e8,
          ) / 0x3e8;
      _0x4bbac7 = {
        zoom: _0xc4513c,
        clientX: Number(_0x23715a['clientX']) || 0x0,
        clientY: Number(_0x23715a['clientY']) || 0x0,
      };
      if (_0x56b67a !== null) return;
      if (typeof _0x236df3?.['requestAnimationFrame'] === 'function')
        _0x56b67a = _0x236df3['requestAnimationFrame'](_0x1c1803);
      else _0x1c1803();
    },
    cancelZoom: _0x198418,
    dispose() {
      ((_0x826a2 = !![]), _0x198418());
    },
  };
}
