export function createApiRouteSelection({
  buttons: _0x3f64ff,
  urlElement: _0x70534b,
  routes: _0x13570c,
  resolveConfig: _0x3737b0,
  getButtonRouteId: _0x280899,
  formatCustomUrl: _0x399905,
}) {
  let _0x580f1b = '';
  function _0x9eec16(_0x31bdd7, _0x26ec3e = '') {
    const _0x40b7dc = _0x13570c['find']((_0x187a9a) => _0x187a9a['id'] === _0x31bdd7);
    ((_0x580f1b = _0x40b7dc?.['id'] || ''),
      _0x3f64ff['forEach']((_0x2ebd5d) => {
        const _0xf096fd = !!_0x40b7dc && _0x280899(_0x2ebd5d) === _0x40b7dc['id'];
        (_0x2ebd5d['classList']['toggle']('is-active', _0xf096fd),
          _0x2ebd5d['setAttribute']('aria-pressed', String(_0xf096fd)));
      }),
      _0x70534b && (_0x70534b['textContent'] = _0x40b7dc?.['apiUrl'] || _0x399905(_0x26ec3e)));
  }
  return {
    hydrate(_0x575a47 = {}) {
      const _0x396c7f = _0x3737b0(_0x575a47);
      _0x9eec16(_0x396c7f['routeId'], _0x396c7f['apiUrl']);
    },
    collect(_0xfbde9 = {}) {
      const _0x1f2f12 = _0x13570c['find']((_0x11fcc0) => _0x11fcc0['id'] === _0x580f1b),
        _0x271194 = { ..._0xfbde9 };
      if (_0x1f2f12) Object['assign'](_0x271194, { routeId: _0x1f2f12['id'], apiUrl: _0x1f2f12['apiUrl'] });
      else {
        if (_0x271194['apiUrl']) delete _0x271194['routeId'];
      }
      return _0x271194;
    },
    bind(_0x49fd9b) {
      _0x3f64ff['forEach']((_0xba025a) => {
        _0xba025a['addEventListener']('click', () => {
          (_0x9eec16(_0x280899(_0xba025a)), _0x49fd9b());
        });
      });
    },
  };
}
