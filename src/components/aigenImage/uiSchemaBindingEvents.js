import { bindRunningHubInstanceDevMode } from './runningHubInstanceDevModeBinding.js';
export function notifyUiSchemaMenuAfterOpen(
  _0x1046e1,
  { fieldEl: _0x415795, popup: _0x5c10a0, shouldOpen: _0x5288b1 } = {},
) {
  if (!_0x5288b1) return;
  _0x1046e1['dispatchEvent'](
    new CustomEvent('ui-schema-menu-after-open', { detail: { fieldEl: _0x415795, popup: _0x5c10a0 } }),
  );
}
export function bindUiSchemaBindingEvents(
  _0x95078,
  {
    handleClick: _0x984839,
    handleMouseDown: _0x2354c5,
    handleInput: _0x5a9abb,
    invalidatePendingMenuRestore: _0x499366,
    commitValue: _0x36ad1a,
    getNodeData: _0x4e08db,
    getNodeFieldValue: _0x287cb7,
  } = {},
) {
  const _0x4ea4b2 = (_0x3715b8) => {
      const _0x1def19 = _0x3715b8?.['detail']?.['nativeEvent'],
        _0x4461c1 = _0x3715b8?.['detail']?.['fieldEl'] || null;
      if (!_0x1def19) return;
      if (_0x1def19['type'] === 'click') {
        _0x984839(_0x1def19, _0x4461c1);
        return;
      }
      if (_0x1def19['type'] === 'mousedown') {
        _0x2354c5(_0x1def19, _0x4461c1);
        return;
      }
      (_0x1def19['type'] === 'input' || _0x1def19['type'] === 'change') && _0x5a9abb(_0x1def19, _0x4461c1);
    },
    _0x3a89a7 = _0x95078['ownerDocument'] || (typeof document !== 'undefined' ? document : null),
    _0x4272f5 = (_0x209889) => {
      const _0x249084 = _0x209889['target']?.['closest']?.('.aigen-ui-schema-popup-portal'),
        _0x13bbc0 = _0x249084?.['__uiSchemaPortalRoot'] === _0x95078;
      typeof _0x95078['contains'] === 'function' &&
        !_0x95078['contains'](_0x209889['target']) &&
        !_0x13bbc0 &&
        _0x499366();
    };
  (_0x95078['addEventListener']('click', _0x984839, !![]),
    _0x95078['addEventListener']('mousedown', _0x2354c5, !![]),
    _0x95078['addEventListener']('input', _0x5a9abb),
    _0x95078['addEventListener']('change', _0x5a9abb),
    _0x95078['addEventListener']('ui-schema-portaled-interaction', _0x4ea4b2),
    _0x3a89a7?.['addEventListener']?.('click', _0x4272f5, !![]));
  const _0x166ce5 = bindRunningHubInstanceDevMode(_0x95078, {
    commitValue: _0x36ad1a,
    getNodeData: _0x4e08db,
    getNodeFieldValue: _0x287cb7,
  });
  return () => {
    (_0x166ce5(),
      _0x95078['removeEventListener']('click', _0x984839, !![]),
      _0x95078['removeEventListener']('mousedown', _0x2354c5, !![]),
      _0x95078['removeEventListener']('input', _0x5a9abb),
      _0x95078['removeEventListener']('change', _0x5a9abb),
      _0x95078['removeEventListener']('ui-schema-portaled-interaction', _0x4ea4b2),
      _0x3a89a7?.['removeEventListener']?.('click', _0x4272f5, !![]));
  };
}
