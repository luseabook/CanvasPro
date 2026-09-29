import { loadCursorHotspot } from '../../api/cursorAssetApi.js';
const controllers = new WeakMap(),
  EDGE_CURSOR_PROPERTY = '--viewport-edge-cursor',
  EMPTY_CURSOR =
    'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%221%22 height=%221%22/%3E") 0 0';
export function parseCursorImage(_0x2ced33) {
  const _0x691b44 = String(_0x2ced33)
    ['trim']()
    ['match'](/^url\(["']([^"']+)["']\)(?:\s+(\d+)\s+(\d+))?/);
  if (!_0x691b44) return null;
  return {
    url: _0x691b44[0x1],
    hotspot: _0x691b44[0x2] == null ? null : { x: Number(_0x691b44[0x2]), y: Number(_0x691b44[0x3]) },
  };
}
export function cursorCrossesViewport(_0xcfac42, _0x2af6f9, _0x2c72bd) {
  const _0x2d6355 = _0xcfac42['x'] - _0x2af6f9['hotspot']['x'],
    _0x5937af = _0xcfac42['y'] - _0x2af6f9['hotspot']['y'];
  return _0x2af6f9['width'] > 0x20 || _0x2af6f9['height'] > 0x20
    ? _0x2d6355 < 0x0 ||
        _0x5937af < 0x0 ||
        _0x2d6355 + _0x2af6f9['width'] > _0x2c72bd['width'] ||
        _0x5937af + _0x2af6f9['height'] > _0x2c72bd['height']
    : ![];
}
export function initViewportCursor(_0x5ea4fa = globalThis['document']) {
  const _0x221a73 = _0x5ea4fa?.['defaultView'];
  if (!_0x221a73?.['requestAnimationFrame'] || !_0x5ea4fa?.['createElement']) return null;
  if (controllers['has'](_0x5ea4fa)) return controllers['get'](_0x5ea4fa);
  const _0x4faa47 = _0x5ea4fa['documentElement'],
    _0x10d7c9 = new Map(),
    _0x2f940a = _0x5ea4fa['createElement']('div');
  if (typeof _0x2f940a['showPopover'] !== 'function') return null;
  ((_0x2f940a['className'] = 'viewport-cursor-layer'),
    _0x2f940a['setAttribute']('popover', 'manual'),
    _0x2f940a['setAttribute']('aria-hidden', 'true'));
  const _0x48f078 = _0x5ea4fa['createElement']('img');
  ((_0x48f078['className'] = 'viewport-cursor-image'),
    (_0x48f078['alt'] = ''),
    (_0x48f078['draggable'] = ![]),
    _0x2f940a['appendChild'](_0x48f078),
    _0x5ea4fa['body']['appendChild'](_0x2f940a));
  let _0x369080 = null,
    _0x45ff9a = 0x0,
    _0x5f0cf6 = ![],
    _0x5e8861 = ![],
    _0x436149 = null;
  const _0x238401 = [];
  function _0x4272ef(_0x1f239c = !![]) {
    if (_0x1f239c && _0x4faa47['style']['getPropertyValue'](EDGE_CURSOR_PROPERTY))
      _0x4faa47['style']['removeProperty'](EDGE_CURSOR_PROPERTY);
    if (_0x5e8861) _0x2f940a['hidePopover']();
    _0x5e8861 = ![];
  }
  function _0x1e360d() {
    if (!_0x5f0cf6 && _0x369080 && !_0x45ff9a) _0x45ff9a = _0x221a73['requestAnimationFrame'](_0x325894);
  }
  function _0x2a8b4b(_0x4b3779) {
    const _0xfb3e4f = parseCursorImage(_0x4b3779);
    if (!_0xfb3e4f) return null;
    const _0x25c82e = JSON['stringify'](_0xfb3e4f);
    if (_0x10d7c9['has'](_0x25c82e)) return _0x10d7c9['get'](_0x25c82e);
    const _0xf75013 = new URL(_0xfb3e4f['url'], _0x5ea4fa['baseURI']);
    if (
      !(_0xf75013['protocol'] === 'data:' && _0xfb3e4f['url']['startsWith']('data:image/svg+xml')) &&
      !(_0xf75013['origin'] === _0x221a73['location']['origin'] && _0xf75013['pathname']['endsWith']('.cur'))
    )
      return null;
    const _0x30e346 = { ready: ![] };
    _0x10d7c9['set'](_0x25c82e, _0x30e346);
    if (_0x10d7c9['size'] > 0x80) _0x10d7c9['delete'](_0x10d7c9['keys']()['next']()['value']);
    const _0x55621a = new _0x221a73['Image']();
    return (
      (_0x55621a['src'] = _0xf75013['href']),
      Promise['all']([_0x55621a['decode'](), _0xfb3e4f['hotspot'] || loadCursorHotspot(_0xf75013['href'])])
        ['then'](([, _0x146970]) => {
          if (_0x5f0cf6) return;
          (Object['assign'](_0x30e346, {
            ready: !![],
            source: _0x55621a,
            hotspot: _0x146970,
            width: _0x55621a['naturalWidth'],
            height: _0x55621a['naturalHeight'],
          }),
            _0x1e360d());
        })
        ['catch'](() => {}),
      _0x30e346
    );
  }
  function _0x325894() {
    _0x45ff9a = 0x0;
    if (!_0x369080 || _0x5f0cf6) return _0x4272ef();
    const _0x386f82 = _0x5ea4fa['elementFromPoint'](_0x369080['x'], _0x369080['y']);
    if (!_0x386f82) return _0x4272ef();
    _0x386f82 !== _0x436149 &&
      (_0x3d6110['disconnect'](),
      _0x3d6110['observe'](_0x4faa47, { attributes: !![], attributeFilter: ['style', 'class'] }),
      _0x3d6110['observe'](_0x386f82, { attributes: !![], attributeFilter: ['style', 'class', 'disabled'] }),
      (_0x436149 = _0x386f82));
    const _0x4ab84c = _0x221a73['getComputedStyle'](_0x386f82);
    let _0x276fee = _0x4ab84c['cursor'];
    if (
      _0x386f82['offsetWidth'] > _0x386f82['clientWidth'] ||
      _0x386f82['offsetHeight'] > _0x386f82['clientHeight']
    ) {
      const _0x4cae31 = _0x386f82['getBoundingClientRect'](),
        _0x377667 = _0x369080['x'] - _0x4cae31['left'],
        _0x5b8061 = _0x369080['y'] - _0x4cae31['top'],
        _0xc71a75 =
          _0x386f82['scrollHeight'] > _0x386f82['clientHeight'] &&
          (_0x377667 < _0x386f82['clientLeft'] ||
            _0x377667 >= _0x386f82['clientLeft'] + _0x386f82['clientWidth']),
        _0x944e12 =
          _0x386f82['scrollWidth'] > _0x386f82['clientWidth'] &&
          _0x5b8061 >= _0x386f82['clientTop'] + _0x386f82['clientHeight'];
      if (_0xc71a75 || _0x944e12)
        _0x276fee = _0x221a73['getComputedStyle'](_0x386f82, '::-webkit-scrollbar')['cursor'];
    }
    if ((_0x276fee['match'](/url\(/g) || [])['length'] < 0x2) return _0x4272ef();
    const _0x3a862a = _0x2a8b4b(_0x276fee);
    if (!_0x3a862a?.['ready']) return _0x4272ef();
    if (_0x4faa47['style']['getPropertyValue'](EDGE_CURSOR_PROPERTY) !== EMPTY_CURSOR)
      _0x4faa47['style']['setProperty'](EDGE_CURSOR_PROPERTY, EMPTY_CURSOR);
    if (
      !cursorCrossesViewport(_0x369080, _0x3a862a, {
        width: _0x221a73['innerWidth'],
        height: _0x221a73['innerHeight'],
      })
    )
      return _0x4272ef(![]);
    _0x48f078['src'] !== _0x3a862a['source']['src'] &&
      ((_0x48f078['src'] = _0x3a862a['source']['src']),
      (_0x48f078['style']['width'] = _0x3a862a['width'] + 'px'),
      (_0x48f078['style']['height'] = _0x3a862a['height'] + 'px'));
    _0x48f078['style']['transform'] =
      'translate(' +
      (_0x369080['x'] - _0x3a862a['hotspot']['x']) +
      'px, ' +
      (_0x369080['y'] - _0x3a862a['hotspot']['y']) +
      'px)';
    if (!_0x5e8861) _0x2f940a['showPopover']();
    _0x5e8861 = !![];
  }
  function _0x4b9371() {
    _0x369080 = null;
    if (_0x45ff9a) _0x221a73['cancelAnimationFrame'](_0x45ff9a);
    ((_0x45ff9a = 0x0), _0x4272ef());
  }
  function _0x13948d(_0x5cb91b, _0x910606, _0x4c7505) {
    (_0x5cb91b['addEventListener'](_0x910606, _0x4c7505, { capture: !![], passive: !![] }),
      _0x238401['push'](() => _0x5cb91b['removeEventListener'](_0x910606, _0x4c7505, !![])));
  }
  function _0x85fa01(_0x196b9b) {
    if (_0x196b9b['pointerType'] === 'touch') return;
    _0x369080 = { x: _0x196b9b['clientX'], y: _0x196b9b['clientY'] };
    if (
      _0x196b9b['type'] === 'pointermove' &&
      !_0x5e8861 &&
      !_0x45ff9a &&
      _0x196b9b['target'] === _0x436149 &&
      _0x369080['x'] > 0x80 &&
      _0x369080['y'] > 0x80 &&
      _0x369080['x'] < _0x221a73['innerWidth'] - 0x80 &&
      _0x369080['y'] < _0x221a73['innerHeight'] - 0x80
    )
      return;
    if (_0x45ff9a) _0x221a73['cancelAnimationFrame'](_0x45ff9a);
    _0x325894();
  }
  (_0x13948d(_0x5ea4fa, 'pointermove', _0x85fa01),
    _0x13948d(_0x5ea4fa, 'pointerout', (_0x340964) => {
      if (!_0x340964['relatedTarget']) _0x4b9371();
    }),
    _0x13948d(_0x5ea4fa, 'pointercancel', _0x4b9371),
    _0x13948d(_0x5ea4fa, 'pointerover', _0x85fa01),
    _0x13948d(_0x5ea4fa, 'pointerdown', _0x85fa01),
    _0x13948d(_0x5ea4fa, 'pointerup', _0x85fa01),
    _0x13948d(_0x221a73, 'blur', _0x4b9371),
    _0x13948d(_0x5ea4fa, 'visibilitychange', () => {
      if (_0x5ea4fa['hidden']) _0x4b9371();
    }),
    _0x13948d(_0x221a73, 'resize', _0x1e360d),
    _0x13948d(_0x5ea4fa, 'scroll', _0x1e360d));
  const _0x3d6110 = new _0x221a73['MutationObserver'](_0x1e360d);
  _0x3d6110['observe'](_0x4faa47, { attributes: !![], attributeFilter: ['style', 'class'] });
  const _0x582244 = {
    preload(_0xa2d0f0) {
      (_0xa2d0f0['forEach'](_0x2a8b4b), _0x1e360d());
    },
    destroy() {
      ((_0x5f0cf6 = !![]),
        _0x4b9371(),
        _0x238401['forEach']((_0xf8a8c2) => _0xf8a8c2()),
        _0x3d6110['disconnect'](),
        _0x10d7c9['clear'](),
        _0x2f940a['remove'](),
        controllers['delete'](_0x5ea4fa));
    },
  };
  return (
    _0x13948d(_0x221a73, 'pagehide', (_0x2295bb) => {
      if (_0x2295bb['persisted']) _0x4b9371();
      else _0x582244['destroy']();
    }),
    controllers['set'](_0x5ea4fa, _0x582244),
    _0x582244
  );
}
