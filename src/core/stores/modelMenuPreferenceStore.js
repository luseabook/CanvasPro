export const MODEL_MENU_PREFERENCE_STORAGE_KEY = 'aicanvas.modelMenuPreference';
export const MODEL_MENU_PREFERENCE_CHANGED_EVENT = 'aicanvas:model-menu-preference-changed';
export function createModelMenuPreferenceStore({ getWindow: getWindow = () => globalThis['window'] } = {}) {
  let _0xa0b44d = Object['freeze']({ version: '', hideUnconfigured: ![] });
  const _0x368afb = new Set();
  function _0x5236a5(_0xdab5bd) {
    ((_0xa0b44d = Object['freeze'](_0xdab5bd)), _0x368afb['forEach']((_0x2f7383) => _0x2f7383(_0xa0b44d)));
    const _0xc31f04 = getWindow(),
      _0x50cafb = _0xc31f04?.['CustomEvent'] || globalThis['CustomEvent'];
    return (
      _0xc31f04?.['dispatchEvent'] &&
        _0x50cafb &&
        _0xc31f04['dispatchEvent'](new _0x50cafb(MODEL_MENU_PREFERENCE_CHANGED_EVENT)),
      _0xa0b44d
    );
  }
  function _0x18f68e(_0x5c9711) {
    try {
      getWindow()?.['localStorage']?.['setItem'](
        MODEL_MENU_PREFERENCE_STORAGE_KEY,
        JSON['stringify'](_0x5c9711),
      );
    } catch {}
    return _0x5236a5(_0x5c9711);
  }
  return {
    getState: () => _0xa0b44d,
    initialize(_0x3f5b9d) {
      const _0x5bb51a = String(_0x3f5b9d || '')
        ['trim']()
        ['replace'](/^[vV]/, '');
      if (!_0x5bb51a || _0x5bb51a === _0xa0b44d['version']) return _0xa0b44d;
      let _0x1fdd91;
      try {
        _0x1fdd91 = JSON['parse'](
          getWindow()?.['localStorage']?.['getItem'](MODEL_MENU_PREFERENCE_STORAGE_KEY) || 'null',
        );
      } catch {
        _0x1fdd91 = null;
      }
      return _0x18f68e({
        version: _0x5bb51a,
        hideUnconfigured: _0x1fdd91?.['version'] === _0x5bb51a && _0x1fdd91?.['hideUnconfigured'] === !![],
      });
    },
    setHideUnconfigured(_0x288de5) {
      if (!_0xa0b44d['version']) return _0xa0b44d;
      const _0x58cf6e = _0x288de5 === !![];
      if (_0x58cf6e === _0xa0b44d['hideUnconfigured']) return _0xa0b44d;
      return _0x18f68e({ ..._0xa0b44d, hideUnconfigured: _0x58cf6e });
    },
    subscribe(_0x9bae1f) {
      return (_0x368afb['add'](_0x9bae1f), () => _0x368afb['delete'](_0x9bae1f));
    },
  };
}
export const modelMenuPreferenceStore = createModelMenuPreferenceStore();
